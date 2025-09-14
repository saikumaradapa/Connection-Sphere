# 🌐 Connection-Sphere

A production-ready social media application backend written in **Go** to showcase modern backend engineering practices: clean architecture, repository pattern, distributed-system safeguards, PostgreSQL persistence, Redis caching, authentication & authorization, migrations, rate limiting, graceful shutdowns and developer productivity tooling and a rich set of developer and DevOps tools.

This repository is intended to demonstrate production-oriented patterns and integrations commonly used in real-world services.

---
## ✨ Highlights / What I Built
- 🌐 **[RESTful API](https://restfulapi.net/)** with modular routing and handlers
- 🐘 **[PostgreSQL](https://www.postgresql.org/)** persistence using [pgx](https://github.com/jackc/pgx) and SQL migrations
- 🗂 **Repository pattern** to decouple business logic from data access
- ⚡ **Redis-based caching** layer and cache invalidation
- 🔑 **JWT authentication**, role-based authorization, and invitation flows using [google/uuid](https://github.com/google/uuid)
- 💾 **SQL transactions** and optimistic concurrency control (versioned rows)
- ♻️ **Sagas-style compensation** for multi-step distributed actions
- 🚦 **Fixed-window rate limiter** implementation
- 🛑 **Graceful shutdown** using goroutines and context
- 📝 Structured logging with [uber/zap](https://github.com/uber-go/zap) (sugared logger)
- 📊 Server metrics exposed via [expvar](https://pkg.go.dev/expvar)
- 📜 API documentation using [Swagger/OpenAPI](https://swagger.io/)
- 🤖 CI with [GitHub Actions](https://github.com/features/actions) workflows

### 🛠 Tech Stack
- **Language:** Go
- **Router:** [chi](https://github.com/go-chi/chi) — handlers are written against `http.Handler` for portability
- **Database:** PostgreSQL ([jackc/pgx](https://github.com/jackc/pgx)) + [golang-migrate](https://github.com/golang-migrate/migrate) for migrations
- **Cache:** Redis
- **Auth:** JWT (stateless) and role-based authorization
- **Logging:** [uber/zap](https://github.com/uber-go/zap) (sugared logger)
- **Validation:** [go-playground/validator](https://github.com/go-playground/validator)
- **Live reload (dev):** [air-verse/air](https://github.com/air-verse/air)
- **Mail:** SendGrid integration (email templates included)
- **Rate limiting:** Fixed-window implementation in `internal/ratelimiter`
- **CI:** GitHub Actions (see `.github/workflows`)
- **Other tools:** `google/uuid`, `expvar`, `golang-migrate`

---
## 📂 Folder Structure (Summary)
```
Connection-Sphere/
│   .air.toml
│   .env.example
│   docker-compose.yml
│   Makefile
│   go.mod
│   go.sum
├── cmd/
│   ├── api/        # HTTP handlers, routes, server bootstrap, middlewares
│   └── migrate/    # migrations & seed scripts
├── internal/
│   ├── auth/       # JWT & auth helpers
│   ├── db/         # DB connection & seeding
│   ├── env/        # Environment loader
│   ├── mailer/     # SendGrid adapter & templates
│   ├── ratelimiter/# Fixed-window rate limiter
│   └── store/      # Repository implementations (users, posts, etc.)
└── scripts/        # SQL and concurrency test scripts
```

---
## 🏃 How to Run (Developer Flow - Windows)

1. **Clone the repository: Connection-Sphere**
```powershell
git clone https://github.com/saikumaradapa/Connection-Sphere.git
cd Connection-Sphere
```

2. **Ensure Go is installed** (Go 1.20+ recommended). Initialize modules:
```powershell
go mod tidy
```

3. **Start dependencies** (Postgres, Redis, Redis Commander) with Docker Compose:
```powershell
docker-compose up -d
```

4. **Install `make`** (if you don't have it) using Chocolatey:
```powershell
choco install make
```

5. **Install the go-migrate CLI:**
```powershell
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

6. **Run migrations and seed demo data:**
```powershell
make migrate-up    # create/upgrade DB schema
make seed          # run seeding script (cmd/migrate/seed)
```

7. **(Optional) Install Air for hot reload (one-time):**
```powershell
go install github.com/air-verse/air@latest
# air init not required because .air.toml is provided
```

8. **Copy environment example and update values:**
```powershell
copy .env.example .env.dev
# Edit .env.dev and fill DB/Redis/SendGrid/JWT secrets
```

9. **Start the dev server with Air (or run the binary directly):**
```powershell
air            
# builds the binary and runs with live-reload
# or run directly (no live reload)
go run ./cmd/api
```

10. **UI Access**
- Swagger API Docs: [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)
- Redis Commander: [http://localhost:8081/](http://localhost:8081/)

---
## 🧩 Makefile Commands
| Command | Description |
|--------|------------|
| `make migrate-create name=my_migration` | Create a new SQL migration file |
| `make migrate-up` | Apply all pending “up” migrations |
| `make migrate-down count=1` | Roll back the last n migrations |
| `make migrate-force VER=3` | Force DB to a specific migration version |
| `make seed` | Seed demo data |
| `make gen-docs` | Generate Swagger/OpenAPI docs |

---
## 🏗 Repository Pattern
The Repository pattern abstracts database logic into `internal/store`, allowing the HTTP/business layer (`cmd/api`) to remain clean, testable, and database-agnostic.  
This design enables easy swapping of data sources or refactoring without impacting the rest of the application.

---
## 🔒 Security & Best Practices
- Password hashing used: **bcrypt**
- Used generic authentication error messages to avoid Enumeration Attack (e.g., *"Invalid credentials"*)
- JWTs for stateless authentication and role-based authorization for protected endpoints
- Optimistic concurrency control using a `version` column to avoid conflicting updates
- Sagas-style compensation to safely revert microservice operations across services when needed

---
## 📊 Observability & Dev Tools
- **Logging**: Structured, sugared logging via **zap**
- **Metrics**: Built-in server metrics via **expvar**
- **Documentation**: Interactive API documentation with **Swagger/OpenAPI**
- **CI/CD**: **GitHub Actions** workflows for automated checks

---
## 📝 Notes (for testing purpose)
- Run `go mod tidy` if you add or update dependencies
- Run `npx autocannon` to load test endpoints  
  ```bash
  npx autocannon http://localhost:8080/v1/users/130 --connections 5 --duration 2 --headers "Authorization: Bearer <token>" --renderStatusCodes
  # get fresh jwt token from swagger UI by creating and activation of user
  ```
- To test graceful shutdown, curl an endpoint and quickly press Ctrl + C or kill the process in console. The server will complete the request before shutting down.
- Make sure to set RATE_LIMIT_ENABLED and REDIS_ENABLED to true in .env.dev (by default, these are false)
- To test mail invitations/activation codes, create a SendGrid API key (free and no credit card required) and update FROM_EMAIL and SENDGRID_API_KEY
- Keep ENV=production to allow sending mails; by default SMTP operates in sandbox mode.

---
## ✨ Contributing

Pull requests are welcome! 🙌 This project is open for contributions from the community. 🌍

If you'd like to contribute, feel free to fork the repository, make your changes, and open a pull request. 🔄💻

---

## 🤝 Connect with Me

You can connect with me on LinkedIn: **[Sai Kumar Adapa](https://www.linkedin.com/in/sai-kumar-adapa-5a16b2228/)** 🔗😊