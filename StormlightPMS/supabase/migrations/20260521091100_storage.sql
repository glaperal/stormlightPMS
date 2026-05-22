-- StormlightPMS — storage buckets + RLS (SRS §5.6)

insert into storage.buckets (id, name, public) values
  ('documents', 'documents', false),
  ('payment-proofs', 'payment-proofs', false),
  ('property-photos', 'property-photos', false)
on conflict (id) do nothing;

-- Object paths are org-prefixed: {bucket}/{org_id}/{entity_id}/{filename}
-- (storage.foldername(name))[1] = org_id

drop policy if exists "stormlight_objects_super" on storage.objects;
create policy "stormlight_objects_super" on storage.objects
  for all to authenticated
  using (
    bucket_id in ('documents','payment-proofs','property-photos')
    and public.app_role() = 'superadmin'
  )
  with check (
    bucket_id in ('documents','payment-proofs','property-photos')
    and public.app_role() = 'superadmin'
  );

drop policy if exists "stormlight_objects_org" on storage.objects;
create policy "stormlight_objects_org" on storage.objects
  for all to authenticated
  using (
    bucket_id in ('documents','payment-proofs','property-photos')
    and public.app_role() in ('admin','property_manager')
    and (storage.foldername(name))[1] = (select public.app_org())::text
  )
  with check (
    bucket_id in ('documents','payment-proofs','property-photos')
    and public.app_role() in ('admin','property_manager')
    and (storage.foldername(name))[1] = (select public.app_org())::text
  );
