package main

import (
	"fmt"
	"log"
	"time"

	"go.uber.org/zap"

	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	"github.com/saikumaradapa/Connection-Sphere/internal/auth"
	"github.com/saikumaradapa/Connection-Sphere/internal/db"
	"github.com/saikumaradapa/Connection-Sphere/internal/env"
	"github.com/saikumaradapa/Connection-Sphere/internal/mailer"
	"github.com/saikumaradapa/Connection-Sphere/internal/ratelimiter"
	"github.com/saikumaradapa/Connection-Sphere/internal/store"
	"github.com/saikumaradapa/Connection-Sphere/internal/store/cache"
)

const version = "0.0.1"

//	@title			Connection Sphere API
//	@description	This is the API for Connection Sphere, a platform for connecting people and sharing content.
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	API Support
//	@contact.url	http://www.swagger.io/support
//	@contact.email	support@swagger.io

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

//	@BasePath					/v1
//
//	@securityDefinitions.apiKey	ApiKeyAuth
//	@in							header
//	@name						Authorization
//	@description				API key for authorization

func main() {
	// Load env vars from .env.dev
	if err := godotenv.Load(".env.dev"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	host := env.GetString("HOST", "localhost")
	port := env.GetString("PORT", "3030")

	cfg := config{
		addr:        fmt.Sprintf("%s:%s", host, port),
		apiURL:      env.GetString("EXTERNAL_URL", "localhost:3030"),
		frontendURL: env.GetString("FRONTEND_URL", "http://localhost:4000"),
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", "postgres://root:admin@localhost:5432/connection_sphere?sslmode=disable"),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleConns: env.GetInt("DB_IDLE_OPEN_CONNS", 30),
			maxIdleTime:  env.GetString("MAX_IDLE_TIME", "15m"),
		},
		redisCfg: redisConfig{
			addr:    env.GetString("REDIS_ADDR", "localhost:6379"),
			pw:      env.GetString("REDIS_PW", ""),
			db:      env.GetInt("REDIS_DB", 0),
			enabled: env.GetBool("REDIS_ENABLED", false), // default disabled
		},
		env: env.GetString("ENV", "development"),
		mail: mailConfig{
			exp:       time.Hour * 3, // 3 days
			fromEmail: env.GetString("FROM_EMAIL", ""),
			sendGrid: sendGridConfig{
				apiKey: env.GetString("SENDGRID_API_KEY", ""),
			},
		},
		auth: authConfig{
			basic: basicConfig{
				username: env.GetString("BASIC_AUTH_USERNAME", "admin"),
				password: env.GetString("BASIC_AUTH_PASSWORD", "password"),
			},
			token: tokenConfig{
				secret:   env.GetString("JWT_SECRET", "supersecret"),
				exp:      env.GetDuration("JWT_EXPIRATION", time.Hour*24), // default 1 day
				issuer:   env.GetString("JWT_ISSUER", "connection-sphere"),
				audience: env.GetString("JWT_AUDIENCE", "connection-sphere-clients"),
			},
		},
		rateLimiter: ratelimiterConfig{
			requestsPerTimeFrame: env.GetInt("RATE_LIMIT_REQUESTS", 100),
			timeFrame:            env.GetDuration("RATE_LIMIT_TIMEFRAME", time.Minute),
			enabled:              env.GetBool("RATE_LIMIT_ENABLED", false), // default disabled
		},
	}

	// Logger configuration
	logger := zap.Must(zap.NewProduction()).Sugar()
	defer func(logger *zap.SugaredLogger) {
		err := logger.Sync()
		if err != nil {
			log.Fatal(err)
		}
	}(logger) // flushes buffer, if any

	// Database connection
	db, err := db.New(
		cfg.db.addr,
		cfg.db.maxOpenConns,
		cfg.db.maxIdleConns,
		cfg.db.maxIdleTime,
	)
	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()
	log.Printf("Connected to database at %s", cfg.db.addr)

	// Cache
	var rdb *redis.Client
	if cfg.redisCfg.enabled {
		rdb = cache.NewRedisClient(cfg.redisCfg.addr, cfg.redisCfg.pw, cfg.redisCfg.db)
		defer rdb.Close()

		log.Printf("Connected to Redis DB at %s", cfg.redisCfg.addr)
	}

	// Rate limiter
	ratelimiter := ratelimiter.NewFixedWindowRateLimiter(
		cfg.rateLimiter.requestsPerTimeFrame,
		cfg.rateLimiter.timeFrame,
	)

	store := store.NewStorage(db)
	cacheStore := cache.NewRedisStorage(rdb)

	mailer := mailer.NewSendgrid(cfg.mail.sendGrid.apiKey, cfg.mail.fromEmail)

	jwtAuthenticator := auth.NewJWTAuthenticator(
		cfg.auth.token.secret,
		cfg.auth.token.audience,
		cfg.auth.token.issuer,
	)

	app := &application{
		config:        cfg,
		store:         store,
		cacheStore:    cacheStore,
		logger:        logger,
		mailer:        mailer,
		authenticator: jwtAuthenticator,
		rateLimiter:   ratelimiter,
	}

	mux := app.mount()
	log.Fatal(app.run(mux))
}
