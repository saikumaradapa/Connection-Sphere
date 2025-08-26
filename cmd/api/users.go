package main

import (
	"context"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/saikumaradapa/Connection-Sphere/internal/store"
)

type userKey string

const userCtx userKey = "user"

// GetUser godoc
//
//	@Summary		Fetches a user profile
//	@Description	Fetches a user profile by ID
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"User ID"
//	@Success		200	{object}	store.User
//	@Failure		400	{object}	error
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/users/{id} [get]
func (app *application) getUserHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromCtx(r)
	if err != nil {
		app.unauthorizedErrorResponse(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, user); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// FollowUser godoc
//
//	@Summary		Follow a user
//	@Description	Authenticated user (the follower) follows another user (the followed) by their ID.
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			userID	path		int		true	"ID of the user to follow"
//	@Success		204		{string}	string	"User followed successfully (no content returned)"
//	@Failure		400		{object}	error	"Invalid user ID format"
//	@Failure		401		{object}	error	"Unauthorized (missing or invalid token)"
//	@Failure		404		{object}	error	"User to follow not found"
//	@Failure		409		{object}	error	"Already following this user"
//	@Security		ApiKeyAuth
//	@Router			/users/{userID}/follow [put]
func (app *application) followUserHandler(w http.ResponseWriter, r *http.Request) {
	followerUser, err := getUserFromCtx(r)
	if err != nil {
		app.unauthorizedErrorResponse(w, r, err)
		return
	}

	followedID, err := strconv.ParseInt(chi.URLParam(r, "userID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()
	err = app.store.Followers.Follow(ctx, followerUser.ID, followedID)
	if err != nil {
		switch err {
		case store.ErrAlreadyFollowing:
			app.conflictResponse(w, r, err)
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	app.jsonResponse(w, http.StatusNoContent, nil)
}

// UnfollowUser godoc
//
//	@Summary		Unfollow a user
//	@Description	Authenticated user (the follower) unfollows another user (the followed) by their ID.
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			userID	path		int		true	"ID of the user to unfollow"
//	@Success		204		{string}	string	"User unfollowed successfully (no content returned)"
//	@Failure		400		{object}	error	"Invalid user ID format"
//	@Failure		401		{object}	error	"Unauthorized (missing or invalid token)"
//	@Failure		404		{object}	error	"User to unfollow not found"
//	@Failure		409		{object}	error	"Not following this user"
//	@Security		ApiKeyAuth
//	@Router			/users/{userID}/unfollow [put]
func (app *application) unfollowUserHandler(w http.ResponseWriter, r *http.Request) {
	followerUser, err := getUserFromCtx(r)
	if err != nil {
		app.unauthorizedErrorResponse(w, r, err)
		return
	}

	unfollowedID, err := strconv.ParseInt(chi.URLParam(r, "userID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()
	err = app.store.Followers.Unfollow(ctx, followerUser.ID, unfollowedID)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		case store.ErrNotFollowing:
			app.conflictResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	app.jsonResponse(w, http.StatusNoContent, nil)
}

// ActivateUser godoc
//
//	@Summary		Activates/Register a user
//	@Description	Activates/Register a user by invitation token
//	@Tags			users
//	@Produce		json
//	@Param			token	path		string	true	"Invitation token"
//	@Success		204		{string}	string	"User activated"
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/users/activate/{token} [put]
func (app *application) activateUserHandler(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		app.badRequestResponse(w, r, store.ErrInvalidToken)
		return
	}

	ctx := r.Context()
	if err := app.store.Users.Activate(ctx, token); err != nil {
		switch err {
		case store.ErrNotFound:
			app.notFoundResponse(w, r, err)
		case store.ErrInvalidToken, store.ErrActivationTokenExpired:
			app.badRequestResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, map[string]string{
		"message": "user activated",
	}); err != nil {
		app.internalServerError(w, r, err)
	}
}

func (app *application) userContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := strconv.ParseInt(chi.URLParam(r, "userID"), 10, 64)
		if err != nil {
			app.badRequestResponse(w, r, err)
			return
		}

		ctx := r.Context()

		user, err := app.store.Users.GetByID(ctx, userID)
		if err != nil {
			switch err {
			case store.ErrNotFound:
				app.notFoundResponse(w, r, err)
				return
			default:
				app.internalServerError(w, r, err)
				return

			}
		}

		ctx = context.WithValue(ctx, userCtx, user)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getUserFromCtx(r *http.Request) (*store.User, error) {
	user, ok := r.Context().Value(userCtx).(*store.User)
	if !ok {
		return nil, store.ErrUserMissingInContext
	}
	return user, nil
}
