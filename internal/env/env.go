package env

import (
	"log"
	"os"
	"strconv"
	"strings"
)

// GetString returns the value of the environment variable if present,
// otherwise returns the provided fallback value.
func GetString(key string, fallback string) string {
	val, ok := os.LookupEnv(key)
	if !ok {
		log.Printf("env.GetString: key %q not found, using fallback", key)
		return fallback
	}
	return strings.TrimSpace(val)
}

// GetInt returns the integer value of the environment variable if valid,
// otherwise returns the provided fallback value.
func GetInt(key string, fallback int) int {
	val, ok := os.LookupEnv(key)
	if !ok {
		log.Printf("env.GetInt: key %q not found, using fallback", key)
		return fallback
	}

	val = strings.TrimSpace(val)
	valAsInt, err := strconv.Atoi(val)
	if err != nil {
		log.Printf("env.GetInt: invalid integer for key %q: %v", key, err)
		return fallback
	}

	return valAsInt
}
