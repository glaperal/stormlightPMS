-- Stormlight PMS — Vision Homes Inc. seed data
-- Reflects Vision Building 1 lease book as of 2026-04-17.
-- Source: "Vision Homes - Areas & Rates 2026" spreadsheet.

-- Landlord group -------------------------------------------------------
insert into landlord_groups (id, name, vat_registered, address)
values (
  '11111111-1111-1111-1111-111111111111',
  'Vision Homes Inc.',
  true,
  'Block 15 Lot 1 & 2, J.B. Tan Ave / Estanislao St, BF Resort Village, Talon Dos II, Las Piñas City'
)
on conflict (id) do nothing;

-- Property -------------------------------------------------------------
insert into properties (id, group_id, name, type, address)
values (
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111111',
  'Vision Building 1',
  'Commercial',
  'Block 15 Lot 1 & 2, J.B. Tan Ave / Estanislao St, BF Resort Village, Talon Dos II, Las Piñas City'
)
on conflict (id) do nothing;

-- Units: 15 commercial rooms + 6 parking slots -------------------------
-- UUIDs use a readable prefix so we can reference them below.
-- Commercial units: 3333..01<room>
-- Parking slots:    4444..0P<n>
insert into units (id, group_id, property_id, name, kind, area_sqm, status, notes) values
  -- Ground
  ('33333333-3333-3333-3333-333333330101', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '101', 'Commercial', 71.19, 'Occupied', 'Packaged with 102, 103 — Arte Manila Salon'),
  ('33333333-3333-3333-3333-333333330102', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '102', 'Commercial', 79.63, 'Occupied', 'Packaged with 101, 103 — Arte Manila Salon'),
  ('33333333-3333-3333-3333-333333330103', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '103', 'Commercial', 85.54, 'Occupied', 'Packaged with 101, 102 — Arte Manila Salon'),
  ('33333333-3333-3333-3333-333333330104', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '104', 'Commercial', 47.52, 'Vacant', null),
  ('33333333-3333-3333-3333-333333330105', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '105', 'Commercial', 47.87, 'Occupied', null),
  -- Second
  ('33333333-3333-3333-3333-333333330201', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '201', 'Commercial', 82.46, 'Occupied', null),
  ('33333333-3333-3333-3333-333333330202', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '202', 'Commercial', 60.28, 'Occupied', null),
  ('33333333-3333-3333-3333-333333330203', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '203', 'Commercial', 59.01, 'Occupied', 'Used by 201 Grace Life — no rental fee, with Sir Oli''s permission'),
  ('33333333-3333-3333-3333-333333330204', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '204', 'Commercial', 47.52, 'Vacant', null),
  ('33333333-3333-3333-3333-333333330205', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '205', 'Commercial', 41.86, 'Vacant', null),
  -- Third
  ('33333333-3333-3333-3333-333333330301', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '301', 'Commercial', 83.59, 'Vacant', null),
  ('33333333-3333-3333-3333-333333330302', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '302', 'Commercial', 60.28, 'Vacant', null),
  ('33333333-3333-3333-3333-333333330303', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '303', 'Commercial', 59.01, 'Vacant', null),
  ('33333333-3333-3333-3333-333333330304', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '304', 'Commercial', 47.52, 'Occupied', null),
  ('33333333-3333-3333-3333-333333330305', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '305', 'Commercial', 41.86, 'Occupied', null),
  -- Parking slots: 6 placeholders (4 typically used per contracts, 2 vacant).
  -- Adjust the count to match reality once confirmed.
  ('44444444-4444-4444-4444-444444440001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Parking 01', 'Parking', null, 'Occupied', 'Assigned to Arte Manila Salon'),
  ('44444444-4444-4444-4444-444444440002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Parking 02', 'Parking', null, 'Occupied', 'Assigned to Arte Manila Salon'),
  ('44444444-4444-4444-4444-444444440003', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Parking 03', 'Parking', null, 'Occupied', 'Paid by Bright Discovery Child Development'),
  ('44444444-4444-4444-4444-444444440004', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Parking 04', 'Parking', null, 'Occupied', 'Paid by Bright Discovery Child Development'),
  ('44444444-4444-4444-4444-444444440005', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Parking 05', 'Parking', null, 'Vacant', null),
  ('44444444-4444-4444-4444-444444440006', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Parking 06', 'Parking', null, 'Vacant', null)
on conflict (property_id, name) do nothing;

-- Tenants --------------------------------------------------------------
insert into tenants (id, group_id, name, type) values
  ('55555555-5555-5555-5555-555555555001', '11111111-1111-1111-1111-111111111111', 'Arte Manila Salon',                'Corp'),
  ('55555555-5555-5555-5555-555555555002', '11111111-1111-1111-1111-111111111111', 'GMMK Enterprise Inc.',             'Corp'),
  ('55555555-5555-5555-5555-555555555003', '11111111-1111-1111-1111-111111111111', 'Grace Life Fellowship',            'Corp'),
  ('55555555-5555-5555-5555-555555555004', '11111111-1111-1111-1111-111111111111', 'Bright Discovery Child Development','Corp'),
  ('55555555-5555-5555-5555-555555555005', '11111111-1111-1111-1111-111111111111', 'Smarter Minds',                    'Corp'),
  ('55555555-5555-5555-5555-555555555006', '11111111-1111-1111-1111-111111111111', 'Dr. Chua (Dentist)',               'Ind')
on conflict (id) do nothing;

-- Leases (2026 contract year) ------------------------------------------
-- Arte Manila Salon — packaged 101+102+103 at ₱138,506 non-VAT, dues packaged,
-- 2 assigned parking, Aug 1 2025 – Jul 31 2026. Split across the 3 units
-- proportionally by area (236 sqm total → ₱586.89/sqm).
insert into leases (id, group_id, unit_id, tenant_id, base_rent, dues, vat_rate, ewt_rate, start_date, end_date, status, notes) values
  ('66666666-6666-6666-6666-666666660101', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330101', '55555555-5555-5555-5555-555555555001',
    41780.10, 0, 0, 0, '2025-08-01', '2026-07-31', 'Active',
    'Packaged 101/102/103 @ ₱138,506 non-VAT; this row is the 101 portion (71.19 sqm × ₱586.89/sqm).'),
  ('66666666-6666-6666-6666-666666660102', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330102', '55555555-5555-5555-5555-555555555001',
    46732.02, 0, 0, 0, '2025-08-01', '2026-07-31', 'Active',
    'Packaged 101/102/103; 102 portion (79.63 sqm × ₱586.89/sqm).'),
  ('66666666-6666-6666-6666-666666660103', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330103', '55555555-5555-5555-5555-555555555001',
    50203.77, 0, 0, 0, '2025-08-01', '2026-07-31', 'Active',
    'Packaged 101/102/103; 103 portion (85.54 sqm × ₱586.89/sqm).'),
  -- GMMK Enterprise Inc. — 105, ₱450/sqm × 47.87 = ₱21,541.50 + VAT, dues ₱1,292.49 + VAT.
  -- Extended 5 months, through Apr 30 2026.
  ('66666666-6666-6666-6666-666666660105', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330105', '55555555-5555-5555-5555-555555555002',
    21541.50, 1292.49, 12.00, 0, '2024-12-01', '2026-04-30', 'Active',
    '₱450/sqm × 47.87 sqm; dues ₱27/sqm. Extended 5 months from original Nov 30 2025.'),
  -- Grace Life Fellowship — 201 (also occupies 203 at no cost), ₱496.125/sqm × 82.458
  -- = ₱40,909.48 + VAT, dues ₱45,818.62 computed inclusive already per sheet;
  -- we use P2,256.93 base (2024–25 line) + inflation; sheet shows ₱40,909.48 + 4,909.14 VAT for 2026.
  -- Stored: base_rent=40,909.48, vat_rate=12, dues=2,391.28.
  ('66666666-6666-6666-6666-666666660201', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330201', '55555555-5555-5555-5555-555555555003',
    40909.48, 2391.28, 12.00, 0, '2025-08-01', '2026-07-31', 'Active',
    '₱496.125/sqm × 82.458 sqm. Tenant also occupies unit 203 at no rental fee (Sir Oli''s permission).'),
  -- Bright Discovery — 202, ₱441/sqm × 60.28 = ₱26,583.48 Non-VAT, dues ₱1,748.12 Non-VAT, Jul 1 2025 – Jun 30 2026.
  ('66666666-6666-6666-6666-666666660202', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330202', '55555555-5555-5555-5555-555555555004',
    26583.48, 1748.12, 0, 0, '2025-07-01', '2026-06-30', 'Active',
    '₱441/sqm × 60.28 sqm Non-VAT. 2 paid parking slots at ₱3,307.50 each / month (tracked separately).'),
  -- Smarter Minds — 304, ₱350/sqm × 47.52 = ₱16,632 + VAT, dues ₱1,283.04 + VAT, Dec 8 2024 – Dec 7 2026.
  ('66666666-6666-6666-6666-666666660304', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330304', '55555555-5555-5555-5555-555555555005',
    16632.00, 1283.04, 12.00, 0, '2024-12-08', '2026-12-07', 'Active',
    '₱350/sqm × 47.52 sqm. 2-year contract at same rental rate.'),
  -- Dr. Chua — 305, ₱325/sqm × 41.86 = ₱13,604.50 + VAT, dues ₱1,004.64 + VAT, Aug 1 2025 – Jul 31 2026.
  ('66666666-6666-6666-6666-666666660305', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330305', '55555555-5555-5555-5555-555555555006',
    13604.50, 1004.64, 12.00, 0, '2025-08-01', '2026-07-31', 'Active',
    '₱325/sqm × 41.86 sqm. Renewed at same rate.')
on conflict (id) do nothing;

-- Historical (Ended) leases ----------------------------------------------
-- Prior-year contracts from the 2023-2024 and 2024-2025 rate sheets.
-- These are seeded as Ended so the unique-active-per-unit index holds.
-- We'll insert their ledgers directly (bypassing generate_monthly_ledgers,
-- which only iterates Active leases).
insert into leases (id, group_id, unit_id, tenant_id, base_rent, dues, vat_rate, ewt_rate, start_date, end_date, status, notes) values
  -- Arte Manila 2023-24 packaged P60,000 rent + P4,720 dues + VAT across 101/102/103
  ('77777777-7777-7777-7777-777777770101', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330101', '55555555-5555-5555-5555-555555555001',
    18097.00, 1424.00, 12.00, 0, '2023-08-01', '2024-07-31', 'Ended',
    'Packaged 101/102/103 @ ₱60,000 + VAT; 101 portion (71.19 / 236.36 sqm).'),
  ('77777777-7777-7777-7777-777777770102', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330102', '55555555-5555-5555-5555-555555555001',
    20243.00, 1593.00, 12.00, 0, '2023-08-01', '2024-07-31', 'Ended',
    'Packaged 101/102/103 @ ₱60,000 + VAT; 102 portion (79.63 / 236.36 sqm).'),
  ('77777777-7777-7777-7777-777777770103', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330103', '55555555-5555-5555-5555-555555555001',
    21660.00, 1703.00, 12.00, 0, '2023-08-01', '2024-07-31', 'Ended',
    'Packaged 101/102/103 @ ₱60,000 + VAT; 103 portion (85.54 / 236.36 sqm).'),
  -- Arte Manila 2024-25 renewed packaged ₱138,506 Non-VAT (Aug 1 2024 – Jul 31 2025)
  ('77777777-7777-7777-7777-777777770111', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330101', '55555555-5555-5555-5555-555555555001',
    41780.10, 0, 0, 0, '2024-08-01', '2025-07-31', 'Ended',
    'Packaged 101/102/103 non-VAT; 101 portion (71.19 sqm).'),
  ('77777777-7777-7777-7777-777777770112', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330102', '55555555-5555-5555-5555-555555555001',
    46732.02, 0, 0, 0, '2024-08-01', '2025-07-31', 'Ended',
    'Packaged 101/102/103 non-VAT; 102 portion (79.63 sqm).'),
  ('77777777-7777-7777-7777-777777770113', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330103', '55555555-5555-5555-5555-555555555001',
    50203.77, 0, 0, 0, '2024-08-01', '2025-07-31', 'Ended',
    'Packaged 101/102/103 non-VAT; 103 portion (85.54 sqm).'),
  -- Grace Life 2023-24: ₱37,106.10 + VAT, dues ₱1,649.16 + VAT
  ('77777777-7777-7777-7777-777777770201', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330201', '55555555-5555-5555-5555-555555555003',
    37106.10, 1649.16, 12.00, 0, '2023-08-01', '2024-07-31', 'Ended',
    '₱450/sqm × 82.458 sqm.'),
  -- Grace Life 2024-25: ₱38,961.41 + VAT (Feb 1 2025 – Jul 31 2025)
  ('77777777-7777-7777-7777-777777770211', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330201', '55555555-5555-5555-5555-555555555003',
    38961.41, 2226.37, 12.00, 0, '2024-08-01', '2025-07-31', 'Ended',
    '₱472/sqm × 82.458 sqm.'),
  -- Bright Discovery 2023-24: ₱24,112 + VAT (Apr 1 2023 – Jun 30 2024)
  ('77777777-7777-7777-7777-777777770202', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330202', '55555555-5555-5555-5555-555555555004',
    24112.00, 1205.62, 12.00, 0, '2023-04-01', '2024-06-30', 'Ended',
    '₱400/sqm × 60.28 sqm; 2 paid parking separately.'),
  -- Bright Discovery 2024-25 Non-VAT: ₱25,318.02 (Jul 1 2024 – Jun 30 2025)
  ('77777777-7777-7777-7777-777777770212', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330202', '55555555-5555-5555-5555-555555555004',
    25318.02, 1627.59, 0, 0, '2024-07-01', '2025-06-30', 'Ended',
    '₱420/sqm × 60.28 sqm Non-VAT.'),
  -- Dr. Chua 2023-25: ₱13,604.50 + VAT, 2yr at same rate (Aug 1 2023 – Aug 1 2025)
  ('77777777-7777-7777-7777-777777770305', '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333330305', '55555555-5555-5555-5555-555555555006',
    13604.50, 837.20, 12.00, 0, '2023-08-01', '2025-07-31', 'Ended',
    '₱325/sqm × 41.86 sqm; 2-year contract.')
on conflict (id) do nothing;

-- Directly insert historical ledgers for each month of each Ended lease --
do $$
declare
  r_lease record;
  v_month date;
  v_vat_registered boolean;
  v_rent numeric(14,2);
  v_vat  numeric(14,2);
  v_dues numeric(14,2);
begin
  select vat_registered into v_vat_registered
    from public.landlord_groups where id = '11111111-1111-1111-1111-111111111111';

  for r_lease in
    select * from public.leases
      where group_id = '11111111-1111-1111-1111-111111111111'
        and status = 'Ended'
  loop
    v_month := date_trunc('month', r_lease.start_date)::date;
    while v_month <= coalesce(r_lease.end_date, current_date) loop
      v_rent := r_lease.base_rent;
      v_dues := r_lease.dues;

      if v_rent > 0 then
        insert into public.ledgers (group_id, lease_id, amount, type, due_date, status)
          values (r_lease.group_id, r_lease.id, v_rent, 'Rent', v_month, 'Unpaid')
          on conflict (lease_id, type, due_date) do nothing;
      end if;
      if v_vat_registered and r_lease.vat_rate > 0 then
        v_vat := round(v_rent * (r_lease.vat_rate / 100.0), 2);
        if v_vat > 0 then
          insert into public.ledgers (group_id, lease_id, amount, type, due_date, status)
            values (r_lease.group_id, r_lease.id, v_vat, 'VAT', v_month, 'Unpaid')
            on conflict (lease_id, type, due_date) do nothing;
        end if;
      end if;
      if v_dues > 0 then
        insert into public.ledgers (group_id, lease_id, amount, type, due_date, status)
          values (r_lease.group_id, r_lease.id, v_dues, 'Dues', v_month, 'Unpaid')
          on conflict (lease_id, type, due_date) do nothing;
      end if;

      v_month := (v_month + interval '1 month')::date;
    end loop;
  end loop;
end $$;

-- Active-lease historical ledgers + current payments ---------------------
-- Generate ledgers for every month from Jan 2024 through the current month,
-- then record a payment for each one (80%+ collection rate) so the dashboard
-- chart shows realistic month-over-month rent collection.
do $$
declare
  v_month date;
  v_today date := current_date;
  v_start date := '2024-01-01';
  v_ledger record;
  v_should_pay boolean;
  v_amount numeric(14,2);
begin
  v_month := v_start;
  while v_month <= date_trunc('month', v_today)::date loop
    perform public.generate_monthly_ledgers(v_month);
    v_month := (v_month + interval '1 month')::date;
  end loop;

  -- Record payments for historical ledgers.
  -- Rule: ledgers older than 30 days are fully paid (collection on ~day 5 of next month);
  --       ledgers within the current month sometimes remain open so the
  --       "Receivables status" chart has non-zero unpaid bars.
  for v_ledger in
    select id, amount, due_date, lease_id, type
      from public.ledgers
      where group_id = '11111111-1111-1111-1111-111111111111'
      order by due_date
  loop
    v_should_pay :=
      v_ledger.due_date < date_trunc('month', v_today)::date
      or (
        -- Within current month: pay about 60% of them (deterministic via hash).
        ('x' || substr(md5(v_ledger.id::text), 1, 8))::bit(32)::int % 10 < 6
      );

    if v_should_pay then
      v_amount := v_ledger.amount;
      insert into public.payments
        (group_id, ledger_id, amount, date_received, reference_no, notes)
      values (
        '11111111-1111-1111-1111-111111111111',
        v_ledger.id,
        v_amount,
        (v_ledger.due_date + interval '5 days')::date,
        'BPI-' || to_char(v_ledger.due_date, 'YYMM') || '-' || substr(v_ledger.id::text, 1, 4),
        v_ledger.type || ' collection for ' || to_char(v_ledger.due_date, 'Mon YYYY')
      )
      on conflict do nothing;
    end if;
  end loop;
end $$;
