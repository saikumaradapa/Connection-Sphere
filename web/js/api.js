// API Client - centralized HTTP client module
import { getToken, removeToken } from './auth.js';

const baseURL = '/v1';

async function request(method, path, body) {
    const url = baseURL + path;
    const options = {
        method,
        headers: {},
    };

    const token = getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(url, options);
    } catch {
        return { error: 'Connection failed. Please try again.' };
    }

    if (response.status === 401) {
        removeToken();
        window.location.hash = '#/login';
        return { error: 'Unauthorized' };
    }

    if (response.status === 204) {
        return { data: null };
    }

    let json;
    try {
        json = await response.json();
    } catch {
        if (response.ok) {
            return { data: null };
        }
        return { error: 'An unexpected error occurred.' };
    }

    if (json.error) {
        return { error: json.error };
    }

    return { data: json.data };
}

export function get(path) {
    return request('GET', path);
}

export function post(path, body) {
    return request('POST', path, body);
}

export function put(path, body) {
    return request('PUT', path, body);
}

export function patch(path, body) {
    return request('PATCH', path, body);
}

export function del(path) {
    return request('DELETE', path);
}
