package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/saikumaradapa/Connection-Sphere/docs" // This is required to generate Swagger docs
	"github.com/saikumaradapa/Connection-Sphere/internal/auth"
	"github.com/saikumaradapa/Connection-Sphere/internal/mailer"
	"github.com/saikumaradapa/Connection-Sphere/internal/store"
	"github.com/saikumaradapa/Connection-Sphere/internal/store/cache"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type application struct {
	config        config
	store         store.Storage
	cacheStore    cache.Storage
	logger        *zap.SugaredLogger
	mailer        mailer.Client
	authenticator auth.Authenticator
}

type config struct {
	addr        string
	db          dbConfig
	env         string
	apiURL      string
	mail        mailConfig
	frontendURL string
	auth        authConfig
	redisCfg    redisConfig
}

type redisConfig struct {
	addr    string
	pw      string
	db      int
	enabled bool
}

type authConfig struct {
	basic basicConfig
	token tokenConfig
}

type tokenConfig struct {
	secret   string
	exp      time.Duration
	issuer   string
	audience string
}

type basicConfig struct {
	username string
	password string
}

type mailConfig struct {
	sendGrid  sendGridConfig
	fromEmail string
	exp       time.Duration
}

type sendGridConfig struct {
	apiKey string
}

type dbConfig struct {
	addr         string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime  string
}

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	// Base middleware stack
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))

	// Add CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Swagger docs (outside /v1 so /swagger/doc.json is accessible)
	r.Get("/swagger/doc.json", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./docs/swagger.json")
	})

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("http://"+app.config.addr+"/swagger/doc.json"),
	))

	// API routes under /v1
	r.Route("/v1", func(r chi.Router) {
		r.With(app.BasicAuthMiddleware()).Get("/health", app.healthCheckHandler)

		r.Route("/posts", func(r chi.Router) {
			r.Use(app.AuthTokenMiddleware)

			r.Post("/", app.createPostHandler)

			r.Route("/{postID}", func(r chi.Router) {
				r.Use(app.postsContextMiddleware)

				r.Get("/", app.getPostHandler)
				r.Patch("/", app.checkPostOwnership("moderator", app.updatePostHandler))
				r.Delete("/", app.checkPostOwnership("admin", app.deletePostHandler))
			})
		})

		r.Route("/users", func(r chi.Router) {
			r.Put("/activate/{token}", app.activateUserHandler)

			r.Route("/{userID}", func(r chi.Router) {
				r.Use(app.AuthTokenMiddleware)

				r.Get("/", app.getUserHandler)
				r.Put("/follow", app.followUserHandler)
				r.Put("/unfollow", app.unfollowUserHandler)
			})

			r.Group(func(r chi.Router) {
				r.Use(app.AuthTokenMiddleware)

				r.Get("/feed", app.getUserFeedHandler)
			})

		})

		// Public routes
		r.Route("/authentication", func(r chi.Router) {
			r.Post("/user", app.registerUserHandler)
			r.Post("/token", app.createTokenHandler)
		})

	})

	return r
}

func (app *application) run(mux http.Handler) error {
	// Swagger info (used in generated docs)
	docs.SwaggerInfo.Version = version
	docs.SwaggerInfo.Host = app.config.apiURL
	docs.SwaggerInfo.BasePath = "/v1"

	// create a new HTTP server with timeouts and our routes (mux)
	srv := &http.Server{
		Addr:         app.config.addr,  // server address (host:port)
		Handler:      mux,              // main router for handling requests
		WriteTimeout: time.Second * 30, // max time to write a response
		ReadTimeout:  time.Second * 10, // max time to read the request
		IdleTimeout:  time.Minute,      // how long to keep idle connections open
	}

	// channel to receive shutdown errors
	shutdown := make(chan error)

	// run a goroutine to listen for OS signals (like Ctrl+C)
	go func() {
		quit := make(chan os.Signal, 1)

		// notify this channel when SIGINT (Ctrl+C) or SIGTERM (kill) is sent
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit // block until a signal is received

		// give ongoing requests up to 5s to finish before shutdown
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		app.logger.Infow("server caught", "signal", s.String())

		// attempt graceful shutdown
		shutdown <- srv.Shutdown(ctx)
	}()

	app.logger.Infow("server has started", "addr", app.config.addr, "env", app.config.env)

	// start the server (this blocks until it stops)
	err := srv.ListenAndServe()

	// if the error is not "server closed" (normal shutdown), return it
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	// wait for graceful shutdown to finish
	err = <-shutdown
	if err != nil {
		return err
	}

	app.logger.Infow("server has stopped", "addr", app.config.addr, "env", app.config.env)

	return nil
}
