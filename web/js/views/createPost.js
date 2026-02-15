// Create Post View
import { post } from '../api.js';
import { navigate } from '../router.js';

export function render(container) {
    container.innerHTML = `
        <div class="auth-form">
            <h2>Create Post</h2>
            <div class="form-error" id="create-post-error" style="display:none;"></div>
            <form id="create-post-form">
                <div class="form-group">
                    <label class="form-label" for="post-title">Title</label>
                    <input class="form-input" id="post-title" type="text" required />
                </div>
                <div class="form-group">
                    <label class="form-label" for="post-content">Content</label>
                    <textarea class="form-input" id="post-content" rows="8" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="post-tags">Tags (comma-separated)</label>
                    <input class="form-input" id="post-tags" type="text" placeholder="e.g. go, web, api" />
                </div>
                <button class="btn btn-primary" type="submit">Create Post</button>
            </form>
        </div>
    `;

    const form = document.getElementById('create-post-form');
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');
    const tagsInput = document.getElementById('post-tags');
    const errorDiv = document.getElementById('create-post-error');

    function clearError() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
    }

    titleInput.addEventListener('input', clearError);
    contentInput.addEventListener('input', clearError);
    tagsInput.addEventListener('input', clearError);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            showError('Title and content are required');
            return;
        }

        const tags = tagsInput.value
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        const { data, error } = await post('/posts', { title, content, tags });

        if (error) {
            showError(error);
            return;
        }

        navigate('/posts/' + data.id);
    });
}
