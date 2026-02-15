import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock api.js
vi.mock('../api.js', () => ({
    post: vi.fn(),
}));

// Mock auth.js
vi.mock('../auth.js', () => ({
    setToken: vi.fn(),
}));

// Mock router.js
vi.mock('../router.js', () => ({
    navigate: vi.fn(),
}));

import { render } from '../views/login.js';
import { post } from '../api.js';
import { setToken } from '../auth.js';
import { navigate } from '../router.js';

describe('Login View', () => {
    let container;

    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
        render(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('renders a login form with email and password fields', () => {
        expect(container.querySelector('h2').textContent).toBe('Login');
        expect(container.querySelector('input[type="email"]')).not.toBeNull();
        expect(container.querySelector('input[type="password"]')).not.toBeNull();
        expect(container.querySelector('button[type="submit"]').textContent).toBe('Login');
    });

    it('renders a link to the registration page', () => {
        const link = container.querySelector('a[href="#/register"]');
        expect(link).not.toBeNull();
        expect(link.textContent).toBe('Register');
    });

    it('shows error div hidden by default', () => {
        const errorDiv = container.querySelector('#login-error');
        expect(errorDiv.style.display).toBe('none');
    });

    it('shows validation error when email is empty', async () => {
        const passwordInput = container.querySelector('#login-password');
        passwordInput.value = 'password123';

        const form = container.querySelector('#login-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            const errorDiv = container.querySelector('#login-error');
            expect(errorDiv.style.display).toBe('block');
            expect(errorDiv.textContent).toBe('All fields are required');
        });

        expect(post).not.toHaveBeenCalled();
    });

    it('shows validation error when password is empty', async () => {
        const emailInput = container.querySelector('#login-email');
        emailInput.value = 'test@example.com';

        const form = container.querySelector('#login-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            const errorDiv = container.querySelector('#login-error');
            expect(errorDiv.style.display).toBe('block');
            expect(errorDiv.textContent).toBe('All fields are required');
        });

        expect(post).not.toHaveBeenCalled();
    });

    it('shows validation error when both fields are whitespace', async () => {
        const emailInput = container.querySelector('#login-email');
        const passwordInput = container.querySelector('#login-password');
        emailInput.value = '   ';
        passwordInput.value = '   ';

        const form = container.querySelector('#login-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            const errorDiv = container.querySelector('#login-error');
            expect(errorDiv.textContent).toBe('All fields are required');
        });

        expect(post).not.toHaveBeenCalled();
    });

    it('calls API and navigates on successful login', async () => {
        post.mockResolvedValue({ data: 'jwt-token-string' });

        const emailInput = container.querySelector('#login-email');
        const passwordInput = container.querySelector('#login-password');
        emailInput.value = 'test@example.com';
        passwordInput.value = 'password123';

        const form = container.querySelector('#login-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(post).toHaveBeenCalledWith('/authentication/token', {
                email: 'test@example.com',
                password: 'password123',
            });
            expect(setToken).toHaveBeenCalledWith('jwt-token-string');
            expect(navigate).toHaveBeenCalledWith('/feed');
        });
    });

    it('displays API error message on failed login', async () => {
        post.mockResolvedValue({ error: 'Invalid email or password' });

        const emailInput = container.querySelector('#login-email');
        const passwordInput = container.querySelector('#login-password');
        emailInput.value = 'test@example.com';
        passwordInput.value = 'wrongpassword';

        const form = container.querySelector('#login-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            const errorDiv = container.querySelector('#login-error');
            expect(errorDiv.style.display).toBe('block');
            expect(errorDiv.textContent).toBe('Invalid email or password');
        });

        expect(setToken).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it('clears error when user types in email field', async () => {
        // Trigger a validation error first
        const form = container.querySelector('#login-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(container.querySelector('#login-error').style.display).toBe('block');
        });

        // Type in email field
        const emailInput = container.querySelector('#login-email');
        emailInput.dispatchEvent(new Event('input'));

        expect(container.querySelector('#login-error').style.display).toBe('none');
    });

    it('clears error when user types in password field', async () => {
        const form = container.querySelector('#login-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(container.querySelector('#login-error').style.display).toBe('block');
        });

        const passwordInput = container.querySelector('#login-password');
        passwordInput.dispatchEvent(new Event('input'));

        expect(container.querySelector('#login-error').style.display).toBe('none');
    });

    it('uses correct CSS classes', () => {
        expect(container.querySelector('.auth-form')).not.toBeNull();
        expect(container.querySelectorAll('.form-group').length).toBe(2);
        expect(container.querySelectorAll('.form-input').length).toBe(2);
        expect(container.querySelectorAll('.form-label').length).toBe(2);
        expect(container.querySelector('.form-error')).not.toBeNull();
        expect(container.querySelector('.btn.btn-primary')).not.toBeNull();
    });
});
