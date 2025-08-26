package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNotFound               = errors.New("resource not found")
	QueryTimeoutDuration      = time.Second * 5
	ErrAlreadyFollowing       = errors.New("already following the user")
	ErrInvalidToken           = errors.New("invalid or missing token")
	ErrActivationTokenExpired = errors.New("activation token has expired")
)

type Storage struct {
	Posts interface {
		GetByID(context.Context, int64) (*Post, error)
		Create(context.Context, *Post) error
		Delete(context.Context, int64) error
		Update(context.Context, *Post) error
		GetUserFeed(context.Context, int64, PaginatedFeedQuery) ([]PostWithMetadata, error)
	}
	Users interface {
		GetByID(context.Context, int64) (*User, error)
		GetByEmail(context.Context, string) (*User, error)
		Create(context.Context, *sql.Tx, *User) error
		CreateAndInvite(ctx context.Context, user *User, token string, duration time.Duration) error
		Activate(ctx context.Context, token string) error
		Delete(context.Context, int64) error
	}
	Comments interface {
		Create(context.Context, *Comment) error
		GetByPostID(context.Context, int64) ([]Comment, error)
	}

	Followers interface {
		Follow(context.Context, int64, int64) error
		Unfollow(context.Context, int64, int64) error
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Posts:     &PostStore{db},
		Users:     &UserStore{db},
		Comments:  &CommentStore{db},
		Followers: &FollowerStore{db},
	}
}

// withTx is a helper that ensures the given function runs inside a transaction.
func withTx(db *sql.DB, ctx context.Context, fn func(*sql.Tx) error) error {
	// Step 1: start a transaction
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	// Step 2: run the provided function with the transaction
	if err := fn(tx); err != nil {
		// Function failed → rollback (undo changes)
		_ = tx.Rollback()
		return err
	}

	// Step 3: function succeeded → commit (persist changes)
	return tx.Commit()
}
