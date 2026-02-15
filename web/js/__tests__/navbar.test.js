import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock auth and router modules before importing navbar
vi.mock('../auth.js', () => ({
    isAuthenticated: vi.fn(),
    removeToken: vi.fn(),
}));

vi.mock('../router.js', () => ({
    navigate: vi.fn(),
}));

import { renderNavbar } from '../components/navbar.js';
import { isAuthenticated, removeToken } from '../auth.js';
import { navigate } from '../router.js';

describe('renderNavbar', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        vi.clearAllMocks();
    });

    it('renders a nav element with class navbar', () => {
        isAuthenticated.mockReturnValue(false);
        renderNavbar(container);
        const nav = container.querySelector('nav.navbar');
        expect(nav).not.toBeNull();
    });

    it('renders brand link with text "Connection Sphere"', () => {
        isAuthenticated.mockReturnValue(false);
        renderNavbar(container);
        const brand = container.querySelector('.navbar-brand');
        expect(brand).not.toBeNull();
        expect(brand.textContent).toBe('Connection Sphere');
    });

    it('brand links to #/login when not authenticated', () => {
        isAuthenticated.mockReturnValue(false);
        renderNavbar(container);
        const brand = container.querySelector('.navbar-brand');
        expect(brand.getAttribute('href')).toBe('#/login');
    });

    it('brand links to #/feed when authenticated', () => {
        isAuthenticated.mockReturnValue(true);
        renderNavbar(container);
        const brand = container.querySelector('.navbar-brand');
        expect(brand.getAttribute('href')).toBe('#/feed');
    });

    it('renders hamburger toggle button', () => {
        isAuthenticated.mockReturnValue(false);
        renderNavbar(container);
        const toggle = container.querySelector('.navbar-toggle');
        expect(toggle).not.toBeNull();
        expect(toggle.tagName).toBe('BUTTON');
        expect(toggle.getAttribute('aria-label')).toBe('Toggle navigation');
    });

    describe('when not authenticated', () => {
        beforeEach(() => {
            isAuthenticated.mockReturnValue(false);
            renderNavbar(container);
        });

        it('shows Login and Register links', () => {
            const links = container.querySelectorAll('.navbar-link');
            const texts = Array.from(links).map(l => l.textContent);
            expect(texts).toEqual(['Login', 'Register']);
        });

        it('Login links to #/login', () => {
            const links = container.querySelectorAll('.navbar-link');
            expect(links[0].getAttribute('href')).toBe('#/login');
        });

        it('Register links to #/register', () => {
            const links = container.querySelectorAll('.navbar-link');
            expect(links[1].getAttribute('href')).toBe('#/register');
        });

        it('does not show Logout button', () => {
            const logout = container.querySelector('.navbar-logout');
            expect(logout).toBeNull();
        });
    });

    describe('when authenticated', () => {
        beforeEach(() => {
            isAuthenticated.mockReturnValue(true);
            renderNavbar(container);
        });

        it('shows Feed and New Post links', () => {
            const links = container.querySelectorAll('.navbar-link');
            const texts = Array.from(links).map(l => l.textContent);
            expect(texts).toEqual(['Feed', 'New Post']);
        });

        it('Feed links to #/feed', () => {
            const links = container.querySelectorAll('.navbar-link');
            expect(links[0].getAttribute('href')).toBe('#/feed');
        });

        it('New Post links to #/posts/new', () => {
            const links = container.querySelectorAll('.navbar-link');
            expect(links[1].getAttribute('href')).toBe('#/posts/new');
        });

        it('shows Logout button (not a link)', () => {
            const logout = container.querySelector('.navbar-logout');
            expect(logout).not.toBeNull();
            expect(logout.tagName).toBe('BUTTON');
            expect(logout.textContent).toBe('Logout');
        });

        it('Logout button calls removeToken and navigates to /login', () => {
            const logout = container.querySelector('.navbar-logout');
            logout.click();
            expect(removeToken).toHaveBeenCalled();
            expect(navigate).toHaveBeenCalledWith('/login');
        });
    });

    it('hamburger toggle toggles navbar-links--open class', () => {
        isAuthenticated.mockReturnValue(false);
        renderNavbar(container);
        const toggle = container.querySelector('.navbar-toggle');
        const navLinks = container.querySelector('.navbar-links');

        expect(navLinks.classList.contains('navbar-links--open')).toBe(false);
        toggle.click();
        expect(navLinks.classList.contains('navbar-links--open')).toBe(true);
        toggle.click();
        expect(navLinks.classList.contains('navbar-links--open')).toBe(false);
    });

    it('clears container before rendering', () => {
        container.innerHTML = '<p>old content</p>';
        isAuthenticated.mockReturnValue(false);
        renderNavbar(container);
        expect(container.querySelector('p')).toBeNull();
        expect(container.querySelector('nav')).not.toBeNull();
    });
});
