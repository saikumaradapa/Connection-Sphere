// User Profile View
import { get, put } from '../api.js';
import { getUserFromToken } from '../auth.js';
import { showToast } from '../components/toast.js';

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function render(container, params) {
    const id = params.id;

    container.innerHTML = '<div class="profile-page"><p>Loading...</p></div>';

    const { data, error } = await get('/users/' + id);

    if (error) {
        container.innerHTML = '<div class="profile-page"><p>User not found</p></div>';
        return;
    }

    const user = data;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'profile-page';

    // Profile info section
    const info = document.createElement('div');
    info.className = 'profile-info';

    const heading = document.createElement('h1');
    heading.textContent = user.username;
    info.appendChild(heading);

    const fields = [
        { label: 'Email', value: user.email },
        { label: 'Role', value: user.role?.name || 'Unknown' },
        { label: 'Joined', value: formatDate(user.created_at) },
    ];

    fields.forEach(({ label, value }) => {
        const field = document.createElement('div');
        field.className = 'profile-field';
        const strong = document.createElement('strong');
        strong.textContent = label + ': ';
        field.appendChild(strong);
        field.appendChild(document.createTextNode(value));
        info.appendChild(field);
    });

    wrapper.appendChild(info);

    // Follow/Unfollow button (only for other users)
    const currentUser = getUserFromToken();
    const isOwnProfile = currentUser && currentUser.sub === Number(id);

    if (!isOwnProfile) {
        const actions = document.createElement('div');
        actions.className = 'profile-actions';

        let following = false;

        const followBtn = document.createElement('button');
        followBtn.className = 'btn';
        followBtn.textContent = 'Follow';

        followBtn.addEventListener('click', async () => {
            followBtn.disabled = true;
            if (following) {
                const { error: unfollowError } = await put('/users/' + id + '/unfollow');
                if (unfollowError) {
                    showToast(unfollowError, 'error');
                    followBtn.disabled = false;
                    return;
                }
                following = false;
                followBtn.textContent = 'Follow';
            } else {
                const { error: followError } = await put('/users/' + id + '/follow');
                if (followError) {
                    showToast(followError, 'error');
                    followBtn.disabled = false;
                    return;
                }
                following = true;
                followBtn.textContent = 'Unfollow';
            }
            followBtn.disabled = false;
        });

        actions.appendChild(followBtn);
        wrapper.appendChild(actions);
    }

    container.appendChild(wrapper);
}
