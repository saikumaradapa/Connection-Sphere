// Not Found View
export function render(container) {
    container.innerHTML = `
        <div class="not-found-page">
            <h1>404</h1>
            <p>Page not found</p>
            <a href="#/feed">Go back to feed</a>
        </div>
    `;
}
