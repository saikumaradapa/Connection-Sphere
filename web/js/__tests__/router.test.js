import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    addRoute,
    navigate,
    getCurrentRoute,
    setContainer,
    setNotFoundView,
    onRouteChange,
    init,
    _reset,
} from '../router.js';

// Helper: create a JWT with a given payload
function makeJWT(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const sig = 'fakesignature';
    return `${header}.${body}.${sig}`;
}

describe('Router', () => {
    let container;

    beforeEach(() => {
        _reset();
        localStorage.clear();
        window.location.hash = '';
        container = document.createElement('div');
    });

    describe('addRoute and route matching', () => {
        it('matches a static route and calls the view function', async () => {
            const viewFn = vi.fn();
            addRoute('/login', viewFn, false);
            setContainer(container);
            window.location.hash = '#/login';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(viewFn).toHaveBeenCalledWith(container, {});
        });

        it('extracts dynamic params from route pattern', async () => {
            const viewFn = vi.fn();
            addRoute('/posts/:id', viewFn, false);
            setContainer(container);
            window.location.hash = '#/posts/42';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(viewFn).toHaveBeenCalledWith(container, { id: '42' });
        });

        it('extracts multiple dynamic params', async () => {
            const viewFn = vi.fn();
            addRoute('/users/:userId/posts/:postId', viewFn, false);
            setContainer(container);
            window.location.hash = '#/users/5/posts/99';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(viewFn).toHaveBeenCalledWith(container, { userId: '5', postId: '99' });
        });

        it('matches static routes before dynamic routes (registration order)', async () => {
            const staticView = vi.fn();
            const dynamicView = vi.fn();
            addRoute('/posts/new', staticView, false);
            addRoute('/posts/:id', dynamicView, false);
            setContainer(container);
            window.location.hash = '#/posts/new';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(staticView).toHaveBeenCalled();
            expect(dynamicView).not.toHaveBeenCalled();
        });

        it('does not match when segment count differs', async () => {
            const viewFn = vi.fn();
            const notFound = vi.fn();
            addRoute('/posts/:id', viewFn, false);
            setNotFoundView(notFound);
            setContainer(container);
            window.location.hash = '#/posts/42/extra';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(viewFn).not.toHaveBeenCalled();
            expect(notFound).toHaveBeenCalled();
        });
    });

    describe('auth guard', () => {
        it('redirects to #/login for protected routes when not authenticated', async () => {
            const protectedView = vi.fn();
            const loginView = vi.fn();
            addRoute('/login', loginView, false);
            addRoute('/feed', protectedView, true);
            setContainer(container);
            window.location.hash = '#/feed';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(protectedView).not.toHaveBeenCalled();
            expect(window.location.hash).toBe('#/login');
        });

        it('allows access to protected routes when authenticated', async () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600;
            localStorage.setItem('connection_sphere_token', makeJWT({ sub: 1, exp: futureExp }));

            const protectedView = vi.fn();
            addRoute('/feed', protectedView, true);
            setContainer(container);
            window.location.hash = '#/feed';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(protectedView).toHaveBeenCalledWith(container, {});
        });
    });

    describe('notFound view', () => {
        it('renders notFound view for unknown routes', async () => {
            const notFound = vi.fn();
            addRoute('/login', vi.fn(), false);
            setNotFoundView(notFound);
            setContainer(container);
            window.location.hash = '#/unknown/path';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(notFound).toHaveBeenCalledWith(container, {});
        });
    });

    describe('navigate', () => {
        it('sets window.location.hash', () => {
            navigate('/feed');
            expect(window.location.hash).toBe('#/feed');
        });
    });

    describe('getCurrentRoute', () => {
        it('returns current path and params', async () => {
            addRoute('/posts/:id', vi.fn(), false);
            window.location.hash = '#/posts/7';

            await new Promise((r) => setTimeout(r, 10));
            const route = getCurrentRoute();
            expect(route.path).toBe('/posts/7');
            expect(route.params).toEqual({ id: '7' });
        });

        it('returns empty params for unmatched route', async () => {
            window.location.hash = '#/nope';

            await new Promise((r) => setTimeout(r, 10));
            const route = getCurrentRoute();
            expect(route.path).toBe('/nope');
            expect(route.params).toEqual({});
        });
    });

    describe('onRouteChange callback', () => {
        it('fires the callback on route change', async () => {
            const callback = vi.fn();
            addRoute('/login', vi.fn(), false);
            setContainer(container);
            onRouteChange(callback);
            window.location.hash = '#/login';
            init();

            await new Promise((r) => setTimeout(r, 50));
            expect(callback).toHaveBeenCalledWith('/login');
        });
    });

    describe('init handles initial hash', () => {
        it('renders the matching view on init without waiting for hashchange', async () => {
            const viewFn = vi.fn();
            addRoute('/register', viewFn, false);
            setContainer(container);
            window.location.hash = '#/register';

            await new Promise((r) => setTimeout(r, 10));
            init();

            // init() calls handleRoute synchronously
            expect(viewFn).toHaveBeenCalledWith(container, {});
        });
    });
});
