import { StudyVaultAPI } from './api.js';
import { showToast } from './main.js';

let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
  setupDropzone();
  setupFormSubmit();
});

function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('filePreview');
  const fileName = document.getElementById('previewFileName');
  const fileSize = document.getElementById('previewFileSize');
  const removeBtn = document.getElementById('removeFileBtn');
  const formatSelect = document.getElementById('docFormat');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      preview.classList.remove('active');
      dropzone.style.display = 'block';
    });
  }

  function handleFileSelected(file) {
    selectedFile = file;
    dropzone.style.display = 'none';
    preview.classList.add('active');

    fileName.textContent = file.name;
    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    fileSize.textContent = formattedSize;

    // Detect format
    const ext = file.name.split('.').pop().toUpperCase();
    if (['PDF', 'DOCX', 'PPTX', 'ZIP'].includes(ext)) {
      formatSelect.value = ext;
    }
  }
}

function setupFormSubmit() {
  const form = document.getElementById('uploadForm');
  const submitBtn = document.getElementById('submitUploadBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('docTitle').value.trim();
    const courseCode = document.getElementById('docCourseCode').value.trim();
    const department = document.getElementById('docDepartment').value;
    const semester = document.getElementById('docSemester').value;
    const fileFormat = document.getElementById('docFormat').value;
    const description = document.getElementById('docDescription').value.trim();

    if (!title || !courseCode || !department || !description) {
      showToast('Please fill in all required fields');
      return;
    }

    // Set button loading
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Uploading...</span>`;

    try {
      const calculatedSize = selectedFile
        ? (selectedFile.size > 1024 * 1024 ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(selectedFile.size / 1024)} KB`)
        : '3.8 MB';

      const res = await StudyVaultAPI.uploadResource({
        title,
        courseCode,
        department,
        semester,
        fileFormat,
        fileSize: calculatedSize,
        description
      }, selectedFile);

      showToast('Document published to StudyVault!');
      setTimeout(() => {
        window.location.href = 'resources.html';
      }, 700);
    } catch (err) {
      showToast('Failed to upload document');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}
