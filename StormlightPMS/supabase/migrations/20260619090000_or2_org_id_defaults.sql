-- StormlightPMS — OR-2 (SRS §12, ACCEPTED): default org_id from the JWT.
-- Sets org_id default to public.app_org() on every client-insertable operational
-- table so the client never has to send org_id (and cannot spoof it). RLS
-- `with check (org_id = (select app_org()))` still enforces correctness; this
-- removes a whole class of "wrong-org" insert bugs and lets the SPA omit org_id.
--
-- app_org() reads only auth.jwt(); in service-role/trigger contexts with no user
-- JWT it returns null, but every such insert (jobs, handle_new_user, triggers)
-- already sets org_id explicitly, so the default is never relied on there.
--
-- Excluded by design: organizations (has no org_id), profiles (set by
-- handle_new_user from user_metadata), org_settings (trigger-created),
-- audit_log + notifications (written by SECURITY DEFINER triggers / jobs).

alter table public.properties            alter column org_id set default public.app_org();
alter table public.property_assignments  alter column org_id set default public.app_org();
alter table public.units                 alter column org_id set default public.app_org();
alter table public.tenants               alter column org_id set default public.app_org();
alter table public.leases                alter column org_id set default public.app_org();
alter table public.charges               alter column org_id set default public.app_org();
alter table public.payments              alter column org_id set default public.app_org();
alter table public.payment_allocations   alter column org_id set default public.app_org();
alter table public.deposit_deductions    alter column org_id set default public.app_org();
alter table public.maintenance_requests  alter column org_id set default public.app_org();
alter table public.documents             alter column org_id set default public.app_org();
