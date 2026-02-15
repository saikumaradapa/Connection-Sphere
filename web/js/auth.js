// Auth Manager - JWT token management

const TOKEN_KEY = 'connection_sphere_token';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
    const user = getUserFromToken();
    if (!user) return false;
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    return user.exp > now;
}

export function getUserFromToken() {
    const token = getToken();
    if (!token) return null;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        // Base64url decode: replace URL-safe chars and pad
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
        const decoded = atob(padded);
        const parsed = JSON.parse(decoded);

        if (typeof parsed.sub !== 'number' || typeof parsed.exp !== 'number') {
            return null;
        }

        return { sub: parsed.sub, exp: parsed.exp };
    } catch {
        return null;
    }
}
