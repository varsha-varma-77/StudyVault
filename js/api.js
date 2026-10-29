/**
 * StudyVault REST API Client
 *
 * Talks to the Express + MongoDB backend via /api/* (proxied by Vite in dev).
 * JWT token is stored in localStorage under 'studyvault_token'.
 */

const API_BASE = '/api';

// ─── Auth Helpers ──────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('studyvault_token');
}

function setSession(token, user) {
  localStorage.setItem('studyvault_token', token);
  localStorage.setItem('studyvault_current_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('studyvault_token');
  localStorage.removeItem('studyvault_current_user');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const StudyVaultAPI = {

  /**
   * GET /api/resources?q=&courseCode=&department=&format=&sort=
   */
  async getResources(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search)     params.append('q', filters.search);
    if (filters.courseCode) params.append('courseCode', filters.courseCode);
    if (filters.department) params.append('department', filters.department);
    if (filters.fileFormat) params.append('format', filters.fileFormat);
    if (filters.sort)       params.append('sort', filters.sort);

    const res = await fetch(`${API_BASE}/resources?${params}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * GET /api/resources/:id
   */
  async getResourceById(id) {
    const res = await fetch(`${API_BASE}/resources/${id}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * POST /api/resources  (multipart — includes real file if provided)
   */
  async uploadResource(resourceData, file = null) {
    const formData = new FormData();
    formData.append('title', resourceData.title);
    formData.append('courseCode', resourceData.courseCode);
    formData.append('department', resourceData.department);
    formData.append('semester', resourceData.semester || 1);
    formData.append('fileFormat', resourceData.fileFormat || 'PDF');
    formData.append('description', resourceData.description || '');
    if (resourceData.fileSize) formData.append('fileSize', resourceData.fileSize);
    if (file) formData.append('file', file);

    const res = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: authHeaders(), // no Content-Type — browser sets multipart boundary
      body: formData,
    });
    return handleResponse(res);
  },

  /**
   * DELETE /api/resources/:id
   */
  async deleteResource(id) {
    const res = await fetch(`${API_BASE}/resources/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * POST /api/resources/:id/download — increment counter
   */
  async incrementDownload(id) {
    await fetch(`${API_BASE}/resources/${id}/download`, {
      method: 'POST',
    }).catch(() => {}); // fire-and-forget
  },

  /**
   * GET /api/bookmarks
   */
  async getBookmarks() {
    const token = getToken();
    if (!token) return { success: true, data: [] };
    const res = await fetch(`${API_BASE}/bookmarks`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * POST /api/bookmarks/:resourceId — toggle
   */
  async toggleBookmark(resourceId) {
    const res = await fetch(`${API_BASE}/bookmarks/${resourceId}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * GET /api/resources/user/uploads
   */
  async getUserUploads() {
    const token = getToken();
    if (!token) return { success: true, data: [] };
    const res = await fetch(`${API_BASE}/resources/user/uploads`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * GET /api/auth/me — verify token and return current user
   */
  async getCurrentUser() {
    const token = getToken();
    if (!token) return { success: true, data: null };

    // Try cached user first
    const cached = localStorage.getItem('studyvault_current_user');
    if (cached) {
      try {
        return { success: true, data: JSON.parse(cached) };
      } catch (_) {}
    }

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: authHeaders(),
      });
      const result = await handleResponse(res);
      if (result.data) {
        localStorage.setItem('studyvault_current_user', JSON.stringify(result.data));
      }
      return result;
    } catch (err) {
      // Token expired / invalid
      clearSession();
      return { success: true, data: null };
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await handleResponse(res);
    if (result.token) setSession(result.token, result.data);
    return result;
  },

  /**
   * POST /api/auth/signup
   */
  async signup(userData) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const result = await handleResponse(res);
    if (result.token) setSession(result.token, result.data);
    return result;
  },

  /**
   * Logout — clear local session
   */
  async logout() {
    clearSession();
    return { success: true };
  },
};
