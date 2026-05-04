USE urbanmove;
UPDATE users SET password_hash = '$2a$12$pWxJmWU3aGVRAlESq.wkze2VIuJhzC7FiTSkTs01aEi1K1YBdDKGa' WHERE email = 'demo@urbanmove.ma';
UPDATE users SET password_hash = '$2a$12$23eVXFtXOQuDJcFFjK5/.uPyLqxJcDs0etCUaUOg0cyZg7DIiEaRa' WHERE email = 'admin@urbanmove.ma';
