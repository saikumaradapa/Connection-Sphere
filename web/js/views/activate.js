// Account Activation View
import { put } from '../api.js';

export async function render(container, params) {
    const token = params.token;

    container.innerHTML = `
        <div class="activate-page">
            <h2>Account Activation</h2>
            <p>Activating your account...</p>
        </div>
    `;

    const page = container.querySelector('.activate-page');
    const { data, error } = await put('/users/activate/' + token);

    if (error) {
        page.innerHTML = `
            <h2>Account Activation</h2>
            <div class="activate-error">
                <p>${error}</p>
                <p><a href="#/register">Back to Register</a></p>
            </div>
        `;
        return;
    }

    page.innerHTML = `
        <h2>Account Activation</h2>
        <div class="activate-success">
            <p>Account activated successfully!</p>
            <p><a href="#/login">Go to Login</a></p>
        </div>
    `;
}
