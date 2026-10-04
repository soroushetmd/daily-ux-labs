INSERT INTO flows(name, owner) VALUES
('Account onboarding', 'Customer'),
('Browse and filter', 'Customer'),
('Checkout', 'Customer'),
('Create listing', 'Provider'),
('Order management', 'Provider'),
('Content moderation', 'Admin');

INSERT INTO states(name, sort_order) VALUES
('Default', 1), ('Loading', 2), ('Empty', 3), ('Error', 4), ('Success', 5), ('Keyboard and screen reader', 6);

INSERT INTO coverage(flow_id, state_id, status, note)
SELECT f.id, s.id,
  CASE
    WHEN f.name = 'Account onboarding' AND s.name IN ('Default','Error','Success','Keyboard and screen reader') THEN 'designed'
    WHEN f.name = 'Account onboarding' AND s.name = 'Loading' THEN 'partial'
    WHEN f.name = 'Browse and filter' AND s.name IN ('Default','Loading','Empty') THEN 'designed'
    WHEN f.name = 'Browse and filter' AND s.name = 'Keyboard and screen reader' THEN 'partial'
    WHEN f.name = 'Checkout' AND s.name IN ('Default','Loading','Error','Success') THEN 'designed'
    WHEN f.name = 'Checkout' AND s.name = 'Keyboard and screen reader' THEN 'partial'
    WHEN f.name = 'Create listing' AND s.name IN ('Default','Error','Success') THEN 'designed'
    WHEN f.name = 'Create listing' AND s.name = 'Loading' THEN 'partial'
    WHEN f.name = 'Order management' AND s.name IN ('Default','Loading','Empty') THEN 'designed'
    WHEN f.name = 'Content moderation' AND s.name IN ('Default','Empty','Error','Success') THEN 'designed'
    WHEN s.name = 'Empty' AND f.name IN ('Account onboarding','Checkout','Create listing') THEN 'not-applicable'
    ELSE 'missing'
  END,
  CASE WHEN s.name = 'Keyboard and screen reader' THEN 'Validate focus order and announcements before handoff.' ELSE '' END
FROM flows f CROSS JOIN states s;
