package store

import (
	"context"
	"database/sql"

	"github.com/lib/pq"
)

type Follower struct {
	UserID     int64  `json:"user_id"`
	FollowerID int64  `json:"follower_id"`
	CreatedAt  string `json:"created_at"`
}

type FollowerStore struct {
	db *sql.DB
}

func (s *FollowerStore) Follow(ctx context.Context, followerID int64, userID int64) error {
	query := `
		INSERT INTO followers (user_id, follower_id)
		VALUES ($1, $2)
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := s.db.ExecContext(ctx, query, userID, followerID)
	if err != nil {
		// Check if the error returned by ExecContext is a PostgreSQL error (of type *pq.Error),
		// and specifically if the error code is "23505", which indicates a unique constraint violation.
		// This helps us detect and handle cases where a duplicate (user_id, follower_id) pair is inserted.
		if pgErr, ok := err.(*pq.Error); ok && pgErr.Code == "23505" {
			return ErrAlreadyFollowing
		}

		return err
	}

	return nil

}

func (s *FollowerStore) Unfollow(ctx context.Context, followerID int64, userID int64) error {
	query := `
		DELETE FROM followers
		WHERE user_id = $1 AND follower_id = $2
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := s.db.ExecContext(ctx, query, userID, followerID)
	if err != nil {
		return err
	}

	return nil

}
