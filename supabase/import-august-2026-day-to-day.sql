-- One-time import: August 2026 day-to-day expenses from the uploaded Excel sheet.
-- UK account and Savings account rows are intentionally excluded (per your instruction),
-- as are "Monthly Fixed Costs" / "Monthly Salary" / inter-account transfer rows — those
-- belong to the Planned Expenses tab (income + recurring bills), already tracked there.
--
-- IMPORTANT: run this ONLY after you've visited /day-to-day/accounts and
-- /day-to-day/categories at least once in the live app (so UAE/UK/India accounts and
-- the full category tree already exist to look up by name). Do not re-run this script —
-- it is NOT idempotent for the transactions themselves (re-running would duplicate them),
-- though the account/category inserts below are safe to re-run.

-- 1. New account: Physical Cash
insert into accounts (name, currency, sort_order)
select 'Physical Cash', 'AED', (select coalesce(max(sort_order), 0) + 1 from accounts)
where not exists (select 1 from accounts where name = 'Physical Cash');

-- 2. New category nodes seen in the sheet that weren't in the original list
insert into dd_categories (parent_id, kind, name, sort_order)
select p.id, 'expense', v.name, 100 + v.ord
from (values ('Fatema Adamji', 0), ('Ayham', 1), ('Donation', 2), ('Tip', 3)) as v(name, ord)
join dd_categories p on p.kind = 'expense' and p.parent_id is null and p.name = 'Gifts'
where not exists (
  select 1 from dd_categories c where c.parent_id = p.id and c.name = v.name
);

insert into dd_categories (parent_id, kind, name, sort_order)
select p.id, 'expense', 'Desert', 100
from dd_categories p
where p.kind = 'expense' and p.parent_id is null and p.name = 'Food'
  and not exists (select 1 from dd_categories c where c.parent_id = p.id and c.name = 'Desert');

insert into dd_categories (parent_id, kind, name, sort_order)
select p.id, 'expense', 'Padel', 100
from dd_categories p
where p.kind = 'expense' and p.parent_id is null and p.name = 'Shopping'
  and not exists (select 1 from dd_categories c where c.parent_id = p.id and c.name = 'Padel');

-- 3. Transactions (63 rows: 62 expense, 1 income)
with data(tx_date, account_name, tx_type, cat_top, cat_sub, amount, note) as (
  values
    ('2026-08-27'::date, 'UAE', 'expense', 'Working out', 'Padel', 210, ''),
    ('2026-08-27'::date, 'UAE', 'expense', 'Food', 'Beverages', 4, ''),
    ('2026-08-27'::date, 'UAE', 'expense', 'Food', 'Beverages', 3, ''),
    ('2026-08-27'::date, 'Physical Cash', 'expense', 'Shopping', 'Clothes', 200, 'Chelsea jerseys'),
    ('2026-08-26'::date, 'UAE', 'expense', 'Food', 'Beverages', 3, ''),
    ('2026-08-26'::date, 'UAE', 'expense', 'Food', 'Beverages', 4, ''),
    ('2026-08-26'::date, 'UAE', 'expense', 'Public transport', 'Taxi', 90, ''),
    ('2026-08-26'::date, 'Physical Cash', 'expense', 'Gifts', 'Donation', 5, ''),
    ('2026-08-25'::date, 'UAE', 'expense', 'Food', 'Dinner', 130, 'Hashmi'),
    ('2026-08-25'::date, 'UAE', 'expense', 'Food', 'Dinner', 41, ''),
    ('2026-08-25'::date, 'UAE', 'expense', 'Shopping', 'Accessories', 158, 'Perfume'),
    ('2026-08-25'::date, 'UAE', 'expense', 'Gifts', 'Fatema Adamji', 50, ''),
    ('2026-08-25'::date, 'UAE', 'expense', 'Food', 'Lunch', 206, 'Break by Mara'),
    ('2026-08-24'::date, 'UAE', 'expense', 'Food', 'Lunch', 350, 'Din Tai Fung'),
    ('2026-08-24'::date, 'UAE', 'expense', 'Food', 'Breakfast', 175, 'Knot with Fatema'),
    ('2026-08-23'::date, 'UAE', 'expense', 'Shopping', 'Accessories', 25, 'Phone case'),
    ('2026-08-23'::date, 'UAE', 'expense', 'Food', 'Dinner', 123, 'Lamb chops'),
    ('2026-08-23'::date, 'UAE', 'expense', 'Working out', 'Padel', 100, ''),
    ('2026-08-22'::date, 'UAE', 'expense', 'Gifts', 'Ayham', 120, ''),
    ('2026-08-22'::date, 'UAE', 'expense', 'Public transport', 'Valet', 52, ''),
    ('2026-08-22'::date, 'UAE', 'expense', 'Food', 'Beverages', 42, 'Dip matcha'),
    ('2026-08-20'::date, 'UAE', 'expense', 'Food', 'Beverages', 17, ''),
    ('2026-08-20'::date, 'UAE', 'expense', 'Gifts', 'Fatema Adamji', 40, 'Gift to saigar family'),
    ('2026-08-20'::date, 'UAE', 'expense', 'Food', 'Lunch', 70, 'Lunch for Fatema'),
    ('2026-08-20'::date, 'UAE', 'expense', 'Working out', 'Padel', 8.75, ''),
    ('2026-08-19'::date, 'UAE', 'expense', 'Going out', 'Activities', 279, 'Painting cafe with Fatema'),
    ('2026-08-19'::date, 'UAE', 'expense', 'Food', 'Snacks', 41, ''),
    ('2026-08-19'::date, 'UAE', 'expense', 'Public transport', 'Valet', 20, ''),
    ('2026-08-19'::date, 'UAE', 'expense', 'Food', 'Breakfast', 180, 'Ergon Agora'),
    ('2026-08-18'::date, 'UAE', 'expense', 'Food', 'Desert', 42, 'Home bakery'),
    ('2026-08-18'::date, 'UAE', 'expense', 'Food', 'Dinner', 220, 'The pit'),
    ('2026-08-18'::date, 'UAE', 'expense', 'Food', 'Snacks', 53, 'Movie snack'),
    ('2026-08-18'::date, 'UAE', 'expense', 'Food', 'Lunch', 50, 'Raising canes'),
    ('2026-08-18'::date, 'UAE', 'expense', 'Food', 'Beverages', 5.25, ''),
    ('2026-08-18'::date, 'UAE', 'expense', 'Food', 'Breakfast', 170, ''),
    ('2026-08-18'::date, 'UAE', 'expense', 'Going out', 'Movie', 130, 'Spider-Man movie with Fatema'),
    ('2026-08-17'::date, 'UAE', 'expense', 'Working out', 'Padel', 95, ''),
    ('2026-08-12'::date, 'UAE', 'expense', 'Grooming', 'Haircut', 150, ''),
    ('2026-08-11'::date, 'UAE', 'expense', 'Food', 'Beverages', 33, 'Smoothie'),
    ('2026-08-10'::date, 'Physical Cash', 'expense', 'Food', 'Dinner', 10, 'Mandi'),
    ('2026-08-09'::date, 'UAE', 'expense', 'Working out', 'Padel', 9, 'Balls'),
    ('2026-08-08'::date, 'UAE', 'expense', 'Shopping', 'Clothes', 160, 'Adidas padel shirt'),
    ('2026-08-07'::date, 'UAE', 'income', 'Extra money given', null, 46, ''),
    ('2026-08-06'::date, 'UAE', 'expense', 'Working out', 'Padel', 95, ''),
    ('2026-08-06'::date, 'UAE', 'expense', 'Working out', 'Padel', 100, ''),
    ('2026-08-06'::date, 'UAE', 'expense', 'Shopping', 'Home stuff', 150, 'Coat Hanger for Office'),
    ('2026-08-06'::date, 'UAE', 'expense', 'Shopping', 'DJI Osmo', 171, 'Osmo Accezories'),
    ('2026-08-06'::date, 'UAE', 'expense', 'Shopping', 'Cycling', 271, 'Bike holder'),
    ('2026-08-05'::date, 'UAE', 'expense', 'Working out', 'Padel', 85, ''),
    ('2026-08-04'::date, 'UAE', 'expense', 'Food', 'Beverages', 17, ''),
    ('2026-08-04'::date, 'UAE', 'expense', 'Working out', 'Padel', 90, ''),
    ('2026-08-03'::date, 'UAE', 'expense', 'Working out', 'Padel', 12.5, ''),
    ('2026-08-03'::date, 'UAE', 'expense', 'Working out', 'Padel', 115, ''),
    ('2026-08-03'::date, 'UAE', 'expense', 'Shopping', 'Games', 112, 'Minecraft'),
    ('2026-08-02'::date, 'UAE', 'expense', 'Shopping', 'Games', 114, 'Forza Horizon'),
    ('2026-08-02'::date, 'UAE', 'expense', 'Food', 'Lunch', 130, 'Lunch with Jordaan'),
    ('2026-08-02'::date, 'Physical Cash', 'expense', 'Gifts', 'Tip', 10, ''),
    ('2026-08-02'::date, 'UAE', 'expense', 'Shopping', 'Padel', 270, 'Padel bag'),
    ('2026-08-02'::date, 'UAE', 'expense', 'Food', 'Beverages', 5, 'Water'),
    ('2026-08-02'::date, 'UAE', 'expense', 'Working out', 'Padel', 110, ''),
    ('2026-08-01'::date, 'Physical Cash', 'expense', 'Gifts', 'Tip', 15, ''),
    ('2026-08-01'::date, 'UAE', 'expense', 'Gifts', 'Fatema Adamji', 205, 'Plushie'),
    ('2026-08-01'::date, 'UAE', 'expense', 'Gifts', 'Fatema Adamji', 1950, 'Dior Bracelet')
)
insert into dd_transactions (type, date, amount, account_id, category_id, note)
select
  d.tx_type,
  d.tx_date,
  d.amount,
  a.id,
  coalesce(c2.id, c1.id),
  d.note
from data d
join accounts a on a.name = d.account_name
join dd_categories c1
  on c1.name = d.cat_top
 and c1.parent_id is null
 and c1.kind = case when d.tx_type = 'income' then 'income' else 'expense' end
left join dd_categories c2
  on c2.name = d.cat_sub
 and c2.parent_id = c1.id
 and d.cat_sub is not null;

