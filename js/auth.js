import { StudyVaultAPI } from './api.js';
import { showToast } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  setupAuthTabs();
  setupLoginForm();
  setupSignupForm();
});

function setupAuthTabs() {
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');

  if (!tabLogin || !tabSignup) return;

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
    authTitle.textContent = 'Sign In';
    authSubtitle.textContent = 'Access your personal vault and course notes.';
  });

  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    loginForm.style.display = 'none';
    signupForm.style.display = 'flex';
    authTitle.textContent = 'Register';
    authSubtitle.textContent = 'Join StudyVault to access and share resources.';
  });
}

function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('loginSubmitBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
      showToast('Please enter both email and password');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      await StudyVaultAPI.login(email, password);
      showToast('Welcome back to StudyVault!');
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 600);
    } catch (err) {
      showToast(err.message || 'Login failed');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In to StudyVault';
    }
  });
}

function setupSignupForm() {
  const form = document.getElementById('signupForm');
  const submitBtn = document.getElementById('signupSubmitBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const college = document.getElementById('signupCollege').value.trim();
    const department = document.getElementById('signupDept').value;
    const password = document.getElementById('signupPassword').value.trim();

    if (!name || !email || !college || !password) {
      showToast('Please fill in all registration fields');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      await StudyVaultAPI.signup({
        name,
        email,
        college,
        department,
        password
      });
      showToast('Account registered successfully!');
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 600);
    } catch (err) {
      showToast('Registration failed');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Student Account';
    }
  });
}
