// Login View
import { post } from '../api.js';
import { setToken } from '../auth.js';
import { navigate } from '../router.js';

export function render(container) {
    container.innerHTML = `
        <div class="auth-form">
            <h2>Login</h2>
            <div class="form-error" id="login-error" style="display:none;"></div>
            <form id="login-form">
                <div class="form-group">
                    <label class="form-label" for="login-email">Email</label>
                    <input class="form-input" id="login-email" type="email" required />
                </div>
                <div class="form-group">
                    <label class="form-label" for="login-password">Password</label>
                    <input class="form-input" id="login-password" type="password" required />
                </div>
                <button class="btn btn-primary" type="submit">Login</button>
            </form>
            <div class="guest-divider"><span>or</span></div>
            <button class="btn btn-guest" id="guest-login-btn">Continue as Guest</button>
            <p>Don't have an account? <a href="#/register">Register</a></p>
        </div>
    `;

    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorDiv = document.getElementById('login-error');

    function clearError() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
    }

    emailInput.addEventListener('input', clearError);
    passwordInput.addEventListener('input', clearError);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showError('All fields are required');
            return;
        }

        const { data, error } = await post('/authentication/token', { email, password });

        if (error) {
            showError(error);
            return;
        }

        setToken(data);
        navigate('/feed');
    });

    document.getElementById('guest-login-btn').addEventListener('click', async () => {
        clearError();
        const btn = document.getElementById('guest-login-btn');
        btn.disabled = true;
        btn.textContent = 'Setting up...';

        const { data, error } = await post('/authentication/guest');

        if (error || !data) {
            showError(error || 'Guest login failed. Please try again.');
            btn.disabled = false;
            btn.textContent = 'Continue as Guest';
            return;
        }

        setToken(data);
        navigate('/feed');
    });
}
