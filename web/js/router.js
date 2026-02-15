// Hash-based SPA Router
import { isAuthenticated } from './auth.js';

const routes = [];
let container = null;
let notFoundView = null;
let routeChangeCallback = null;

/**
 * Register a route pattern with its view function.
 * @param {string} pattern - Route pattern (e.g., '/posts/:id')
 * @param {Function} viewFn - View render function(container, params)
 * @param {boolean} requiresAuth - Whether the route requires authentication
 */
export function addRoute(pattern, viewFn, requiresAuth = false) {
    routes.push({ pattern, viewFn, requiresAuth });
}

/**
 * Navigate to a hash path.
 * @param {string} path - Path without the '#' prefix (e.g., '/feed')
 */
export function navigate(path) {
    window.location.hash = '#' + path;
}

/**
 * Get the current route info.
 * @returns {{ path: string, params: object }}
 */
export function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const match = matchRoute(hash);
    return {
        path: hash,
        params: match ? match.params : {},
    };
}

/**
 * Set the container element where views are rendered.
 * @param {HTMLElement} el
 */
export function setContainer(el) {
    container = el;
}

/**
 * Set the view function for unknown routes.
 * @param {Function} viewFn
 */
export function setNotFoundView(viewFn) {
    notFoundView = viewFn;
}

/**
 * Set a callback that fires on every route change.
 * @param {Function} callback
 */
export function onRouteChange(callback) {
    routeChangeCallback = callback;
}

/**
 * Initialize the router: listen for hashchange and handle the initial hash.
 */
export function init() {
    window.addEventListener('hashchange', () => handleRoute());
    handleRoute();
}

/**
 * Match a path against registered routes.
 * Routes are checked in registration order, so static routes registered
 * before dynamic ones will match first.
 * @param {string} path
 * @returns {{ viewFn: Function, params: object, requiresAuth: boolean } | null}
 */
function matchRoute(path) {
    // Normalize: strip trailing slash (but keep '/' as is)
    const normalizedPath = path === '/' ? '/' : path.replace(/\/+$/, '');

    for (const route of routes) {
        const params = extractParams(route.pattern, normalizedPath);
        if (params !== null) {
            return { viewFn: route.viewFn, params, requiresAuth: route.requiresAuth };
        }
    }
    return null;
}

/**
 * Try to match a pattern against a path and extract dynamic segments.
 * @param {string} pattern - e.g., '/posts/:id/edit'
 * @param {string} path - e.g., '/posts/42/edit'
 * @returns {object|null} - Extracted params or null if no match
 */
function extractParams(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
        return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            // Dynamic segment — extract the value
            const paramName = patternParts[i].slice(1);
            params[paramName] = decodeURIComponent(pathParts[i]);
        } else if (patternParts[i] !== pathParts[i]) {
            // Static segment mismatch
            return null;
        }
    }

    return params;
}

/**
 * Core routing logic: match the current hash, enforce auth, render view.
 */
function handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const match = matchRoute(hash);

    if (routeChangeCallback) {
        routeChangeCallback(hash);
    }

    if (!match) {
        // Unknown route — render NotFound view
        if (notFoundView && container) {
            notFoundView(container, {});
        }
        return;
    }

    // Auth guard: redirect to login if route requires auth and user isn't authenticated
    if (match.requiresAuth && !isAuthenticated()) {
        navigate('/login');
        return;
    }

    if (container) {
        match.viewFn(container, match.params);
    }
}

/**
 * Reset all internal state. For testing only.
 */
export function _reset() {
    routes.length = 0;
    container = null;
    notFoundView = null;
    routeChangeCallback = null;
}
