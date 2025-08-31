package main

import (
	"net/http"
)

func (app *application) internalServerError(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Errorw("internal error", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	writeError(w, http.StatusInternalServerError, err.Error())
}

func (app *application) forbiddenErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnw("forbidden", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	writeError(w, http.StatusForbidden, err.Error())
}

func (app *application) badRequestResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnf("bad request", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	writeError(w, http.StatusBadRequest, err.Error())
}

func (app *application) notFoundResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnf("not found error", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	writeError(w, http.StatusNotFound, err.Error())
}

func (app *application) conflictResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Errorf("conflict response", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	writeError(w, http.StatusConflict, err.Error())
}

func (app *application) unauthorizedErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnf("unauthorized error", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	writeError(w, http.StatusUnauthorized, err.Error())

}

func (app *application) unauthorizedBasicErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.logger.Warnf("unauthorized basic error", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	// Adds the 'WWW-Authenticate' header to the response, telling the client that
	// Basic Authentication is required. The 'realm="Restricted"' label is shown in
	// browser login prompts, and 'charset="UTF-8"' ensures credentials are encoded
	// correctly. Without this header, the client wouldn't know it needs to provide
	// username and password.
	w.Header().Set("WWW-Authenticate", `Basic realm="Restricted", charset="UTF-8"`)

	writeError(w, http.StatusUnauthorized, err.Error())

}
