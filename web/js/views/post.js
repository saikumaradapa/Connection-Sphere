// Post Detail View
import { get, del } from '../api.js';
import { getUserFromToken } from '../auth.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderComment(comment) {
    const div = document.createElement('div');
    div.className = 'comment';

    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    const authorLink = document.createElement('a');
    authorLink.href = `#/users/${comment.user_id}`;
    authorLink.textContent = comment.user?.username || 'Unknown';
    meta.appendChild(authorLink);
    meta.appendChild(document.createTextNode(` · ${formatDate(comment.created_at)}`));

    const content = document.createElement('div');
    content.className = 'comment-content';
    content.textContent = comment.content;

    div.appendChild(meta);
    div.appendChild(content);
    return div;
}

export async function render(container, params) {
    const id = params.id;

    container.innerHTML = '<div class="post-detail"><p>Loading...</p></div>';

    const { data, error } = await get('/posts/' + id);

    if (error) {
        container.innerHTML = '<div class="post-detail"><p>Post not found</p></div>';
        return;
    }

    const post = data;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'post-detail';

    // Title
    const title = document.createElement('h1');
    title.className = 'post-title';
    title.textContent = post.title;

    // Meta: author, date, version
    const meta = document.createElement('div');
    meta.className = 'post-meta';
    const authorLink = document.createElement('a');
    authorLink.href = `#/users/${post.user_id}`;
    authorLink.textContent = post.user?.username || 'Unknown';
    meta.appendChild(document.createTextNode('By '));
    meta.appendChild(authorLink);
    meta.appendChild(document.createTextNode(` · ${formatDate(post.created_at)} · v${post.version}`));

    // Tags
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'post-tags';
    if (post.tags && post.tags.length) {
        post.tags.forEach(t => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = t;
            tagsDiv.appendChild(span);
        });
    }

    // Content
    const content = document.createElement('div');
    content.className = 'post-content';
    content.textContent = post.content;

    // Actions (edit/delete) for post owner
    const user = getUserFromToken();
    const isOwner = user && user.sub === post.user_id;

    wrapper.appendChild(title);
    wrapper.appendChild(meta);
    wrapper.appendChild(tagsDiv);
    wrapper.appendChild(content);

    if (isOwner) {
        const actions = document.createElement('div');
        actions.className = 'post-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => navigate(`/posts/${post.id}/edit`));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this post?')) return;
            const { error: delError } = await del('/posts/' + post.id);
            if (delError) {
                showToast(delError, 'error');
                return;
            }
            showToast('Post deleted', 'success');
            navigate('/feed');
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        wrapper.appendChild(actions);
    }

    // Comments section
    const commentsSection = document.createElement('div');
    commentsSection.className = 'comments-section';

    const commentsHeading = document.createElement('h3');
    const comments = post.comments || [];
    commentsHeading.textContent = `Comments (${comments.length})`;
    commentsSection.appendChild(commentsHeading);

    if (comments.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No comments yet.';
        commentsSection.appendChild(empty);
    } else {
        comments.forEach(c => commentsSection.appendChild(renderComment(c)));
    }

    wrapper.appendChild(commentsSection);
    container.appendChild(wrapper);
}
