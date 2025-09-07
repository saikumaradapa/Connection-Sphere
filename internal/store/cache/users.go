package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/saikumaradapa/Connection-Sphere/internal/store"
)

const userExpTime = time.Minute

// UserCache provides caching for User objects in Redis.
type UserStore struct {
	rdb *redis.Client
}

// Get retrieves a User from Redis by ID.
// Returns (nil, nil) if the user is not found in cache.
func (c *UserStore) Get(ctx context.Context, userID int64) (*store.User, error) {
	cacheKey := fmt.Sprintf("user-%d", userID)

	data, err := c.rdb.Get(ctx, cacheKey).Result()
	if err == redis.Nil {
		// Cache miss
		return nil, nil
	} else if err != nil {
		// Actual Redis error
		return nil, err
	}

	var user store.User
	if err := json.Unmarshal([]byte(data), &user); err != nil {
		return nil, err
	}

	return &user, nil
}

// Set stores a User in Redis with an expiration.
func (c *UserStore) Set(ctx context.Context, user *store.User) error {
	cacheKey := fmt.Sprintf("user-%d", user.ID)

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return c.rdb.SetEX(ctx, cacheKey, userJSON, userExpTime).Err()
}
