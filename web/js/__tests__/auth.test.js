import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, removeToken, isAuthenticated, getUserFromToken } from '../auth.js';

// Helper: create a JWT with a given payload
function makeJWT(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const sig = 'fakesignature';
    return `${header}.${body}.${sig}`;
}

describe('Auth Manager', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getToken / setToken / removeToken', () => {
        it('returns null when no token is stored', () => {
            expect(getToken()).toBeNull();
        });

        it('stores and retrieves a token', () => {
            setToken('abc123');
            expect(getToken()).toBe('abc123');
        });

        it('uses the correct localStorage key', () => {
            setToken('mytoken');
            expect(localStorage.getItem('connection_sphere_token')).toBe('mytoken');
        });

        it('removes the token', () => {
            setToken('abc123');
            removeToken();
            expect(getToken()).toBeNull();
        });
    });

    describe('getUserFromToken', () => {
        it('returns null when no token exists', () => {
            expect(getUserFromToken()).toBeNull();
        });

        it('decodes a valid JWT payload', () => {
            const token = makeJWT({ sub: 42, exp: 1700000000, iat: 1699900000 });
            setToken(token);
            const user = getUserFromToken();
            expect(user).toEqual({ sub: 42, exp: 1700000000 });
        });

        it('returns null for a malformed token (not 3 parts)', () => {
            setToken('not.a.valid.jwt.token');
            expect(getUserFromToken()).toBeNull();
        });

        it('returns null for a token with invalid base64', () => {
            setToken('header.!!!invalid!!!.sig');
            expect(getUserFromToken()).toBeNull();
        });

        it('returns null when sub is missing', () => {
            const token = makeJWT({ exp: 1700000000 });
            setToken(token);
            expect(getUserFromToken()).toBeNull();
        });

        it('returns null when exp is missing', () => {
            const token = makeJWT({ sub: 1 });
            setToken(token);
            expect(getUserFromToken()).toBeNull();
        });

        it('returns null when sub is not a number', () => {
            const token = makeJWT({ sub: 'notanumber', exp: 1700000000 });
            setToken(token);
            expect(getUserFromToken()).toBeNull();
        });
    });

    describe('isAuthenticated', () => {
        it('returns false when no token exists', () => {
            expect(isAuthenticated()).toBe(false);
        });

        it('returns true for a non-expired token', () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600;
            const token = makeJWT({ sub: 1, exp: futureExp });
            setToken(token);
            expect(isAuthenticated()).toBe(true);
        });

        it('returns false for an expired token', () => {
            const pastExp = Math.floor(Date.now() / 1000) - 3600;
            const token = makeJWT({ sub: 1, exp: pastExp });
            setToken(token);
            expect(isAuthenticated()).toBe(false);
        });

        it('returns false for a malformed token', () => {
            setToken('garbage');
            expect(isAuthenticated()).toBe(false);
        });
    });
});
