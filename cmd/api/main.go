package main

import (
	"fmt"
	"log"
	"time"

	"go.uber.org/zap"

	"github.com/joho/godotenv"
	"github.com/saikumaradapa/Connection-Sphere/internal/db"
	"github.com/saikumaradapa/Connection-Sphere/internal/env"
	"github.com/saikumaradapa/Connection-Sphere/internal/store"
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
		addr:   fmt.Sprintf("%s:%s", host, port),
		apiURL: env.GetString("EXTERNAL_URL", "localhost:3030"),
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", "postgres://root:admin@localhost:5432/connection_sphere?sslmode=disable"),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleConns: env.GetInt("DB_IDLE_OPEN_CONNS", 30),
			maxIdleTime:  env.GetString("MAX_IDLE_TIME", "15m"),
		},
		env: env.GetString("ENV", "dev"),
		mail: mailConfig{
			exp: time.Hour * 3, // 3 days
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

	store := store.NewStorage(db)
	app := &application{
		config: cfg,
		store:  store,
		logger: logger,
	}

	mux := app.mount()
	log.Fatal(app.run(mux))
}
