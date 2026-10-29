import { StudyVaultAPI } from './api.js';
import { openResourceModal, handleDownload, showToast, escapeHtml } from './main.js';

let currentFilters = {
  search: '',
  courseCode: 'ALL',
  department: 'ALL',
  fileFormat: 'ALL',
  sort: 'latest'
};

document.addEventListener('DOMContentLoaded', () => {
  parseUrlParams();
  setupFilterControls();
  fetchAndRender();
});

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('q')) currentFilters.search = params.get('q');
  if (params.has('dept')) currentFilters.department = params.get('dept');
  if (params.has('course')) currentFilters.courseCode = params.get('course');
  if (params.has('format')) currentFilters.fileFormat = params.get('format').toUpperCase();

  // Sync to UI controls
  const searchInput = document.getElementById('filterSearch');
  if (searchInput && currentFilters.search) searchInput.value = currentFilters.search;

  const deptSelect = document.getElementById('filterDepartment');
  if (deptSelect && currentFilters.department !== 'ALL') deptSelect.value = currentFilters.department;

  const courseSelect = document.getElementById('filterCourseCode');
  if (courseSelect && currentFilters.courseCode !== 'ALL') courseSelect.value = currentFilters.courseCode;

  syncFormatButtons();
}

function syncFormatButtons() {
  const buttons = document.querySelectorAll('#formatSegmentedControl .segment-btn');
  buttons.forEach(btn => {
    if (btn.dataset.format === currentFilters.fileFormat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function setupFilterControls() {
  const searchInput = document.getElementById('filterSearch');
  const courseSelect = document.getElementById('filterCourseCode');
  const deptSelect = document.getElementById('filterDepartment');
  const resetBtn = document.getElementById('resetFiltersBtn');
  const formatButtons = document.querySelectorAll('#formatSegmentedControl .segment-btn');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        fetchAndRender();
      }, 250);
    });
  }

  if (courseSelect) {
    courseSelect.addEventListener('change', (e) => {
      currentFilters.courseCode = e.target.value;
      fetchAndRender();
    });
  }

  if (deptSelect) {
    deptSelect.addEventListener('change', (e) => {
      currentFilters.department = e.target.value;
      fetchAndRender();
    });
  }

  formatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilters.fileFormat = btn.dataset.format;
      syncFormatButtons();
      fetchAndRender();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilters = {
        search: '',
        courseCode: 'ALL',
        department: 'ALL',
        fileFormat: 'ALL',
        sort: 'latest'
      };
      if (searchInput) searchInput.value = '';
      if (courseSelect) courseSelect.value = 'ALL';
      if (deptSelect) deptSelect.value = 'ALL';
      syncFormatButtons();
      fetchAndRender();
      showToast('Filters cleared');
    });
  }
}

async function fetchAndRender() {
  const grid = document.getElementById('resourcesGrid');
  const counter = document.getElementById('resultsCounter');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.875rem;">
      Searching academic repository...
    </div>
  `;

  try {
    const [resResult, bookmarksResult] = await Promise.all([
      StudyVaultAPI.getResources(currentFilters),
      StudyVaultAPI.getBookmarks()
    ]);

    const resources = resResult.data;
    const bookmarks = new Set(bookmarksResult.data);

    if (counter) {
      counter.textContent = `${resources.length} document${resources.length === 1 ? '' : 's'} found`;
    }

    if (resources.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
          <h3 class="empty-title">No matching study materials</h3>
          <p class="empty-text">Try adjusting your Course Code, Department, or search keywords.</p>
          <a href="upload.html" class="btn btn-secondary btn-sm">Upload this material</a>
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
            <span class="card-meta-item">Sem ${escapeHtml(item.semester)}</span>
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

    // Attach click listeners
    grid.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openResourceModal(btn.dataset.previewId);
      });
    });

    grid.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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
          showToast('Saved to personal vault');
        } else {
          btn.classList.remove('bookmarked');
          svg.setAttribute('fill', 'none');
          showToast('Removed from personal vault');
        }
      });
    });

  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
        An error occurred while loading resources.
      </div>
    `;
  }
}

window.addEventListener('vault:bookmarkChanged', () => {
  fetchAndRender();
});
