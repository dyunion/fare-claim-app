// SmartFare User Management Component (Admin Only)

export function initUsers(containerId, users, onAddUser, showToast) {
  const container = document.getElementById(containerId);
  if (!container) return;

  renderUsers();

  function renderUsers() {
    container.innerHTML = `
      <div class="glass-card">
        <div class="user-notice-box" style="margin-bottom: 20px; padding: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
          💡 <strong>セキュリティに関するお知らせ:</strong><br>
          一般ユーザーは自分の申請のみ、管理者はすべての申請を閲覧できます。セキュリティ保持のため、登録済みユーザーのパスワード変更やアカウント削除は <strong>Supabase 管理ダッシュボード</strong>（Authentication 画面）にて直接実施してください。
        </div>

        <div class="form-header" style="border: none; margin-bottom: 20px;">
          <h3>👥 ユーザーアカウント管理</h3>
          <button id="add-user-modal-btn" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            新規ユーザー登録
          </button>
        </div>

        <div class="claim-table-wrapper">
          <table class="claim-table">
            <thead>
              <tr>
                <th>ユーザーID</th>
                <th>表示名 (氏名)</th>
                <th>権限 (ロール)</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              ${users.map(u => `
                <tr data-username="${u.username}">
                  <td style="font-family: monospace; font-weight: 600; color: var(--accent-cyan);">${u.username}</td>
                  <td style="font-weight: 500;">${u.name}</td>
                  <td>
                    <span class="badge ${u.role === 'admin' ? 'badge-approved' : 'badge-pending'}">
                      ${u.role === 'admin' ? '管理者' : '一般ユーザー'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind action listeners
    document.getElementById('add-user-modal-btn').addEventListener('click', () => showUserModal());
  }

  // Show Add Modal Overlay
  function showUserModal() {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';

    modal.innerHTML = `
      <div class="glass-card" style="position: relative; width: 420px; max-width: 90%; padding: 32px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
        <button id="close-user-modal" class="btn btn-secondary btn-icon-only" style="position: absolute; top: 12px; right: 12px; border-radius: 50%;">✕</button>
        <h3 style="font-size: 16px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; margin-bottom: 6px;">
          👤 新規ユーザー登録
        </h3>
        
        <form id="user-modal-form" onsubmit="return false;">
          <div class="form-group">
            <label for="modal-username">ユーザーID</label>
            <input type="text" id="modal-username" class="form-control" placeholder="例: tanaka" required>
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label for="modal-name">表示名 (氏名)</label>
            <input type="text" id="modal-name" class="form-control" placeholder="例: 田中 太郎" required>
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label for="modal-role">権限 (ロール)</label>
            <select id="modal-role" class="form-control" style="padding: 10px 14px;">
              <option value="user" selected>一般ユーザー</option>
              <option value="admin">管理者</option>
            </select>
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label for="modal-password">パスワード</label>
            <input type="password" id="modal-password" class="form-control" placeholder="••••••••" required>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--glass-border); padding-top: 16px;">
            <button type="button" id="cancel-user-modal" class="btn btn-secondary">キャンセル</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#close-user-modal').addEventListener('click', close);
    modal.querySelector('#cancel-user-modal').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    const form = modal.querySelector('#user-modal-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = modal.querySelector('#modal-username').value.trim().toLowerCase();
      const name = modal.querySelector('#modal-name').value.trim();
      const role = modal.querySelector('#modal-role').value;
      const password = modal.querySelector('#modal-password').value;

      if (!username || !name || !password) {
        showToast("すべての項目を入力してください", "danger");
        return;
      }

      if (password.length < 6) {
        showToast("パスワードは6文字以上で設定してください", "danger");
        return;
      }

      const payload = {
        username,
        name,
        role,
        password
      };

      onAddUser(payload);
      close();
    });
  }
}
