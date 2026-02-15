import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, post, put, patch, del } from '../api.js';

// Mock auth module
vi.mock('../auth.js', () => ({
    getToken: vi.fn(() => null),
    removeToken: vi.fn(),
}));

import { getToken, removeToken } from '../auth.js';

function mockFetch(status, body, ok) {
    return vi.fn(() =>
        Promise.resolve({
            status,
            ok: ok !== undefined ? ok : status >= 200 && status < 300,
            json: () => Promise.resolve(body),
        })
    );
}

describe('API Client', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        vi.clearAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe('request construction', () => {
        it('sends GET request to /v1 + path', async () => {
            globalThis.fetch = mockFetch(200, { data: { id: 1 } });
            await get('/users/1');
            expect(globalThis.fetch).toHaveBeenCalledWith('/v1/users/1', {
                method: 'GET',
                headers: {},
            });
        });

        it('sends POST request with JSON body', async () => {
            globalThis.fetch = mockFetch(200, { data: { id: 1 } });
            const body = { email: 'test@test.com', password: 'pass' };
            await post('/authentication/token', body);
            expect(globalThis.fetch).toHaveBeenCalledWith('/v1/authentication/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        });

        it('sends PUT request', async () => {
            globalThis.fetch = mockFetch(204, null);
            await put('/users/1/follow');
            expect(globalThis.fetch).toHaveBeenCalledWith('/v1/users/1/follow', {
                method: 'PUT',
                headers: {},
            });
        });

        it('sends PATCH request with body', async () => {
            globalThis.fetch = mockFetch(200, { data: { id: 1 } });
            await patch('/posts/1', { title: 'Updated' });
            expect(globalThis.fetch).toHaveBeenCalledWith('/v1/posts/1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Updated' }),
            });
        });

        it('sends DELETE request', async () => {
            globalThis.fetch = mockFetch(204, null);
            await del('/posts/1');
            expect(globalThis.fetch).toHaveBeenCalledWith('/v1/posts/1', {
                method: 'DELETE',
                headers: {},
            });
        });
    });

    describe('auth header attachment', () => {
        it('attaches Bearer token when available', async () => {
            getToken.mockReturnValue('my-jwt-token');
            globalThis.fetch = mockFetch(200, { data: [] });
            await get('/users/feed');
            expect(globalThis.fetch).toHaveBeenCalledWith('/v1/users/feed', {
                method: 'GET',
                headers: { Authorization: 'Bearer my-jwt-token' },
            });
        });

        it('does not attach auth header when no token', async () => {
            getToken.mockReturnValue(null);
            globalThis.fetch = mockFetch(200, { data: [] });
            await get('/users/feed');
            expect(globalThis.fetch).toHaveBeenCalledWith('/v1/users/feed', {
                method: 'GET',
                headers: {},
            });
        });
    });

    describe('response parsing', () => {
        it('extracts data field from success response', async () => {
            globalThis.fetch = mockFetch(200, { data: { id: 1, title: 'Test' } });
            const result = await get('/posts/1');
            expect(result).toEqual({ data: { id: 1, title: 'Test' } });
        });

        it('extracts error field from error response', async () => {
            globalThis.fetch = mockFetch(400, { error: 'Validation failed' }, false);
            const result = await post('/posts', { title: '' });
            expect(result).toEqual({ error: 'Validation failed' });
        });

        it('handles 204 No Content', async () => {
            globalThis.fetch = vi.fn(() =>
                Promise.resolve({ status: 204, ok: true, json: () => Promise.reject() })
            );
            const result = await put('/users/1/follow');
            expect(result).toEqual({ data: null });
        });
    });

    describe('401 handling', () => {
        it('removes token and redirects to login on 401', async () => {
            globalThis.fetch = mockFetch(401, { error: 'Unauthorized' }, false);
            const result = await get('/users/feed');
            expect(removeToken).toHaveBeenCalled();
            expect(window.location.hash).toBe('#/login');
            expect(result).toEqual({ error: 'Unauthorized' });
        });
    });

    describe('network error handling', () => {
        it('returns connection failed message on network error', async () => {
            globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
            const result = await get('/users/feed');
            expect(result).toEqual({ error: 'Connection failed. Please try again.' });
        });
    });

    describe('non-JSON response handling', () => {
        it('returns data null for ok response with no parseable body', async () => {
            globalThis.fetch = vi.fn(() =>
                Promise.resolve({
                    status: 200,
                    ok: true,
                    json: () => Promise.reject(new SyntaxError('Unexpected end')),
                })
            );
            const result = await get('/some/path');
            expect(result).toEqual({ data: null });
        });

        it('returns error for non-ok response with no parseable body', async () => {
            globalThis.fetch = vi.fn(() =>
                Promise.resolve({
                    status: 500,
                    ok: false,
                    json: () => Promise.reject(new SyntaxError('Unexpected end')),
                })
            );
            const result = await get('/some/path');
            expect(result).toEqual({ error: 'An unexpected error occurred.' });
        });
    });
});
