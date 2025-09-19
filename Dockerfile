##############################################
# 1️⃣  BUILD STAGE – Compile the Go binary
##############################################

# Use the official Go 1.24 image as a build environment.
# It’s based on Debian and already contains Go, git, and CA certificates.
FROM golang:1.24 AS builder

# Set the working directory inside the container to /app
WORKDIR /app

# Copy all source code from the host machine into the container’s /app folder
COPY . .

# Build the Go application as a static Linux binary:
# - CGO_ENABLED=0   -> disable CGO so the binary is fully static
# - GOOS=linux      -> target Linux OS (important if building on Mac/Windows)
# - -a -installsuffix cgo -> ensure everything is rebuilt without cgo
# - -o api          -> output binary named "api"
# - cmd/api/*.go    -> main entrypoint files for the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o api cmd/api/*.go


##############################################
# 2️⃣  RUN STAGE – Create the minimal runtime image
##############################################

# Use the empty "scratch" image to keep the final image tiny.
# This contains nothing except what we copy in the next steps.
FROM scratch

# Set the working directory in the runtime container
WORKDIR /app

# Copy the system’s trusted Certificate Authority bundle from the builder stage.
# This allows HTTPS/TLS requests (e.g., calling external APIs securely).
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the compiled Go binary from the builder stage to the runtime container
COPY --from=builder /app/api .

# Expose port 8080 so platforms like Docker/Kubernetes/Cloud Run
# know which port the application listens on.
EXPOSE 8080

# Define the default command to start the container:
# run the binary named "api"
CMD ["./api"]
