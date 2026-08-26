-- Optional: run this after schema.sql to import the data from the original
-- "Big Expense Tracker" spreadsheet, so the app starts populated instead of
-- empty. Safe to skip if you'd rather start from scratch.

insert into expense_entries (month, date_label, name, amount, category, sort_order) values
  -- August 2026
  ('2026-08-01', '1st', 'Etoro', 2500, 'recurring', 1),
  ('2026-08-01', '1st', 'Saving', 2500, 'recurring', 2),
  ('2026-08-01', '1st', 'Etisalat', 185, 'recurring', 3),
  ('2026-08-01', '1st', 'Subsciptions', 100, 'recurring', 4),
  ('2026-08-01', '1st', 'Debt Paying Back', 782, 'debt', 5),
  ('2026-08-01', '1st', 'Gfit for Fatema and Family', 2500, 'one_off', 6),
  -- September 2026
  ('2026-09-01', '1st', 'Etoro', 3000, 'recurring', 1),
  ('2026-09-01', '1st', 'Saving', 2150, 'recurring', 2),
  ('2026-09-01', '1st', 'Etisalat', 185, 'recurring', 3),
  ('2026-09-01', '1st', 'Subsciptions', 100, 'recurring', 4),
  ('2026-09-01', '10th', 'Padel Coaching', 1700, 'stoppable', 5),
  ('2026-09-01', '1st', 'Idiot Gift', 2000, 'one_off', 6),
  ('2026-09-01', '1st', 'Debt Paying Back', 2150, 'debt', 7),
  -- October 2026
  ('2026-10-01', '1st', 'Etoro', 3000, 'recurring', 1),
  ('2026-10-01', '1st', 'Saving', 3000, 'recurring', 2),
  ('2026-10-01', '1st', 'Etisalat', 185, 'recurring', 3),
  ('2026-10-01', '1st', 'Subsciptions', 100, 'recurring', 4),
  ('2026-10-01', '15th', 'Padel Coaching', 1700, 'stoppable', 5),
  ('2026-10-01', '8th', 'Gym', 500, 'installment', 6),
  ('2026-10-01', '1st', 'Debt Paying Back', 2000, 'debt', 7),
  -- November 2026
  ('2026-11-01', '1st', 'Etoro', 3000, 'recurring', 1),
  ('2026-11-01', '1st', 'Saving', 3000, 'recurring', 2),
  ('2026-11-01', '1st', 'Etisalat', 185, 'recurring', 3),
  ('2026-11-01', '1st', 'Subsciptions', 100, 'recurring', 4),
  ('2026-11-01', '19th', 'Padel Coaching', 1700, 'stoppable', 5),
  ('2026-11-01', '8th', 'Gym', 500, 'installment', 6),
  ('2026-11-01', '1st', 'Debt Paying Back', 2000, 'debt', 7),
  -- December 2026
  ('2026-12-01', '1st', 'Etoro', 3000, 'recurring', 1),
  ('2026-12-01', '1st', 'Saving', 3000, 'recurring', 2),
  ('2026-12-01', '1st', 'Etisalat', 185, 'recurring', 3),
  ('2026-12-01', '1st', 'Subsciptions', 100, 'recurring', 4),
  ('2026-12-01', '24th', 'Padel Coaching', 1700, 'stoppable', 5),
  ('2026-12-01', '8th', 'Gym', 500, 'installment', 6),
  ('2026-12-01', '1st', 'Debt Paying Back', 2000, 'debt', 7),
  -- January 2027
  ('2027-01-01', '1st', 'Etoro', 3000, 'recurring', 1),
  ('2027-01-01', '1st', 'Saving', 3000, 'recurring', 2),
  ('2027-01-01', '1st', 'Etisalat', 185, 'recurring', 3),
  ('2027-01-01', '1st', 'Subsciptions', 100, 'recurring', 4),
  ('2027-01-01', '28th', 'Padel Coaching', 1700, 'stoppable', 5),
  ('2027-01-01', '8th', 'Gym', 500, 'installment', 6),
  ('2027-01-01', '1st', 'Debt Paying Back', 2000, 'debt', 7)
on conflict do nothing;

insert into monthly_income (month, income) values
  ('2026-08-01', 15000),
  ('2026-09-01', 15000),
  ('2026-10-01', 15000),
  ('2026-11-01', 15000),
  ('2026-12-01', 15000),
  ('2027-01-01', 15000)
on conflict (month) do nothing;

-- The sheet's "Total Invested" column already carried a running balance from
-- before this tracker started (D6 = 3949.62, not derived from the "Investment
-- Value" column next to it). The July row's contribution below folds that
-- pre-existing balance in, so every later month's cumulative total (and the
-- P&L % / $ P&L derived from it) reconciles exactly with the original sheet.
insert into investment_months (month, contribution, portfolio_value_eom) values
  ('2026-07-01', 3949.62, 4712),
  ('2026-08-01', 675, null),
  ('2026-09-01', 0, null),
  ('2026-10-01', 0, null),
  ('2026-11-01', 0, null),
  ('2026-12-01', 0, null),
  ('2027-01-01', 0, null)
on conflict (month) do nothing;

insert into debts (name, amount) values
  ('Triathlon Accessories', -3914),
  ('Whoop Stuff', -700),
  ('AI Editor', -669),
  ('Claude', -800),
  ('Fines', -1450)
on conflict do nothing;

insert into savings_months (month, debt_paydown, big_payment, savings_kept, money_kept) values
  ('2026-08-01', 782, 0, 2515, 50000),
  ('2026-09-01', 2150, 0, 2150, 50000),
  ('2026-10-01', 2000, 0, 3000, 50000),
  ('2026-11-01', 2000, 0, 3000, 50000),
  ('2026-12-01', 2000, 0, 3000, 50000),
  ('2027-01-01', 2000, -1950, 3000, 50000),
  ('2027-02-01', 2000, 0, 3000, 50000),
  ('2027-03-01', 2000, 0, 3000, 50000),
  ('2027-04-01', 2000, 0, 3000, 50000),
  ('2027-05-01', 2000, 0, 3000, 50000),
  ('2027-06-01', 2000, 0, 3000, 50000),
  ('2027-07-01', 2000, 0, 3000, 50000),
  ('2027-08-01', 2000, 0, 3000, 50000),
  ('2027-09-01', 2000, 0, 3000, 50000),
  ('2027-10-01', 2000, 0, 3000, 50000),
  ('2027-11-01', 2000, 0, 3000, 50000),
  ('2027-12-01', 2000, 0, 3000, 50000)
on conflict (month) do nothing;
