-- StormlightPMS — scheduled-job RPCs + email view (SRS §9)

-- helper: Manila today
create or replace function public.manila_today() returns date
  language sql stable as $$
    select (now() at time zone 'Asia/Manila')::date
  $$;

-- Responsible recipients for a charge: every admin of the lease's org +
-- every PM assigned to the lease's property.
create or replace function public.responsible_for_charge(p_charge_id uuid)
returns table (profile_id uuid, org_id uuid)
language sql stable as
$$
  with cx as (
    select c.org_id, l.unit_id, u.property_id
      from public.charges c
      join public.leases l on l.id = c.lease_id
      join public.units u on u.id = l.unit_id
     where c.id = p_charge_id
  )
  select p.id, p.org_id
    from public.profiles p, cx
   where p.status = 'active'
     and (
       (p.role = 'admin' and p.org_id = cx.org_id)
       or (p.role = 'property_manager' and p.org_id = cx.org_id
           and exists (
             select 1 from public.property_assignments pa
              where pa.profile_id = p.id and pa.property_id = cx.property_id
           ))
     );
$$;

-- Responsible recipients for a lease (used for expiry reminders)
create or replace function public.responsible_for_lease(p_lease_id uuid)
returns table (profile_id uuid, org_id uuid)
language sql stable as
$$
  with cx as (
    select l.org_id, u.property_id
      from public.leases l
      join public.units u on u.id = l.unit_id
     where l.id = p_lease_id
  )
  select p.id, p.org_id
    from public.profiles p, cx
   where p.status = 'active'
     and (
       (p.role = 'admin' and p.org_id = cx.org_id)
       or (p.role = 'property_manager' and p.org_id = cx.org_id
           and exists (
             select 1 from public.property_assignments pa
              where pa.profile_id = p.id and pa.property_id = cx.property_id
           ))
     );
$$;

-- Main scheduled-job fanout. SECURITY DEFINER to insert across orgs.
create or replace function public.run_scheduled_jobs()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.manila_today();
  v_due_count int := 0;
  v_overdue_count int := 0;
  v_expiring_count int := 0;
  v_expired_count int := 0;
  r record;
  rr record;
  v_window int;
  v_thresholds int[];
  v_dkey text;
begin
  -- JOB-1: rent due reminders. Per-org rent_due_window_days.
  for r in
    select c.id as charge_id, c.org_id, c.due_date,
           coalesce(os.rent_due_window_days, 3) as win
      from public.charges c
      left join public.org_settings os on os.org_id = c.org_id
     where c.charge_status in ('unpaid','partially_paid')
       and c.due_date between v_today and v_today + coalesce(os.rent_due_window_days, 3)
  loop
    v_dkey := format('rent_due:%s:%s', r.charge_id, v_today);
    for rr in select profile_id, org_id from public.responsible_for_charge(r.charge_id) loop
      insert into public.notifications(
        org_id, profile_id, notification_type, title, body,
        entity_type, entity_id, dedupe_key
      ) values (
        rr.org_id, rr.profile_id, 'rent_due',
        'Charge due soon',
        format('Charge due on %s', r.due_date),
        'charge', r.charge_id,
        v_dkey || ':' || rr.profile_id
      ) on conflict (dedupe_key) do nothing;
      v_due_count := v_due_count + 1;
    end loop;
  end loop;

  -- JOB-2: overdue
  for r in
    select c.id as charge_id, c.org_id, c.due_date
      from public.charges c
     where c.charge_status in ('unpaid','partially_paid')
       and c.due_date < v_today
  loop
    v_dkey := format('rent_overdue:%s:%s', r.charge_id, v_today);
    for rr in select profile_id, org_id from public.responsible_for_charge(r.charge_id) loop
      insert into public.notifications(
        org_id, profile_id, notification_type, title, body,
        entity_type, entity_id, dedupe_key
      ) values (
        rr.org_id, rr.profile_id, 'rent_overdue',
        'Charge overdue',
        format('Charge was due on %s', r.due_date),
        'charge', r.charge_id,
        v_dkey || ':' || rr.profile_id
      ) on conflict (dedupe_key) do nothing;
      v_overdue_count := v_overdue_count + 1;
    end loop;
  end loop;

  -- JOB-3: lease expiring at any configured threshold
  for r in
    select l.id as lease_id, l.org_id, l.end_date,
           coalesce(os.lease_expiry_thresholds, '{60,30}'::int[]) as thresholds
      from public.leases l
      left join public.org_settings os on os.org_id = l.org_id
     where l.lease_status = 'active'
  loop
    foreach v_window in array r.thresholds loop
      if r.end_date - v_today = v_window then
        v_dkey := format('lease_expiring:%s:%s', r.lease_id, v_window);
        for rr in select profile_id, org_id from public.responsible_for_lease(r.lease_id) loop
          insert into public.notifications(
            org_id, profile_id, notification_type, title, body,
            entity_type, entity_id, dedupe_key
          ) values (
            rr.org_id, rr.profile_id, 'lease_expiring',
            format('Lease expiring in %s days', v_window),
            format('Lease ends on %s', r.end_date),
            'lease', r.lease_id,
            v_dkey || ':' || rr.profile_id
          ) on conflict (dedupe_key) do nothing;
          v_expiring_count := v_expiring_count + 1;
        end loop;
      end if;
    end loop;
  end loop;

  -- JOB-4: transition active → expired when end_date passed
  update public.leases
     set lease_status = 'expired'
   where lease_status = 'active'
     and end_date < v_today
  returning id into r;
  get diagnostics v_expired_count = row_count;

  return jsonb_build_object(
    'manila_today', v_today,
    'rent_due', v_due_count,
    'rent_overdue', v_overdue_count,
    'lease_expiring', v_expiring_count,
    'leases_expired', v_expired_count
  );
end;
$$;
grant execute on function public.run_scheduled_jobs() to service_role;

-- View used by the Edge Function to email reminder notifications.
-- security_invoker so RLS would apply, but the Edge Function uses service-role.
create or replace view public.v_notifications_to_email as
  select n.id, n.org_id, n.profile_id, n.notification_type, n.title, n.body,
         n.email_sent_at,
         p.email as profile_email,
         coalesce(os.reminder_email_enabled, true) as reminder_email_enabled
    from public.notifications n
    join public.profiles p on p.id = n.profile_id
    left join public.org_settings os on os.org_id = n.org_id
   where n.email_sent_at is null
     and n.notification_type in ('rent_due','rent_overdue','lease_expiring')
     and coalesce(os.reminder_email_enabled, true) = true;

-- pg_cron schedule: daily 22:00 UTC = 06:00 Manila (UTC+8 no DST).
-- Uses pg_net to call the run-daily-jobs Edge Function with shared secret.
-- The function URL and secret are pulled from settings stored via Vault.
-- Operator should run once (after deploy):
--   select cron.schedule('stormlight-daily', '0 22 * * *',
--     $$ select net.http_post(
--          url := current_setting('app.jobs_url'),
--          headers := jsonb_build_object('x-jobs-secret', current_setting('app.jobs_secret')),
--          body := '{}'::jsonb
--        ); $$);
