package main

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/saikumaradapa/Connection-Sphere/internal/env"
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
	}

	app := &application{
		config: cfg,
	}

	mux := app.mount()
	log.Fatal(app.run(mux))
}
