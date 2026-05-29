// SmartFare Glassmorphic Login Component
import { SUPABASE_CONFIG } from '../config.js';

export function initLogin(containerId, onLoginSuccess) {
  const container = document.getElementById(containerId);
  if (!container) return;

  renderLogin();

  function renderLogin() {
    container.innerHTML = `
      <div class="login-overlay">
        <div class="login-card glass-card">
          <div class="login-logo-container">
            <span class="login-logo-icon">🔒</span>
            <h2 class="login-title">SmartFare</h2>
            <p class="login-subtitle">交通費精算管理システム</p>
          </div>

          <form id="login-form-element" onsubmit="return false;">
            <div id="login-error-box" class="login-error-message" style="display: none;"></div>

            <div class="form-group">
              <label for="login-username">ユーザーID</label>
              <input type="text" id="login-username" class="form-control login-input" placeholder="例: yrai" required autocomplete="username">
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label for="login-password">パスワード</label>
              <input type="password" id="login-password" class="form-control login-input" placeholder="••••••••" required autocomplete="current-password">
            </div>

            <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 24px; padding: 12px 20px; font-weight: 600;">
              ログイン
            </button>
          </form>

          <div style="margin-top: 24px; text-align: center;">
            <p style="font-size: 11px; color: var(--text-muted);">
              ※デモ用アカウント<br>
              一般: yrai / yrai123 &nbsp;|&nbsp; 管理者: admin / admin123
            </p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('login-form-element').addEventListener('submit', handleLoginSubmit);
  }

  async function handleLoginSubmit() {
    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');
    const errorBox = document.getElementById('login-error-box');
    const loginCard = document.querySelector('.login-card');

    if (!usernameInput || !passwordInput) return;

    // Reset styles
    errorBox.style.display = 'none';
    loginCard.classList.remove('login-shake', 'login-failed');

    // UI Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = '認証中...';

    try {
      const email = `${usernameInput.trim().toLowerCase()}@smartfare.local`;
      
      const response = await fetch(`${SUPABASE_CONFIG.URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.ANON_KEY
        },
        body: JSON.stringify({
          email: email,
          password: passwordInput
        })
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        const meta = data.user.user_metadata || {};
        onLoginSuccess(data.access_token, {
          id: data.user.id,
          username: usernameInput.trim().toLowerCase(),
          name: meta.name || usernameInput,
          role: meta.role || 'user'
        });
      } else {
        showError(data.error_description || 'ログインIDまたはパスワードが正しくありません');
      }
    } catch (err) {
      showError('データベースへの接続に失敗しました。Project APIキーを確認してください。');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'ログイン';
    }
  }

  function showError(msg) {
    const errorBox = document.getElementById('login-error-box');
    const loginCard = document.querySelector('.login-card');
    
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
    
    // Trigger visual failure effects
    loginCard.classList.add('login-shake', 'login-failed');
    
    // Clear shake animation after it ends
    setTimeout(() => {
      loginCard.classList.remove('login-shake');
    }, 500);
  }
}
