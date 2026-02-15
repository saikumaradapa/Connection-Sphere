// Entry point - initializes router & navbar
import { addRoute, setContainer, setNotFoundView, onRouteChange, init, navigate } from './router.js';
import { isAuthenticated } from './auth.js';
import { renderNavbar } from './components/navbar.js';

import { render as renderLogin } from './views/login.js';
import { render as renderRegister } from './views/register.js';
import { render as renderFeed } from './views/feed.js';
import { render as renderCreatePost } from './views/createPost.js';
import { render as renderPost } from './views/post.js';
import { render as renderEditPost } from './views/editPost.js';
import { render as renderProfile } from './views/profile.js';
import { render as renderActivate } from './views/activate.js';
import { render as renderNotFound } from './views/notFound.js';

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    const navbarContainer = document.getElementById('navbar');

    // Register routes — static routes before dynamic ones
    addRoute('/login', renderLogin, false);
    addRoute('/register', renderRegister, false);
    addRoute('/feed', renderFeed, true);
    addRoute('/posts/new', renderCreatePost, true);
    addRoute('/posts/:id', renderPost, true);
    addRoute('/posts/:id/edit', renderEditPost, true);
    addRoute('/users/:id', renderProfile, true);
    addRoute('/confirm/:token', renderActivate, false);

    // Set the app container and not-found view
    setContainer(appContainer);
    setNotFoundView(renderNotFound);

    // Re-render navbar on every route change
    onRouteChange(() => {
        renderNavbar(navbarContainer);
    });

    // Default redirect when hash is empty
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        window.location.hash = '#' + (isAuthenticated() ? '/feed' : '/login');
    }

    // Initialize the router
    init();
});
