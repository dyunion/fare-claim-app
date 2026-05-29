// SmartFare User Management Component (Admin Only)

export function initUsers(containerId, users, onAddUser, showToast, fuelSettings, onSaveFuelSettings, onUpdateUser, onDeleteUser, currentUserId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  renderUsers();

  function renderUsers() {
    container.innerHTML = `
      <div class="glass-card">
        <div class="user-notice-box" style="margin-bottom: 20px; padding: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
          💡 <strong>セキュリティに関するお知らせ:</strong><br>
          一般ユーザーは自分の申請のみ、管理者はすべての申請を閲覧できます。セキュリティ保持のため、ログイン中の管理者自身の削除や、管理者権限の格下げ操作はシステム的にロックされています。
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
                <th style="text-align: right; padding-right: 24px;">操作</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              ${users.map(u => {
                const userKey = u.id || u.username;
                const isSelf = userKey === currentUserId;
                return `
                  <tr data-key="${userKey}">
                    <td style="font-family: monospace; font-weight: 600; color: var(--accent-cyan);">${u.username}</td>
                    <td style="font-weight: 500;" class="user-display-name">${u.name}</td>
                    <td>
                      <span class="badge ${u.role === 'admin' ? 'badge-approved' : 'badge-pending'} user-role-badge">
                        ${u.role === 'admin' ? '管理者' : '一般ユーザー'}
                      </span>
                    </td>
                    <td style="text-align: right; padding-right: 16px;">
                      <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary edit-user-btn" style="padding: 4px 10px; font-size: 11px;">修正</button>
                        <button type="button" class="btn btn-danger delete-user-btn" style="padding: 4px 10px; font-size: 11px; ${isSelf ? 'opacity: 0.3; cursor: not-allowed;' : ''}" ${isSelf ? 'disabled' : ''}>削除</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 車両燃費基準値の設定 (管理者専用) -->
      <div class="glass-card" style="margin-top: 24px;">
        <div class="form-header" style="border: none; margin-bottom: 20px;">
          <h3>🚗 車両燃費基準値の設定</h3>
        </div>

        <p class="text-secondary" style="font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
          国基準の変更や燃料効率の改定に合わせて、自動計算用の基準燃費（km/L）を設定します。<br>
          ※設定変更後、新しく作成する申請および編集する申請に対して適用されます。
        </p>

        <form id="fuel-settings-form" style="display: flex; flex-direction: column; gap: 16px;" onsubmit="return false;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div class="form-group">
              <label for="fuel-standard">普通車 燃費</label>
              <input type="number" id="fuel-standard" class="form-control" value="${fuelSettings ? fuelSettings.standard : 9.6}" step="any" min="0.1" required style="padding: 10px 14px;">
              <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">初期値: 9.6 km/L</span>
            </div>
            
            <div class="form-group">
              <label for="fuel-compact">小型車 燃費</label>
              <input type="number" id="fuel-compact" class="form-control" value="${fuelSettings ? fuelSettings.compact : 12.4}" step="any" min="0.1" required style="padding: 10px 14px;">
              <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">初期値: 12.4 km/L</span>
            </div>

            <div class="form-group">
              <label for="fuel-kei">軽自動車 燃費</label>
              <input type="number" id="fuel-kei" class="form-control" value="${fuelSettings ? fuelSettings.kei : 15.1}" step="any" min="0.1" required style="padding: 10px 14px;">
              <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">初期値: 15.1 km/L</span>
            </div>

            <div class="form-group">
              <label for="fuel-bike">二輪車 (バイク) 燃費</label>
              <input type="number" id="fuel-bike" class="form-control" value="${fuelSettings ? fuelSettings.bike : 30.0}" step="any" min="0.1" required style="padding: 10px 14px;">
              <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;">初期値: 30.0 km/L</span>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 10px; border-top: 1px solid var(--glass-border); padding-top: 16px;">
            <button type="submit" id="save-fuel-settings-btn" class="btn btn-primary" style="padding: 10px 24px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              燃費設定を保存
            </button>
          </div>
        </form>
      </div>
    `;

    // Bind action listeners
    document.getElementById('add-user-modal-btn').addEventListener('click', () => showUserModal());

    // Bind edit/delete listeners
    container.querySelectorAll('.edit-user-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const u = users[idx];
        showEditUserModal(u);
      });
    });

    container.querySelectorAll('.delete-user-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const u = users[idx];
        const userKey = u.id || u.username;
        if (confirm(`【警告】ユーザー「${u.name} (${u.username})」を削除しますか？\nこの操作は取り消せません。`)) {
          if (onDeleteUser) {
            onDeleteUser(userKey);
          }
        }
      });
    });

    const fuelForm = document.getElementById('fuel-settings-form');
    if (fuelForm) {
      fuelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const standard = parseFloat(document.getElementById('fuel-standard').value);
        const compact = parseFloat(document.getElementById('fuel-compact').value);
        const kei = parseFloat(document.getElementById('fuel-kei').value);
        const bike = parseFloat(document.getElementById('fuel-bike').value);

        if (isNaN(standard) || isNaN(compact) || isNaN(kei) || isNaN(bike) || standard <= 0 || compact <= 0 || kei <= 0 || bike <= 0) {
          showToast('燃費には0より大きい正しい数値を指定してください', 'danger');
          return;
        }

        const payload = {
          standard,
          compact,
          kei,
          bike
        };

        if (onSaveFuelSettings) {
          onSaveFuelSettings(payload);
        }
      });
    }
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

  // Show Edit User Modal
  function showEditUserModal(user) {
    const userKey = user.id || user.username;
    const isSelf = userKey === currentUserId;
    
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
        <button id="close-edit-modal" class="btn btn-secondary btn-icon-only" style="position: absolute; top: 12px; right: 12px; border-radius: 50%;">✕</button>
        <h3 style="font-size: 16px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; margin-bottom: 6px;">
          ✏️ ユーザー情報の修正: ${user.username}
        </h3>
        
        <form id="edit-user-form" onsubmit="return false;">
          <div class="form-group">
            <label for="edit-name">表示名 (氏名)</label>
            <input type="text" id="edit-name" class="form-control" value="${user.name}" required>
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label for="edit-role">権限 (ロール)</label>
            <select id="edit-role" class="form-control" style="padding: 10px 14px;" ${isSelf ? 'disabled title="自分自身の管理者権限を剥奪することはできません"' : ''}>
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>一般ユーザー</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理者</option>
            </select>
            ${isSelf ? '<span style="font-size: 10px; color: var(--text-muted); margin-top: 4px; display: block;">※自分自身のロール変更はできません</span>' : ''}
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label for="edit-password">新しいパスワード (変更する場合のみ入力)</label>
            <input type="password" id="edit-password" class="form-control" placeholder="変更しない場合は空欄">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--glass-border); padding-top: 16px;">
            <button type="button" id="cancel-edit-modal" class="btn btn-secondary">キャンセル</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#close-edit-modal').addEventListener('click', close);
    modal.querySelector('#cancel-edit-modal').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    const form = modal.querySelector('#edit-user-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = modal.querySelector('#edit-name').value.trim();
      const role = isSelf ? 'admin' : modal.querySelector('#edit-role').value;
      const password = modal.querySelector('#edit-password').value;

      if (!name) {
        showToast("表示名を入力してください", "danger");
        return;
      }

      if (password && password.length < 6) {
        showToast("パスワードは6文字以上で設定してください", "danger");
        return;
      }

      const payload = {
        name,
        role,
        password: password || null
      };

      if (onUpdateUser) {
        onUpdateUser(userKey, payload);
      }
      close();
    });
  }
}
