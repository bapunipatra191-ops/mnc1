// ==========================================================================
// Authentication Page Controller (Login / Signup Toggle & Submission)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    // If user is already authenticated, direct them straight to dashboard
    window.location.href = 'dashboard.html';
    return;
  }

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  if (tabLogin && tabRegister && formLogin && formRegister) {
    // Toggle active form view
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'flex';
      formRegister.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.style.display = 'flex';
      formLogin.style.display = 'none';
    });

    // Handle Login Form Submit
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        showToast('Please fill out all fields.', 'error');
        return;
      }

      try {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (res.success) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          showToast('Login successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        } else {
          showToast(res.message || 'Invalid login details.', 'error');
        }
      } catch (err) {
        showToast('Connection to server failed. Please try again later.', 'error');
      }
    });

    // Handle Register Form Submit
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;

      if (!username || !email || !password || !confirmPassword) {
        showToast('Please fill out all fields.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      try {
        const res = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, email, password })
        });

        if (res.success) {
          showToast('Registration successful! Please log in.', 'success');
          // Switch automatically to login tab
          tabLogin.click();
          // Pre-fill email
          document.getElementById('login-email').value = email;
          formRegister.reset();
        } else {
          showToast(res.message || 'Registration failed.', 'error');
        }
      } catch (err) {
        showToast('Connection to server failed. Please try again later.', 'error');
      }
    });
  }
});
