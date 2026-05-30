// SmartFare Application Main Orchestrator

import { SUPABASE_CONFIG, EDGE_FUNCTIONS } from './config.js?v=19';
import { MOCK_CLAIMS } from './data/samples.js?v=19';
import { initLogin } from './components/login.js?v=19';
import { initDashboard } from './components/dashboard.js?v=19';
import { initScanner } from './components/scanner.js?v=19';
import { initClaimForm } from './components/claimForm.js?v=19';
import { initUsers } from './components/users.js?v=19';

// Application State
let state = {
  token: localStorage.getItem('smartfare_token') || null,
  currentUser: JSON.parse(localStorage.getItem('smartfare_user')) || null,
  claims: [],
  currentView: 'dashboard', // 'dashboard', 'new-claim', 'edit-claim', 'history'
  activeClaim: null, // Claim details to populate in form
  fuelSettings: {
    standard: 9.6,
    compact: 12.4,
    kei: 15.1,
    bike: 30.0
  }
};

// Check if we are in local offline/demo mock mode
function isMock() {
  return !SUPABASE_CONFIG.URL || SUPABASE_CONFIG.URL.includes("your-project-ref") || (state.token && state.token.startsWith('mock-'));
}

// Map DB models to application camelCase properties and vice versa
function mapClaimFromDb(dbClaim) {
  return {
    id: dbClaim.id,
    date: dbClaim.date,
    title: dbClaim.title,
    category: dbClaim.category,
    amount: dbClaim.amount,
    status: dbClaim.status,
    applicantName: dbClaim.applicant_name,
    legs: dbClaim.legs,
    userId: dbClaim.user_id,
    createdAt: dbClaim.created_at
  };
}

function mapClaimToDb(claim) {
  return {
    id: claim.id,
    date: claim.date,
    title: claim.title,
    category: claim.category,
    amount: claim.amount,
    status: claim.status,
    applicant_name: claim.applicantName,
    legs: claim.legs
  };
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Bind static navigation & logout listeners
  bindSidebarNavigation();
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Header action: Quick scan button
  const quickScanBtn = document.getElementById('quick-scan-btn');
  if (quickScanBtn) {
    quickScanBtn.addEventListener('click', () => {
      state.activeClaim = null; // New scan
      switchView('new-claim');
    });
  }

  // Check login state
  checkSession();
});

// Authentication and Session Check
function checkSession() {
  const loginContainer = document.getElementById('login-container');
  const mainAppWrapper = document.getElementById('main-app-wrapper');

  if (state.token && state.currentUser) {
    // Session exists, load application
    loginContainer.style.display = 'none';
    mainAppWrapper.style.display = 'grid';
    
    // Update User profiles in sidebar header
    updateSidebarUserProfile();
    
    // Show/hide user management sidebar link
    const usersNav = document.getElementById('nav-users');
    if (usersNav) {
      usersNav.style.display = state.currentUser.role === 'admin' ? 'flex' : 'none';
    }
    
    // Load settings first, then fetch claims
    apiFetchSystemSettings().then(() => {
      apiFetchClaims();
    });
  } else {
    // Show login screen
    mainAppWrapper.style.display = 'none';
    loginContainer.style.display = 'block';
    
    initLogin('login-container', handleLoginSuccess);
  }
}

function handleLoginSuccess(token, user) {
  state.token = token;
  state.currentUser = user;
  
  // Save credentials to localStorage
  localStorage.setItem('smartfare_token', token);
  localStorage.setItem('smartfare_user', JSON.stringify(user));
  
  showToast(`${user.name}としてログインしました`, 'success');
  
  // Reload session settings
  checkSession();
}

function handleLogout() {
  state.token = null;
  state.currentUser = null;
  state.claims = [];
  state.activeClaim = null;
  state.currentView = 'dashboard';
  
  // Clear storage credentials
  localStorage.removeItem('smartfare_token');
  localStorage.removeItem('smartfare_user');
  
  showToast('ログアウトしました', 'info');
  
  // Reload session settings
  checkSession();
}

function updateSidebarUserProfile() {
  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name-display');
  const roleEl = document.getElementById('user-role-display');

  if (avatarEl && nameEl && roleEl && state.currentUser) {
    const displayName = state.currentUser.name;
    // Generate initials (first letter or first 2 characters)
    avatarEl.textContent = displayName.substring(0, 2).toUpperCase();
    nameEl.textContent = displayName;
    roleEl.textContent = state.currentUser.role === 'admin' ? '管理者' : '一般申請者';
  }
}

// API Helper wrapping Fetch API with automatic token injection targeting Supabase
async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${SUPABASE_CONFIG.URL}${path}`;
  
  const headers = options.headers ? { ...options.headers } : {};
  headers['apikey'] = SUPABASE_CONFIG.ANON_KEY;
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  
  const mergedOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    // If Unauthorized, force logout
    if (response.status === 401) {
      handleLogout();
      throw new Error("認証セッションが切れました。再ログインしてください。");
    }

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || errorJson.message || errorJson.error_description || `APIエラー (ステータス: ${response.status})`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (err) {
    showToast(err.message, 'danger');
    throw err;
  }
}

async function apiFetchClaims() {
  if (isMock()) {
    // Load from localStorage or default MOCK_CLAIMS
    let localClaims = localStorage.getItem('smartfare_mock_claims');
    if (!localClaims) {
      localStorage.setItem('smartfare_mock_claims', JSON.stringify(MOCK_CLAIMS));
      state.claims = JSON.parse(JSON.stringify(MOCK_CLAIMS));
    } else {
      state.claims = JSON.parse(localClaims);
    }
    renderActiveView();
    return;
  }

  try {
    const dbClaims = await apiFetch('/rest/v1/claims');
    state.claims = dbClaims.map(mapClaimFromDb);
    renderActiveView();
  } catch (err) {
    console.error("Claims loading failed:", err);
  }
}

// Global Toast System
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove animation
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// Navigation Controls
function bindSidebarNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      state.activeClaim = null; // Reset editing state
      switchView(target);
    });
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  
  // Update sidebar active classes
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    const target = btn.getAttribute('data-target');
    if (target === viewName || (viewName === 'edit-claim' && target === 'new-claim')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Top headers
  const titleEl = document.getElementById('page-title');
  const subtitleEl = document.getElementById('page-subtitle');
  const quickScanBtn = document.getElementById('quick-scan-btn');

  if (viewName === 'dashboard') {
    titleEl.textContent = 'ダッシュボード';
    subtitleEl.textContent = '現在の精算状況と統計データ';
    quickScanBtn.style.display = 'inline-flex';
  } else if (viewName === 'new-claim') {
    titleEl.textContent = '新規精算申請';
    subtitleEl.textContent = 'スクリーンショットまたは手動入力による申請作成';
    quickScanBtn.style.display = 'none';
  } else if (viewName === 'edit-claim') {
    titleEl.textContent = '申請の確認・修正';
    subtitleEl.textContent = 'OCR読み取り結果、または既存の申請内容の編集';
    quickScanBtn.style.display = 'none';
  } else if (viewName === 'history') {
    titleEl.textContent = '申請履歴一覧';
    subtitleEl.textContent = '過去の申請ログの閲覧・エクスポート';
    quickScanBtn.style.display = 'inline-flex';
  } else if (viewName === 'users') {
    titleEl.textContent = 'ユーザーアカウント管理';
    subtitleEl.textContent = '登録されているメンバーの追加・修正・削除';
    quickScanBtn.style.display = 'none';
  }

  renderActiveView();
}

// Render dynamic containers
function renderActiveView() {
  const wrapperId = 'view-container';
  const container = document.getElementById(wrapperId);
  if (!container) return;

  // Clear previous listeners by clearing HTML
  container.innerHTML = '';

  if (state.currentView === 'dashboard') {
    initDashboard(
      wrapperId,
      state.claims,
      (target) => switchView(target),
      (id) => handleEditClaim(id),
      (id) => handleApproveClaim(id),
      showToast,
      (imgSrc, title) => showReceiptModal(imgSrc, title),
      state.currentUser.role === 'admin'
    );
  } else if (state.currentView === 'new-claim') {
    initScanner(
      wrapperId,
      (ocrData) => {
        // Enforce user lock in form
        ocrData.applicantName = state.currentUser.name;
        ocrData.isNameLocked = state.currentUser.role !== 'admin';
        state.activeClaim = ocrData;
        switchView('edit-claim');
      },
      showToast
    );
  } else if (state.currentView === 'edit-claim') {
    // If regular user editing / creating, lock the name field
    const editorClaim = state.activeClaim ? { ...state.activeClaim } : {};
    
    // Auto lock details for non-admin
    if (state.currentUser.role !== 'admin') {
      editorClaim.applicantName = state.currentUser.name;
      editorClaim.isNameLocked = true;
    }
    
    initClaimForm(
      wrapperId,
      editorClaim,
      (savedClaim) => handleSaveClaim(savedClaim),
      () => switchView('dashboard'),
      showToast,
      state.fuelSettings
    );
  } else if (state.currentView === 'history') {
    renderHistoryView(wrapperId);
  } else if (state.currentView === 'users') {
    renderUsersView(wrapperId);
  }
}

// Handle Operations
function handleEditClaim(id) {
  const claim = state.claims.find(c => c.id === id);
  if (claim) {
    state.activeClaim = claim;
    switchView('edit-claim');
  }
}

async function handleApproveClaim(id) {
  if (state.currentUser.role !== 'admin') {
    showToast("承認権限がありません", "danger");
    return;
  }
  
  if (isMock()) {
    state.claims = state.claims.map(c => c.id === id ? { ...c, status: 'approved' } : c);
    localStorage.setItem('smartfare_mock_claims', JSON.stringify(state.claims));
    showToast('【デモ】申請を承認しました！', 'success');
    renderActiveView();
    return;
  }

  try {
    await apiFetch(`/rest/v1/claims?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ status: 'approved' })
    });
    showToast('申請を承認しました！', 'success');
    apiFetchClaims(); // Reload list
  } catch (err) {
    console.error("Approve failed:", err);
  }
}

async function handleSaveClaim(savedClaim) {
  try {
    if (isMock()) {
      if (!savedClaim.id) {
        savedClaim.id = `claim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        state.claims.push(savedClaim);
      } else {
        state.claims = state.claims.map(c => c.id === savedClaim.id ? savedClaim : c);
      }
      localStorage.setItem('smartfare_mock_claims', JSON.stringify(state.claims));
      showToast(savedClaim.id ? '【デモ】申請内容を更新しました' : '【デモ】新規申請を登録しました', 'success');
      state.activeClaim = null;
      switchView('dashboard');
      return;
    }

    if (!savedClaim.id) {
      // Assign a new ID (UUID format style or random timestamp style)
      savedClaim.id = `claim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const dbClaim = mapClaimToDb(savedClaim);
      
      await apiFetch('/rest/v1/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(dbClaim)
      });
    } else {
      const dbClaim = mapClaimToDb(savedClaim);
      
      await apiFetch(`/rest/v1/claims?id=eq.${savedClaim.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(dbClaim)
      });
    }
    
    showToast(savedClaim.id ? '申請内容を更新しました' : '新規申請を登録しました', 'success');
    state.activeClaim = null;
    switchView('dashboard');
  } catch (err) {
    console.error("Save failed:", err);
  }
}

async function handleDeleteClaim(id) {
  if (confirm('この精算申請を削除してもよろしいですか？')) {
    if (isMock()) {
      state.claims = state.claims.filter(c => c.id !== id);
      localStorage.setItem('smartfare_mock_claims', JSON.stringify(state.claims));
      showToast('【デモ】精算申請を削除しました', 'info');
      renderActiveView();
      return;
    }

    try {
      await apiFetch(`/rest/v1/claims?id=eq.${id}`, {
        method: 'DELETE'
      });
      showToast('精算申請を削除しました', 'info');
      apiFetchClaims(); // Reload list
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }
}

async function renderUsersView(wrapperId) {
  if (state.currentUser.role !== 'admin') {
    showToast("アクセス権限がありません", "danger");
    switchView('dashboard');
    return;
  }

  if (isMock()) {
    const defaultMockUsers = [
      { username: 'admin', name: '管理者', role: 'admin', password: 'admin123' },
      { username: 'yrai', name: 'Y Rai', role: 'user', password: 'yrai123' },
      { username: 'sato', name: '佐藤 健二', role: 'user', password: 'sato123' },
      { username: 'suzuki', name: '鈴木 美咲', role: 'user', password: 'suzuki123' }
    ];
    let localUsers = localStorage.getItem('smartfare_mock_users');
    if (!localUsers) {
      localStorage.setItem('smartfare_mock_users', JSON.stringify(defaultMockUsers));
      localUsers = JSON.stringify(defaultMockUsers);
    }
    const users = JSON.parse(localUsers);
    
    initUsers(
      wrapperId,
      users,
      async (newUser) => {
        const uList = JSON.parse(localStorage.getItem('smartfare_mock_users') || JSON.stringify(defaultMockUsers));
        if (uList.some(u => u.username === newUser.username)) {
          showToast('このユーザーIDは既に登録されています。', 'danger');
          return;
        }
        uList.push({
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          password: newUser.password
        });
        localStorage.setItem('smartfare_mock_users', JSON.stringify(uList));
        showToast('【デモ】新規ユーザーを登録しました', 'success');
        renderUsersView(wrapperId);
      },
      showToast,
      state.fuelSettings,
      async (newFuelSettings) => {
        await apiSaveFuelSettings(newFuelSettings);
        renderUsersView(wrapperId);
      },
      async (username, payload) => {
        const uList = JSON.parse(localStorage.getItem('smartfare_mock_users') || JSON.stringify(defaultMockUsers));
        const idx = uList.findIndex(u => u.username === username);
        if (idx !== -1) {
          uList[idx].name = payload.name;
          uList[idx].role = payload.role;
          if (payload.password) {
            uList[idx].password = payload.password;
          }
          localStorage.setItem('smartfare_mock_users', JSON.stringify(uList));
          showToast('【デモ】ユーザー情報を修正しました。', 'success');
          renderUsersView(wrapperId);
        }
      },
      async (username) => {
        const uList = JSON.parse(localStorage.getItem('smartfare_mock_users') || JSON.stringify(defaultMockUsers));
        const filtered = uList.filter(u => u.username !== username);
        localStorage.setItem('smartfare_mock_users', JSON.stringify(filtered));
        showToast('【デモ】ユーザーを削除しました。', 'success');
        renderUsersView(wrapperId);
      },
      state.currentUser.username
    );
    return;
  }

  try {
    const users = await apiFetch('/rest/v1/rpc/list_users_by_admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    initUsers(
      wrapperId,
      users,
      async (newUser) => {
        try {
          await apiCreateUserByAdmin(newUser);
          showToast('ユーザー情報を登録しました。', 'success');
          renderUsersView(wrapperId);
        } catch (err) {
          console.error("Save user failed:", err);
          showToast(`ユーザー登録に失敗しました: ${err.message}`, 'danger');
        }
      },
      showToast,
      state.fuelSettings,
      async (newFuelSettings) => {
        await apiSaveFuelSettings(newFuelSettings);
        renderUsersView(wrapperId);
      },
      async (userId, payload) => {
        await apiUpdateUser(userId, payload);
        renderUsersView(wrapperId);
      },
      async (userId) => {
        await apiDeleteUser(userId);
        renderUsersView(wrapperId);
      },
      state.currentUser.id
    );
  } catch (err) {
    console.error("Failed to load users:", err);
    showToast(`ユーザー一覧の読み込みに失敗しました: ${err.message}`, 'danger');
    renderUsersLoadError(wrapperId, err);
  }
}

async function apiCreateUserByAdmin(newUser) {
  if (!newUser || !newUser.username || !newUser.name || !newUser.password) {
    throw new Error('ユーザーID、表示名、パスワードを入力してください。');
  }

  if (!['admin', 'user'].includes(newUser.role)) {
    throw new Error('権限には admin または user を指定してください。');
  }

  await apiFetch(EDGE_FUNCTIONS.ADMIN_USERS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      password: newUser.password
    })
  });
}

function renderUsersLoadError(wrapperId, err) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  wrapper.innerHTML = `
    <div class="glass-card" style="padding: 24px;">
      <div class="form-header" style="border: none; margin-bottom: 16px;">
        <h3>ユーザー一覧を表示できませんでした</h3>
      </div>
      <p class="text-secondary" style="font-size: 13px; line-height: 1.6; margin-bottom: 16px;">
        Supabase側の管理者用SQLがまだ反映されていない可能性があります。
      </p>
      <div style="padding: 12px; border: 1px solid var(--glass-border); border-radius: 8px; background: rgba(0,0,0,0.18); color: var(--text-secondary); font-size: 12px; line-height: 1.5;">
        ${escapeHtml(err.message || 'ユーザー一覧の取得に失敗しました。')}
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render History view with filter operations
function renderHistoryView(wrapperId) {
  const container = document.getElementById(wrapperId);
  if (!container) return;

  const isAdmin = state.currentUser.role === 'admin';

  container.innerHTML = `
    <div class="glass-card">
      <!-- Search & Filters -->
      <div class="filters-bar">
        <div class="search-input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="history-search" class="form-control" placeholder="目的、申請者、区間を検索...">
        </div>
        
        <div class="filter-selects">
          <select id="history-filter-category" class="form-control" style="padding: 10px 14px;">
            <option value="all">すべての交通区分</option>
            <option value="jr">JR線</option>
            <option value="subway">地下鉄</option>
            <option value="private_rail">私鉄</option>
            <option value="shinkansen">新幹線・特急</option>
            <option value="bus">バス</option>
            <option value="taxi">タクシー</option>
            <option value="private_car">自家用車</option>
            <option value="rental_car">レンタカー</option>
            <option value="highway">高速道路</option>
            <option value="flight">飛行機</option>
          </select>
          
          <select id="history-filter-status" class="form-control" style="padding: 10px 14px;">
            <option value="all">すべてのステータス</option>
            <option value="all">すべてのステータス</option>
            <option value="pending">承認待ち</option>
            <option value="approved">承認済</option>
          </select>

          <button id="history-export-btn" class="btn btn-secondary" title="CSVエクスポート">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            エクスポート
          </button>
        </div>
      </div>

      <!-- Table Wrapper -->
      <div class="claim-table-wrapper">
        <table class="claim-table" id="history-table">
          <thead>
            <tr>
              <th>利用日</th>
              <th>申請者</th>
              <th>目的、詳細</th>
              <th>交通区分</th>
              <th>利用区間 (経路)</th>
              <th>領収書</th>
              <th>合計金額</th>
              <th>ステータス</th>
              <th style="text-align: right;">操作</th>
            </tr>
          </thead>
          <tbody id="history-tbody">
            <!-- Filtered items render here -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind local filter events
  const searchInput = document.getElementById('history-search');
  const catFilter = document.getElementById('history-filter-category');
  const statusFilter = document.getElementById('history-filter-status');
  const exportBtn = document.getElementById('history-export-btn');

  searchInput.addEventListener('input', filterHistoryTable);
  catFilter.addEventListener('change', filterHistoryTable);
  statusFilter.addEventListener('change', filterHistoryTable);
  exportBtn.addEventListener('click', handleCSVExport);

  // Initial render of history rows
  filterHistoryTable();

  function filterHistoryTable() {
    const query = searchInput.value.toLowerCase();
    const selectedCat = catFilter.value;
    const selectedStatus = statusFilter.value;
    const tbody = document.getElementById('history-tbody');
    
    // Filter logic
    const filteredClaims = state.claims.filter(claim => {
      const matchQuery = claim.title.toLowerCase().includes(query) || 
                         (claim.applicantName || '').toLowerCase().includes(query) ||
                         (claim.purpose || '').toLowerCase().includes(query) ||
                         claim.legs.some(leg => leg.from.toLowerCase().includes(query) || leg.to.toLowerCase().includes(query));
      const matchCat = selectedCat === 'all' || claim.category === selectedCat;
      const matchStatus = selectedStatus === 'all' || claim.status === selectedStatus;
      
      return matchQuery && matchCat && matchStatus;
    });

    // Populate rows
    if (filteredClaims.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
            条件に一致する精算申請は見つかりませんでした。
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredClaims.slice().reverse().map(claim => {
      const legsText = claim.legs.map(leg => `${leg.from} ➡ ${leg.to}`).join(' | ');
      const dateStr = claim.date.replace(/-/g, '/');
      const categoryLabel = getCategoryLabel(claim.category);

      return `
        <tr data-id="${claim.id}">
          <td style="font-family: monospace; font-weight: 500;">${dateStr}</td>
          <td style="font-weight: 500; color: var(--text-primary);">${claim.applicantName || ''}</td>
          <td style="font-weight: 600;">
            <div>${claim.title}</div>
          </td>
          <td>
            <span class="transit-type-tag ${claim.category}">
              ${categoryLabel}
            </span>
          </td>
          <td style="font-size: 13px; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${legsText}">
            ${legsText}
          </td>
          <td>
            ${(() => {
              const count = claim.legs.filter(l => l.receiptImage).length;
              return count > 0 ? `<span class="badge badge-approved view-receipt-badge" style="cursor: pointer; font-size: 10px;" data-id="${claim.id}">📄 ${count}枚</span>` : `<span style="font-size: 11px; color: var(--text-muted);">なし</span>`;
            })()}
          </td>
          <td style="font-family: monospace; font-weight: 700; color: var(--accent-cyan);">¥ ${claim.amount.toLocaleString()}</td>
          <td>
            <span class="badge ${claim.status === 'approved' ? 'badge-approved' : 'badge-pending'}">
              ${claim.status === 'approved' ? '承認済' : '承認待ち'}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${(claim.status === 'pending' && isAdmin) ? `
              <button class="btn btn-secondary btn-icon-only approve-btn" title="承認" style="margin-right: 6px; border-color: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-icon-only edit-btn" style="margin-right: 6px;" title="詳細編集">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
            </button>
            <button class="btn btn-danger btn-icon-only delete-btn" title="削除">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind row action listeners
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const id = row.getAttribute('data-id');
      if (!id) return;

      row.querySelector('.edit-btn').addEventListener('click', () => handleEditClaim(id));
      row.querySelector('.delete-btn').addEventListener('click', () => handleDeleteClaim(id));
      
      const approveBtn = row.querySelector('.approve-btn');
      if (approveBtn) {
        approveBtn.addEventListener('click', () => handleApproveClaim(id));
      }

      const receiptBadge = row.querySelector('.view-receipt-badge');
      if (receiptBadge) {
        receiptBadge.addEventListener('click', () => {
          const claim = filteredClaims.find(c => c.id === id);
          if (claim) {
            const receiptLegs = claim.legs.filter(l => l.receiptImage);
            if (receiptLegs.length > 0) {
              showReceiptModal(receiptLegs, claim.title);
            }
          }
        });
      }
    });
  }

  function handleCSVExport() {
    if (state.claims.length === 0) {
      showToast('エクスポートするデータがありません', 'danger');
      return;
    }

    // Build CSV Content (UTF-8 with BOM for Excel compatibility)
    let csvContent = '\uFEFF';
    csvContent += '利用日,申請者,目的、詳細,交通区分,合計金額,ステータス,領収書添付,出発地,到着地,金額,備考\n';
    
    state.claims.forEach(claim => {
      const statusLabel = claim.status === 'approved' ? '承認済' : '承認待ち';
      const catLabel = getCategoryLabel(claim.category);
      
      // If multi-leg, print each leg on a row
      claim.legs.forEach(leg => {
        const cleanTitle = claim.title.replace(/"/g, '""');
        const cleanRemark = (leg.remark || '').replace(/"/g, '""');
        const receiptAttached = leg.receiptImage ? 'あり' : 'なし';
        csvContent += `"${claim.date}","${claim.applicantName || ''}","${cleanTitle}","${catLabel}",${claim.amount},"${statusLabel}","${receiptAttached}","${leg.from}","${leg.to}",${leg.amount},"${cleanRemark}"\n`;
      });
    });

    // Create Download Trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SmartFare_交通費精算_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSVファイルをエクスポートしました', 'success');
  }
}

// Helpers
function getCategoryLabel(cat) {
  const map = {
    jr: 'JR線',
    subway: '地下鉄',
    private_rail: '私鉄',
    shinkansen: '新幹線・特急',
    highway: '高速道路',
    flight: '飛行機',
    bus: 'バス',
    taxi: 'タクシー',
    private_car: '自家用車',
    rental_car: 'レンタカー'
  };
  return map[cat] || cat;
}

// Receipt Preview Modal
function showReceiptModal(receiptLegs, title) {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';

  const legsHtml = receiptLegs.map((leg, idx) => `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; border-bottom: ${idx < receiptLegs.length - 1 ? '1px solid var(--glass-border)' : 'none'}; padding-bottom: 16px; margin-bottom: 16px; width: 100%;">
      <div style="font-size: 13px; font-weight: 600; color: var(--accent-cyan); align-self: flex-start; display: flex; align-items: center; gap: 6px;">
        <span class="transit-type-tag ${leg.type}" style="font-size: 11px; padding: 2px 6px;">${getCategoryLabel(leg.type).split('・')[0]}</span>
        <span>${leg.from} ➡ ${leg.to} (¥${(leg.amount || 0).toLocaleString()})</span>
      </div>
      <img src="${leg.receiptImage}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 6px; border: 1px solid var(--glass-border);">
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="glass-card" style="position: relative; width: 500px; max-width: 90%; max-height: 85%; padding: 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
      <button id="close-modal-btn" class="btn btn-secondary btn-icon-only" style="position: absolute; top: 12px; right: 12px; border-radius: 50%;">✕</button>
      <h3 style="margin-right: 30px; font-size: 16px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">📄 ${title} - 領収書プレビュー</h3>
      
      <div style="overflow-y: auto; flex: 1; padding-right: 6px; display: flex; flex-direction: column; gap: 4px;">
        ${legsHtml}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#close-modal-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Fetch system settings from Database or localStorage
async function apiFetchSystemSettings() {
  if (isMock()) {
    const localSettings = localStorage.getItem('smartfare_system_settings');
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        if (parsed.fuel_efficiency) {
          state.fuelSettings = parsed.fuel_efficiency;
        }
      } catch (e) {
        console.error("Local settings parse error:", e);
      }
    }
    return;
  }

  try {
    const settings = await apiFetch('/rest/v1/system_settings');
    const fuelEff = settings.find(s => s.key === 'fuel_efficiency');
    if (fuelEff && fuelEff.value) {
      state.fuelSettings = fuelEff.value;
    }
  } catch (err) {
    console.error("System settings loading failed:", err);
  }
}

// Save custom fuel settings to Database or localStorage
async function apiSaveFuelSettings(newSettings) {
  if (isMock()) {
    const settingsObj = { fuel_efficiency: newSettings };
    localStorage.setItem('smartfare_system_settings', JSON.stringify(settingsObj));
    state.fuelSettings = newSettings;
    showToast("燃費設定をローカル保存しました（デモモード）", "success");
    return;
  }

  try {
    await apiFetch('/rest/v1/system_settings', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'fuel_efficiency',
        value: newSettings,
        updated_at: new Date().toISOString()
      })
    });
    state.fuelSettings = newSettings;
    showToast("車両燃費基準値を変更しました", "success");
  } catch (err) {
    console.error("Failed to save fuel settings:", err);
    showToast(`設定の保存に失敗しました: ${err.message}`, "danger");
  }
}

// Delete user account by Admin via RPC
async function apiDeleteUser(userId) {
  try {
    await apiFetch('/rest/v1/rpc/delete_user_by_admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_user_id: userId
      })
    });
    showToast("アカウントを削除しました", "success");
  } catch (err) {
    console.error("Failed to delete user:", err);
    showToast(`削除に失敗しました: ${err.message}`, "danger");
    throw err;
  }
}

// Update user details (and optionally password) by Admin via RPC
async function apiUpdateUser(userId, payload) {
  try {
    if (!['admin', 'user'].includes(payload.role)) {
      throw new Error('権限には admin または user を指定してください。');
    }

    // 1. Update Profile (Name & Role)
    await apiFetch('/rest/v1/rpc/update_user_profile_by_admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_user_id: userId,
        new_name: payload.name,
        new_role: payload.role
      })
    });

    // 2. If password update is requested, run password change RPC
    if (payload.password) {
      await apiFetch('/rest/v1/rpc/update_user_password_by_admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: userId,
          new_password: payload.password
        })
      });
    }

    showToast("ユーザー情報を変更しました", "success");
  } catch (err) {
    console.error("Failed to update user:", err);
    showToast(`更新に失敗しました: ${err.message}`, "danger");
    throw err;
  }
}
