// Feed View
import { get } from '../api.js';
import { showToast } from '../components/toast.js';

const LIMIT = 20;
const DEBOUNCE_MS = 300;

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(text, max = 150) {
    if (!text || text.length <= max) return text || '';
    return text.slice(0, max) + '...';
}

function renderPostCard(post) {
    const card = document.createElement('a');
    card.className = 'post-card';
    card.href = `#/posts/${post.id}`;

    const title = document.createElement('h3');
    title.className = 'post-card-title';
    title.textContent = post.title;

    const content = document.createElement('p');
    content.className = 'post-card-content';
    content.textContent = truncate(post.content);

    const meta = document.createElement('div');
    meta.className = 'post-card-meta';
    const authorLink = document.createElement('a');
    authorLink.href = `#/users/${post.user_id}`;
    authorLink.textContent = post.user?.username || 'Unknown';
    authorLink.addEventListener('click', (e) => e.stopPropagation());
    meta.appendChild(authorLink);
    meta.appendChild(document.createTextNode(` · ${formatDate(post.created_at)} · ${post.comments_count ?? 0} comments`));

    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'post-card-tags';
    if (post.tags && post.tags.length) {
        post.tags.forEach(t => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = t;
            tagsDiv.appendChild(span);
        });
    }

    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(meta);
    card.appendChild(tagsDiv);
    return card;
}

export function render(container) {
    let offset = 0;
    let searchTerm = '';
    let debounceTimer = null;

    container.innerHTML = `
        <div class="feed-page">
            <h2>Your Feed</h2>
            <input class="feed-search" type="text" placeholder="Search posts..." />
            <div class="feed-grid"></div>
            <div class="pagination"></div>
        </div>
    `;

    const searchInput = container.querySelector('.feed-search');
    const grid = container.querySelector('.feed-grid');
    const pagination = container.querySelector('.pagination');

    async function loadFeed() {
        grid.innerHTML = '<p>Loading...</p>';
        pagination.innerHTML = '';

        let path = `/users/feed?limit=${LIMIT}&offset=${offset}&sort=desc`;
        if (searchTerm) {
            path += `&search=${encodeURIComponent(searchTerm)}`;
        }

        const { data, error } = await get(path);

        if (error) {
            grid.innerHTML = '';
            showToast(error, 'error');
            return;
        }

        const posts = Array.isArray(data) ? data : [];
        grid.innerHTML = '';

        if (posts.length === 0) {
            grid.innerHTML = '<p class="empty-state">No posts yet. Follow some users to see their posts here.</p>';
            return;
        }

        posts.forEach(post => grid.appendChild(renderPostCard(post)));

        // Pagination controls
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = offset === 0;
        prevBtn.addEventListener('click', () => {
            offset = Math.max(0, offset - LIMIT);
            loadFeed();
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = posts.length < LIMIT;
        nextBtn.addEventListener('click', () => {
            offset += LIMIT;
            loadFeed();
        });

        pagination.innerHTML = '';
        pagination.appendChild(prevBtn);
        pagination.appendChild(nextBtn);
    }

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchTerm = searchInput.value.trim();
            offset = 0;
            loadFeed();
        }, DEBOUNCE_MS);
    });

    loadFeed();
}
