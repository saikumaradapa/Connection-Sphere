CREATE TABLE IF NOT EXISTS followers (
    user_id bigint NOT NULL,
    follower_id bigint NOT NULL,
    created_at timestamp(0) with time zone NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, follower_id), -- composite key ensures unique follower relation
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ON DELETE CASCADE:
-- If a row in the users table is deleted,
-- automatically delete all related rows in the followers table
-- that reference that user_id or follower_id.
