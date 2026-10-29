import { StudyVaultAPI } from './api.js';
import { openResourceModal, handleDownload, showToast, escapeHtml } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  loadRecentResources();
});

async function loadRecentResources() {
  const grid = document.getElementById('homeRecentGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.875rem;">
      Loading recent documents...
    </div>
  `;

  try {
    const [resResult, bookmarksResult] = await Promise.all([
      StudyVaultAPI.getResources({ sort: 'latest' }),
      StudyVaultAPI.getBookmarks()
    ]);

    const resources = resResult.data.slice(0, 6);
    const bookmarks = new Set(bookmarksResult.data);

    if (resources.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p class="empty-title">No resources yet</p>
          <p class="empty-text">Be the first to share your course notes with classmates.</p>
          <a href="upload.html" class="btn btn-primary btn-sm">Upload Notes</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = resources.map(item => {
      const isSaved = bookmarks.has(item._id);
      return `
        <article class="resource-card" data-id="${item._id}">
          <div class="card-top">
            <span class="card-format">${escapeHtml(item.fileFormat)}</span>
            <button class="card-bookmark-btn ${isSaved ? 'bookmarked' : ''}" data-bookmark-id="${item._id}" aria-label="Save resource">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
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
            <button class="btn btn-ghost btn-sm preview-btn" data-preview-id="${item._id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Details</span>
            </button>
            <button class="btn btn-secondary btn-sm download-btn" data-download-id="${item._id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download</span>
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Wire up events
    grid.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openResourceModal(btn.dataset.previewId);
      });
    });

    grid.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const item = resources.find(r => r._id === btn.dataset.downloadId);
        if (item) handleDownload(item);
      });
    });

    grid.querySelectorAll('.card-bookmark-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.bookmarkId;
        const res = await StudyVaultAPI.toggleBookmark(id);
        const svg = btn.querySelector('svg');
        if (res.isBookmarked) {
          btn.classList.add('bookmarked');
          svg.setAttribute('fill', 'currentColor');
          showToast('Added to your Vault');
        } else {
          btn.classList.remove('bookmarked');
          svg.setAttribute('fill', 'none');
          showToast('Removed from your Vault');
        }
      });
    });

  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">
        Failed to load resources.
      </div>
    `;
  }
}

// Listen to global bookmark changes
window.addEventListener('vault:bookmarkChanged', () => {
  loadRecentResources();
});
