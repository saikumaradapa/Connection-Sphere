package main

import (
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

	addr := env.GetString("DB_ADDR", "postgres://root:admin@localhost:5432/connection_sphere?sslmode=disable")
	conn, err := db.New(addr, 3, 3, "15m")
	if err != nil {
		log.Fatal(err)
	}

	defer conn.Close()

	store := store.NewStorage(conn)

	db.Seed(store, conn)
}
