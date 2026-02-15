// Register View
import { post } from '../api.js';
import { setToken } from '../auth.js';
import { navigate } from '../router.js';

export function render(container) {
    container.innerHTML = `
        <div class="auth-form">
            <h2>Register</h2>
            <div class="form-error" id="register-error" style="display:none;"></div>
            <form id="register-form">
                <div class="form-group">
                    <label class="form-label" for="register-username">Username</label>
                    <input class="form-input" id="register-username" type="text" required />
                </div>
                <div class="form-group">
                    <label class="form-label" for="register-email">Email</label>
                    <input class="form-input" id="register-email" type="email" required />
                </div>
                <div class="form-group">
                    <label class="form-label" for="register-password">Password</label>
                    <input class="form-input" id="register-password" type="password" required />
                </div>
                <button class="btn btn-primary" type="submit">Register</button>
            </form>
            <div class="guest-divider"><span>or</span></div>
            <button class="btn btn-guest" id="guest-register-btn">Continue as Guest</button>
            <p>Already have an account? <a href="#/login">Login</a></p>
        </div>
    `;

    const form = document.getElementById('register-form');
    const usernameInput = document.getElementById('register-username');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const errorDiv = document.getElementById('register-error');

    function clearError() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
    }

    usernameInput.addEventListener('input', clearError);
    emailInput.addEventListener('input', clearError);
    passwordInput.addEventListener('input', clearError);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !email || !password) {
            showError('All fields are required');
            return;
        }

        const { data, error } = await post('/authentication/user', { username, email, password });

        if (error) {
            showError(error);
            return;
        }

        setToken(data.token);
        navigate('/feed');
    });

    document.getElementById('guest-register-btn').addEventListener('click', async () => {
        clearError();
        const btn = document.getElementById('guest-register-btn');
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
