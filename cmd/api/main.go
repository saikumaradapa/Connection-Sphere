package main

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/saikumaradapa/Connection-Sphere/internal/db"
	"github.com/saikumaradapa/Connection-Sphere/internal/env"
	"github.com/saikumaradapa/Connection-Sphere/internal/store"
)

func main() {
	// Load env vars from .env.dev
	if err := godotenv.Load(".env.dev"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	host := env.GetString("HOST", "localhost")
	port := env.GetString("PORT", "3030")

	cfg := config{
		addr: fmt.Sprintf("%s:%s", host, port),
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", "postgres://root:admin@localhost:5432/connection_sphere?sslmode=disable"),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleConns: env.GetInt("DB_IDLE_OPEN_CONNS", 30),
			maxIdleTime:  env.GetString("MAX_IDLE_TIME", "15m"),
		},
	}

	db, err := db.New(
		cfg.db.addr,
		cfg.db.maxOpenConns,
		cfg.db.maxIdleConns,
		cfg.db.maxIdleTime,
	)
	if err != nil {
		log.Fatal(err)
	}

	store := store.NewStorage(db)
	app := &application{
		config: cfg,
		store:  store,
	}

	mux := app.mount()
	log.Fatal(app.run(mux))
}
