import { StudyVaultAPI } from './api.js';
import { openResourceModal, handleDownload, showToast, escapeHtml, performLogout } from './main.js';

let currentTab = 'saved'; // 'saved' | 'uploads'

document.addEventListener('DOMContentLoaded', () => {
  setupProfileData();
  setupTabs();
  setupDeleteModal();
  renderTabContent();

  const logoutBtn = document.getElementById('profileLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', performLogout);
  }
});

async function setupProfileData() {
  const userRes = await StudyVaultAPI.getCurrentUser();
  const user = userRes.data;

  const logoutBtn = document.getElementById('profileLogoutBtn');

  if (user) {
    const nameEl = document.getElementById('userName');
    const affilEl = document.getElementById('userAffiliation');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl) nameEl.textContent = user.name;
    if (affilEl) affilEl.textContent = `${user.college} · ${user.department}`;
    if (avatarEl) {
      const initials = user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      avatarEl.textContent = initials || 'SV';
    }
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  } else {
    const nameEl = document.getElementById('userName');
    const affilEl = document.getElementById('userAffiliation');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl) nameEl.textContent = 'Guest Student';
    if (affilEl) affilEl.textContent = 'Sign in to sync your vault';
    if (avatarEl) avatarEl.textContent = 'GS';
    if (logoutBtn) {
      logoutBtn.innerHTML = `<span>Sign In</span>`;
      logoutBtn.onclick = () => window.location.href = 'auth.html';
    }
  }

  // Update badge stats
  await updateStats();
}

async function updateStats() {
  const [uploadsRes, bookmarksRes] = await Promise.all([
    StudyVaultAPI.getUserUploads(),
    StudyVaultAPI.getBookmarks()
  ]);

  const uploadsCount = uploadsRes.data.length;
  const savedCount = bookmarksRes.data.length;

  const statUploads = document.getElementById('statUploadsCount');
  const statSaved = document.getElementById('statSavedCount');
  const tabSavedCount = document.getElementById('savedTabCount');
  const tabUploadsCount = document.getElementById('uploadsTabCount');

  if (statUploads) statUploads.textContent = uploadsCount;
  if (statSaved) statSaved.textContent = savedCount;
  if (tabSavedCount) tabSavedCount.textContent = savedCount;
  if (tabUploadsCount) tabUploadsCount.textContent = uploadsCount;
}

function setupTabs() {
  const tabSaved = document.getElementById('tabSaved');
  const tabUploads = document.getElementById('tabUploads');

  if (tabSaved && tabUploads) {
    tabSaved.addEventListener('click', () => {
      currentTab = 'saved';
      tabSaved.classList.add('active');
      tabUploads.classList.remove('active');
      renderTabContent();
    });

    tabUploads.addEventListener('click', () => {
      currentTab = 'uploads';
      tabUploads.classList.add('active');
      tabSaved.classList.remove('active');
      renderTabContent();
    });
  }
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
let _pendingDeleteId = null;
let _pendingDeleteCard = null;
let _pendingDeleteGrid = null;

function setupDeleteModal() {
  if (document.getElementById('deleteConfirmModal')) return;

  const modal = document.createElement('div');
  modal.id = 'deleteConfirmModal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
    opacity: 0; pointer-events: none;
    transition: opacity 0.2s ease;
  `;
  modal.innerHTML = `
    <div style="
      background: #fff; border-radius: 14px; padding: 2rem;
      width: 100%; max-width: 380px; margin: 1rem;
      box-shadow: 0 20px 48px rgba(15,23,42,0.18);
      transform: translateY(12px); transition: transform 0.2s ease;
    ">
      <div style="margin-bottom: 1.25rem;">
        <div style="
          width: 44px; height: 44px; border-radius: 50%;
          background: #fff5f5; border: 1px solid #fecaca;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1rem;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0392b" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path><path d="M14 11v6"></path>
            <path d="M9 6V4h6v2"></path>
          </svg>
        </div>
        <h3 style="font-size: 1rem; font-weight: 600; color: #0f172a; margin-bottom: 0.4rem;">Delete this upload?</h3>
        <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">
          This will permanently remove the file and cannot be undone.
        </p>
      </div>
      <div style="display: flex; gap: 0.625rem; justify-content: flex-end;">
        <button id="deleteCancelBtn" class="btn btn-secondary btn-sm">Cancel</button>
        <button id="deleteConfirmBtn" class="btn btn-danger btn-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          </svg>
          <span>Yes, delete</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const inner = modal.querySelector('div');

  function openModal() {
    modal.style.pointerEvents = 'all';
    modal.style.opacity = '1';
    inner.style.transform = 'translateY(0)';
  }
  function closeModal() {
    modal.style.opacity = '0';
    inner.style.transform = 'translateY(12px)';
    setTimeout(() => { modal.style.pointerEvents = 'none'; }, 200);
    _pendingDeleteId = null;
    _pendingDeleteCard = null;
    _pendingDeleteGrid = null;
    const btn = document.getElementById('deleteConfirmBtn');
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg><span>Yes, delete</span>'; }
  }

  // Expose open so delete buttons can call it
  window._openDeleteModal = (id, card, grid) => {
    _pendingDeleteId = id;
    _pendingDeleteCard = card;
    _pendingDeleteGrid = grid;
    openModal();
  };

  document.getElementById('deleteCancelBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
    if (!_pendingDeleteId) return;
    const confirmBtn = document.getElementById('deleteConfirmBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span>Deleting…</span>';

    try {
      await StudyVaultAPI.deleteResource(_pendingDeleteId);
      const card = _pendingDeleteCard;
      const grid = _pendingDeleteGrid;
      closeModal();
      // Animate card out
      card.style.transition = 'opacity 0.25s, transform 0.25s';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.96)';
      setTimeout(async () => {
        card.remove();
        showToast('Upload deleted successfully');
        await updateStats();
        if (!grid.querySelector('.resource-card')) renderTabContent();
      }, 250);
    } catch (err) {
      showToast('Failed to delete. Please try again.');
      closeModal();
    }
  });
}

async function renderTabContent() {
  const grid = document.getElementById('profileGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.875rem;">
      Loading materials...
    </div>
  `;

  if (currentTab === 'saved') {
    const [bookmarksRes, allResourcesRes] = await Promise.all([
      StudyVaultAPI.getBookmarks(),
      StudyVaultAPI.getResources()
    ]);

    const bookmarkIds = new Set(bookmarksRes.data);
    const savedItems = allResourcesRes.data.filter(r => bookmarkIds.has(r._id));

    if (savedItems.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 class="empty-title">Your saved vault is empty</h3>
          <p class="empty-text">Bookmark notes, PYQs, and summaries in the Resources catalog for fast revision.</p>
          <a href="resources.html" class="btn btn-primary btn-sm">Explore Resources</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = savedItems.map(item => `
      <article class="resource-card" data-id="${item._id}">
        <div class="card-top">
          <span class="card-format">${escapeHtml(item.fileFormat)}</span>
          <button class="btn btn-ghost btn-sm remove-bookmark-btn" data-id="${item._id}" title="Remove from vault" style="color: var(--text-muted); padding: 0.2rem 0.4rem; font-size: 0.75rem;">
            Remove
          </button>
        </div>
        <h3 class="card-title font-heading">${escapeHtml(item.title)}</h3>
        <p class="card-desc">${escapeHtml(item.description)}</p>

        <div class="card-meta">
          <span class="card-meta-item"><strong>${escapeHtml(item.courseCode)}</strong></span>
          <span class="meta-separator">·</span>
          <span class="card-meta-item">${escapeHtml(item.department)}</span>
          <span class="meta-separator">·</span>
          <span class="card-meta-item">${escapeHtml(item.fileSize)}</span>
        </div>

        <div class="card-actions">
          <button class="btn btn-ghost btn-sm preview-btn" data-id="${item._id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Details</span>
          </button>
          <button class="btn btn-secondary btn-sm download-btn" data-id="${item._id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download</span>
          </button>
        </div>
      </article>
    `).join('');

    // Attach listeners
    grid.querySelectorAll('.remove-bookmark-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await StudyVaultAPI.toggleBookmark(btn.dataset.id);
        showToast('Item removed from vault');
        await updateStats();
        renderTabContent();
      });
    });

    grid.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openResourceModal(btn.dataset.id);
      });
    });

    grid.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = savedItems.find(r => r._id === btn.dataset.id);
        if (item) handleDownload(item);
      });
    });

  } else {
    // 'uploads' tab
    const uploadsRes = await StudyVaultAPI.getUserUploads();
    const myUploads = uploadsRes.data;

    if (myUploads.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 class="empty-title">You haven't uploaded any documents yet</h3>
          <p class="empty-text">Help fellow college students by sharing your course notes and exam question papers.</p>
          <a href="upload.html" class="btn btn-primary btn-sm">Upload Material</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = myUploads.map(item => `
      <article class="resource-card" data-id="${item._id}">
        <div class="card-top">
          <span class="card-format">${escapeHtml(item.fileFormat)}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(item.uploadDate)}</span>
        </div>
        <h3 class="card-title font-heading">${escapeHtml(item.title)}</h3>
        <p class="card-desc">${escapeHtml(item.description)}</p>

        <div class="card-meta">
          <span class="card-meta-item"><strong>${escapeHtml(item.courseCode)}</strong></span>
          <span class="meta-separator">·</span>
          <span class="card-meta-item">${escapeHtml(item.department)}</span>
          <span class="meta-separator">·</span>
          <span class="card-meta-item">${escapeHtml(item.fileSize)}</span>
        </div>

        <div class="card-actions">
          <button class="btn btn-ghost btn-sm preview-btn" data-id="${item._id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Details</span>
          </button>
          <button class="btn btn-secondary btn-sm download-btn" data-id="${item._id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download</span>
          </button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${item._id}" title="Delete this upload">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4h6v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openResourceModal(btn.dataset.id);
      });
    });

    grid.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = myUploads.find(r => r._id === btn.dataset.id);
        if (item) handleDownload(item);
      });
    });

    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const card = btn.closest('.resource-card');
        window._openDeleteModal(id, card, grid);
      });
    });
  }
}
