// Edit Post View
import { get, patch } from '../api.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';

export function render(container, params) {
    const id = params.id;

    container.innerHTML = `
        <div class="auth-form">
            <h2>Edit Post</h2>
            <div id="edit-post-loading">Loading post...</div>
            <div class="form-error" id="edit-post-error" style="display:none;"></div>
            <form id="edit-post-form" style="display:none;">
                <div class="form-group">
                    <label class="form-label" for="post-title">Title</label>
                    <input class="form-input" id="post-title" type="text" required />
                </div>
                <div class="form-group">
                    <label class="form-label" for="post-content">Content</label>
                    <textarea class="form-input" id="post-content" rows="8" required></textarea>
                </div>
                <button class="btn btn-primary" type="submit">Update Post</button>
            </form>
        </div>
    `;

    const form = document.getElementById('edit-post-form');
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');
    const errorDiv = document.getElementById('edit-post-error');
    const loadingDiv = document.getElementById('edit-post-loading');

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
    }

    function clearError() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    titleInput.addEventListener('input', clearError);
    contentInput.addEventListener('input', clearError);

    // Fetch current post data and pre-populate form
    (async () => {
        const { data, error } = await get('/posts/' + id);

        if (error) {
            loadingDiv.style.display = 'none';
            showError(error);
            return;
        }

        loadingDiv.style.display = 'none';
        form.style.display = '';
        titleInput.value = data.title;
        contentInput.value = data.content;
    })();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            showError('Title and content are required');
            return;
        }

        const { data, error } = await patch('/posts/' + id, { title, content });

        if (error) {
            showError(error);
            return;
        }

        navigate('/posts/' + id);
    });
}
