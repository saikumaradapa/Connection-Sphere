-- Migration steps:
-- 1. Add a new column `role_id` with a temporary default, to ensure the ALTER TABLE doesn't break inserts.
-- 2. Backfill all existing users with the actual "user" role id.
-- 3. Drop the temporary default so future inserts must explicitly provide a role.
-- 4. Enforce NOT NULL to guarantee every user has a role.

ALTER TABLE 
    IF EXISTS users
ADD 
    COLUMN IF NOT EXISTS role_id INT REFERENCES roles(id) DEFAULT 1;

UPDATE 
    users
SET 
    role_id = (
        SELECT 
            id 
        FROM 
            roles 
        WHERE 
            name = 'user'
    );

ALTER TABLE 
    users
ALTER COLUMN
    role_id 
DROP DEFAULT;

ALTER TABLE 
    users
ALTER COLUMN
    role_id 
SET NOT NULL;
