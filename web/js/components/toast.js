// Toast Notification Component

/**
 * Shows a temporary toast notification.
 * @param {string} message - The message to display
 * @param {"success"|"error"} type - The toast type
 */
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
    toast.textContent = message;

    // Stack below existing toasts
    const existing = document.querySelectorAll('.toast');
    const offset = existing.length * 60;
    toast.style.top = `${20 + offset}px`;

    document.body.appendChild(toast);

    // Trigger slide-in animation on next frame
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        // Fallback removal if transitionend doesn't fire
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 500);
    }, 3000);
}
