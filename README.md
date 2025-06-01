## Dependencies

- [go-chi/chi](https://github.com/go-chi/chi): Lightweight, idiomatic and composable router for building Go HTTP services
- [air-verse/air](https://github.com/air-verse/air): Live reloading for Go apps during development

### Install dependencies:
```bash
go get -u github.com/go-chi/chi/v5
go install github.com/air-verse/air@latest
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