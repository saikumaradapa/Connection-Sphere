// Navigation Bar Component
import { isAuthenticated, removeToken } from '../auth.js';
import { navigate } from '../router.js';

/**
 * Render the navigation bar into the given container.
 * Shows different links based on authentication state.
 * @param {HTMLElement} container
 */
export function renderNavbar(container) {
    const authenticated = isAuthenticated();

    const nav = document.createElement('nav');
    nav.className = 'navbar';

    const inner = document.createElement('div');
    inner.className = 'navbar-inner container';

    // Brand
    const brand = document.createElement('a');
    brand.className = 'navbar-brand';
    brand.href = authenticated ? '#/feed' : '#/login';
    brand.textContent = 'Connection Sphere';

    // Hamburger toggle for mobile
    const toggle = document.createElement('button');
    toggle.className = 'navbar-toggle';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('navbar-links--open');
    });

    // Nav links container
    const navLinks = document.createElement('div');
    navLinks.className = 'navbar-links';

    if (authenticated) {
        navLinks.appendChild(createLink('Feed', '#/feed'));
        navLinks.appendChild(createLink('New Post', '#/posts/new'));

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'navbar-logout';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', () => {
            removeToken();
            navigate('/login');
        });
        navLinks.appendChild(logoutBtn);
    } else {
        navLinks.appendChild(createLink('Login', '#/login'));
        navLinks.appendChild(createLink('Register', '#/register'));
    }

    inner.appendChild(brand);
    inner.appendChild(toggle);
    inner.appendChild(navLinks);
    nav.appendChild(inner);

    container.innerHTML = '';
    container.appendChild(nav);
}

/**
 * Create a nav link element.
 * @param {string} text
 * @param {string} href
 * @returns {HTMLAnchorElement}
 */
function createLink(text, href) {
    const a = document.createElement('a');
    a.className = 'navbar-link';
    a.href = href;
    a.textContent = text;
    return a;
}
