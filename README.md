## Dependencies

- [go-chi/chi](https://github.com/go-chi/chi): Lightweight, idiomatic and composable router for building Go HTTP services  
- [air-verse/air](https://github.com/air-verse/air): Live reloading for Go apps during development  
- [joho/godotenv](https://github.com/joho/godotenv): Loads environment variables from `.env` file
- [jackc/pgx](https://github.com/jackc/pgx): PostgreSQL driver and toolkit for Go (modern, efficient replacement for `pq`)

### Install dependencies
```bash
go get -u github.com/go-chi/chi/v5
go install github.com/air-verse/air@latest
go get github.com/joho/godotenv
go get github.com/jackc/pgx/v5
```


## Run Air

```bash 
# Install Air (if not already)
go install github.com/air-verse/air@latest

# Initialize Air (creates .air.toml config file — update it to match your project structure)
air init

# Start the live-reloading server
air
```

## golang-migrate
```bash 
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest # to install the migraions package

migrate create -seq -ext sql -dir cmd/migrate/migrations create_users # to create migraion 



```