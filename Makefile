# Load environment variables from the .env.dev file
include .env.dev

# Define the path where all migration SQL files will be stored
MIGRATIONS_PATH = ./cmd/migrate/migrations

# Declare 'migrate-create' as a phony target (not a real file)
.PHONY: migrate-create

# Create a new SQL migration file with the given name
# Usage: make migrate-create name=your_migration_name
migrate-create:
	@migrate create -seq -ext sql -dir $(MIGRATIONS_PATH) $(name)

# Declare 'migrate-up' as a phony target
.PHONY: migrate-up

# Apply all pending 'up' migrations to the database
# Usage: make migrate-up
migrate-up:
	@migrate -path=$(MIGRATIONS_PATH) -database=$(DB_ADDR) up

# Declare 'migrate-down' as a phony target
.PHONY: migrate-down

# Roll back the last 'n' migrations
# Usage: make migrate-down count=n (e.g., make migrate-down count=1)
migrate-down:
	@migrate -path=$(MIGRATIONS_PATH) -database=$(DB_ADDR) down $(count)

# Declare 'migrate-force' as a phony target
.PHONY: migrate-force

# Force the database to a specific version (used to fix dirty state)
# Usage: make migrate-force VER=n
migrate-force:
	@migrate -path=$(MIGRATIONS_PATH) -database=$(DB_ADDR) force $(VER)

# Declare 'seed' as a phony target
.PHONY: seed

# Run the seeding database script
seed:
	@go run cmd/migrate/seed/main.go
