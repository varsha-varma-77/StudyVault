import { StudyVaultAPI } from './api.js';

/**
 * Global StudyVault Application Controller
 */

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupUserStatus();
  setupToastContainer();
  setupGlobalModal();
});

function setupNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const isHome = (currentPath === '/' || currentPath.endsWith('index.html')) && (href === '/' || href === 'index.html');
    const isExact = currentPath.includes(href) && href !== '/' && href !== 'index.html';

    if (isHome || isExact) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobilePanel = document.getElementById('mobileNavPanel');

  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', () => {
      mobilePanel.classList.toggle('open');
    });
  }
}

async function setupUserStatus() {
  const authContainer = document.getElementById('headerAuthAction');
  const result = await StudyVaultAPI.getCurrentUser();
  const user = result.data;

  // Update mobile drawer links
  const mobileNavLinks = document.querySelector('.mobile-nav-links');
  if (mobileNavLinks) {
    const authLink = mobileNavLinks.querySelector('a[href="auth.html"]');
    if (user) {
      if (authLink) {
        authLink.textContent = 'Log Out';
        authLink.href = '#';
        authLink.id = 'mobileLogoutLink';
        authLink.onclick = async (e) => {
          e.preventDefault();
          await performLogout();
        };
      }
    } else {
      if (authLink) {
        authLink.textContent = 'Sign In / Register';
        authLink.href = 'auth.html';
      }
    }
  }

  if (!authContainer) return;

  if (user) {
    authContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <a href="profile.html" class="btn btn-secondary btn-sm" title="View Student Profile">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>${escapeHtml(user.name.split(' ')[0])}</span>
        </a>
        <button id="headerLogoutBtn" class="btn btn-ghost btn-sm" title="Log Out" style="color: var(--text-muted); font-size: 0.8125rem; padding: 0.375rem 0.6rem;">
          Log Out
        </button>
      </div>
    `;

    const logoutBtn = document.getElementById('headerLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', performLogout);
    }
  } else {
    authContainer.innerHTML = `
      <a href="auth.html" class="btn btn-secondary btn-sm">Sign In</a>
    `;
  }
}

export async function performLogout() {
  await StudyVaultAPI.logout();
  showToast('Logged out of StudyVault');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 400);
}

function setupToastContainer() {
  if (!document.getElementById('toastContainer')) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

export function showToast(message, duration = 3000) {
  const container = document.getElementById('toastContainer') || document.body;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// Global Resource Preview Modal
function setupGlobalModal() {
  let modal = document.getElementById('resourceModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'resourceModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div style="padding-right: 1rem;">
            <div id="modalFormat" class="card-format" style="margin-bottom: 0.5rem;">PDF</div>
            <h3 id="modalTitle" class="modal-title font-heading">Resource Title</h3>
          </div>
          <button id="modalCloseBtn" class="modal-close-btn" aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="modal-meta-grid">
            <div>
              <div class="meta-field-label">Course Code</div>
              <div id="modalCourse" class="meta-field-val">CS101</div>
            </div>
            <div>
              <div class="meta-field-label">Department</div>
              <div id="modalDept" class="meta-field-val">Computer Science</div>
            </div>
            <div>
              <div class="meta-field-label">Semester</div>
              <div id="modalSemester" class="meta-field-val">Semester 3</div>
            </div>
            <div>
              <div class="meta-field-label">File Size</div>
              <div id="modalSize" class="meta-field-val">4.5 MB</div>
            </div>
          </div>
          <div>
            <div class="modal-desc-title">Overview</div>
            <p id="modalDesc" class="modal-desc"></p>
          </div>
          <div style="font-size: 0.8125rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
            <span>Contributed by <strong id="modalUploader" style="color: var(--text-secondary);">Student</strong></span>
            <span>·</span>
            <span id="modalDate">Oct 2026</span>
          </div>
        </div>
        <div class="modal-footer">
          <button id="modalBookmarkBtn" class="btn btn-secondary btn-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span id="modalBookmarkLabel">Save to Vault</span>
          </button>
          <button id="modalDownloadBtn" class="btn btn-primary btn-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('modalCloseBtn');
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }
}

let activeModalResourceId = null;

export async function openResourceModal(resourceId) {
  try {
    const res = await StudyVaultAPI.getResourceById(resourceId);
    const item = res.data;
    activeModalResourceId = item._id;

    const modal = document.getElementById('resourceModal');
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalFormat').textContent = item.fileFormat;
    document.getElementById('modalCourse').textContent = item.courseCode;
    document.getElementById('modalDept').textContent = item.department;
    document.getElementById('modalSemester').textContent = `Semester ${item.semester}`;
    document.getElementById('modalSize').textContent = item.fileSize;
    document.getElementById('modalDesc').textContent = item.description;
    document.getElementById('modalUploader').textContent = item.uploader ? item.uploader.name : 'Student';
    document.getElementById('modalDate').textContent = item.uploadDate;

    // Check bookmark state
    const bookmarksRes = await StudyVaultAPI.getBookmarks();
    const isSaved = bookmarksRes.data.includes(item._id);
    updateModalBookmarkBtn(isSaved);

    // Setup action listeners
    const bookmarkBtn = document.getElementById('modalBookmarkBtn');
    bookmarkBtn.onclick = async () => {
      const toggleRes = await StudyVaultAPI.toggleBookmark(item._id);
      updateModalBookmarkBtn(toggleRes.isBookmarked);
      showToast(toggleRes.isBookmarked ? 'Saved to your personal vault' : 'Removed from vault');
      // Trigger event for listening components (e.g., resources list or profile)
      window.dispatchEvent(new CustomEvent('vault:bookmarkChanged', { detail: { id: item._id, isBookmarked: toggleRes.isBookmarked } }));
    };

    const downloadBtn = document.getElementById('modalDownloadBtn');
    downloadBtn.onclick = () => {
      handleDownload(item);
    };

    modal.classList.add('open');
  } catch (err) {
    showToast('Unable to load resource details');
  }
}

function updateModalBookmarkBtn(isSaved) {
  const bookmarkBtn = document.getElementById('modalBookmarkBtn');
  const label = document.getElementById('modalBookmarkLabel');
  if (isSaved) {
    label.textContent = 'Saved in Vault';
    bookmarkBtn.classList.add('bookmarked');
    bookmarkBtn.style.color = 'var(--color-primary)';
    bookmarkBtn.style.borderColor = 'var(--color-primary-border)';
  } else {
    label.textContent = 'Save to Vault';
    bookmarkBtn.classList.remove('bookmarked');
    bookmarkBtn.style.color = '';
    bookmarkBtn.style.borderColor = '';
  }
}

export function closeModal() {
  const modal = document.getElementById('resourceModal');
  if (modal) modal.classList.remove('open');
  activeModalResourceId = null;
}

export function handleDownload(resource) {
  showToast(`Downloading ${resource.title} (${resource.fileFormat})...`);

  // Fire-and-forget download count increment
  StudyVaultAPI.incrementDownload(resource._id).catch(() => {});

  // If there's a real server file, download it directly
  if (resource.downloadUrl && resource.downloadUrl !== '#') {
    const a = document.createElement('a');
    a.href = resource.downloadUrl;
    a.download = resource.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Fallback: generate a placeholder text file
  const sampleContent = `StudyVault Academic Resource\nTitle: ${resource.title}\nCourse: ${resource.courseCode}\nDepartment: ${resource.department}\nUploaded by: ${resource.uploader?.name || 'Student'}\nDate: ${resource.uploadDate}\n\nDescription:\n${resource.description}\n\n---\nDownloaded from StudyVault.`;
  const blob = new Blob([sampleContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${resource.courseCode}_${resource.title.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
