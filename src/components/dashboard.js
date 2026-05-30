// SmartFare Dashboard Component

const TRANSIT_METRIC_CONFIG = {
  jr: { label: 'JR線', dotColor: '#10b981' },
  subway: { label: '地下鉄', dotColor: '#e11d48' },
  private_rail: { label: '私鉄', dotColor: '#db2777' },
  shinkansen: { label: '新幹線', dotColor: '#2563eb' },
  bus: { label: 'バス', dotColor: '#d97706' },
  taxi: { label: 'タクシー', dotColor: '#0891b2' },
  private_car: { label: '自家用車', dotColor: '#64748b' },
  rental_car: { label: 'レンタカー', dotColor: '#4b5563' },
  highway: { label: '高速道路', dotColor: '#059669' },
  flight: { label: '飛行機', dotColor: '#7c3aed' }
};

function getClaimStatusMeta(status) {
  if (status === 'approved') return { label: '承認済', badgeClass: 'badge-approved' };
  if (status === 'draft') return { label: '下書き', badgeClass: 'badge-draft' };
  return { label: '承認待ち', badgeClass: 'badge-pending' };
}

export function initDashboard(containerId, claims, onViewChange, onEditClaim, onApproveClaim, showToast, onViewReceipt, isAdmin) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Calculate Metrics
  const submittedClaims = claims.filter(c => c.status !== 'draft');
  const totalAmount = submittedClaims.reduce((sum, c) => sum + c.amount, 0);
  const pendingAmount = claims.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const approvedAmount = claims.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
  const totalReceipts = claims.length;

  // Calculate transit breakdown
  const categoryBreakdown = {};
  submittedClaims.forEach(c => {
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + c.amount;
  });

  // Calculate monthly stats for SVG chart (mock months based on current time)
  // Let's create data for: 12月, 1月, 2月, 3月, 4月, 5月
  const monthlyData = [
    { month: '12月', amount: 18900 },
    { month: '1月', amount: 32400 },
    { month: '2月', amount: 15600 },
    { month: '3月', amount: 48900 },
    { month: '4月', amount: 22000 },
    { month: '5月', amount: totalAmount } // Current month is sum of claims
  ];

  const maxMonthlyAmount = Math.max(...monthlyData.map(d => d.amount), 50000);

  // Render Layout
  container.innerHTML = `
    <!-- Top Statistics Metrics -->
    <div class="dashboard-grid">
      <div class="metric-card glass-card">
        <div class="metric-icon cyan">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="metric-details">
          <p>申請中合計</p>
          <div class="metric-val">¥ ${totalAmount.toLocaleString()}</div>
        </div>
      </div>

      <div class="metric-card glass-card">
        <div class="metric-icon purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="metric-details">
          <p>承認待ち金額</p>
          <div class="metric-val">¥ ${pendingAmount.toLocaleString()}</div>
        </div>
      </div>

      <div class="metric-card glass-card">
        <div class="metric-icon emerald">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="metric-details">
          <p>精算完了金額</p>
          <div class="metric-val">¥ ${approvedAmount.toLocaleString()}</div>
        </div>
      </div>

      <div class="metric-card glass-card">
        <div class="metric-icon rose">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="metric-details">
          <p>申請件数</p>
          <div class="metric-val">${totalReceipts} 件</div>
        </div>
      </div>
    </div>

    <!-- Charts & Analytics Details -->
    <div class="dashboard-details-row">
      <!-- Custom SVG bar chart -->
      <div class="chart-card glass-card">
        <h3>📊 月別精算推移 <span style="font-size:11px; font-weight:normal; color:var(--text-muted);">（過去6ヶ月）</span></h3>
        <div class="chart-container">
          ${monthlyData.map(data => {
            const percentage = (data.amount / maxMonthlyAmount) * 100;
            return `
              <div class="chart-bar-group">
                <div class="chart-bar-outer">
                  <div class="chart-bar-fill" style="height: ${percentage}%" title="¥ ${data.amount.toLocaleString()}"></div>
                </div>
                <div class="chart-label">${data.month}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color" style="background: linear-gradient(to top, var(--accent-purple), var(--accent-cyan));"></span>
            <span>精算額（円）</span>
          </div>
        </div>
      </div>

      <!-- Categories Breakdown panel -->
      <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">🚕 交通機関別内訳</h3>
        <div class="breakdown-list" style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 14px;">
          ${Object.keys(TRANSIT_METRIC_CONFIG).map(catKey => {
            const amount = categoryBreakdown[catKey] || 0;
            const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            const config = TRANSIT_METRIC_CONFIG[catKey];
            
            return `
              <div>
                <div class="breakdown-item" style="margin-bottom: 6px;">
                  <div class="breakdown-info">
                    <span class="transit-dot" style="background-color: ${config.dotColor}"></span>
                    <span>${config.label}</span>
                  </div>
                  <span class="breakdown-val">¥ ${amount.toLocaleString()}</span>
                </div>
                <!-- Mini progress bar -->
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${percentage}%; height: 100%; background-color: ${config.dotColor}; border-radius: 3px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Recent Claim list -->
    <div class="glass-card claim-table-wrapper" style="grid-column: span 2;">
      <div class="form-header" style="border: none; margin-bottom: 12px;">
        <h3 style="font-size: 16px; font-weight: 600;">📋 最近の精算申請</h3>
        <button id="dashboard-to-history-btn" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">
          すべての履歴を見る
        </button>
      </div>

      <table class="claim-table">
        <thead>
          <tr>
            <th>利用日</th>
            <th>目的、詳細</th>
            <th>交通区分</th>
            <th>経路・区間</th>
            <th>領収書</th>
            <th>金額</th>
            <th>ステータス</th>
            <th style="text-align: right;">アクション</th>
          </tr>
        </thead>
        <tbody>
          ${claims.length === 0 ? `
            <tr>
              <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                登録されている精算申請はありません。「新規精算申請」から登録してください。
              </td>
            </tr>
          ` : claims.slice().reverse().map(claim => {
            const legsText = claim.legs.map(leg => `${leg.from} ➡ ${leg.to}`).join(' | ');
            const dateStr = claim.date.replace(/-/g, '/');
            const statusMeta = getClaimStatusMeta(claim.status);
            return `
              <tr data-id="${claim.id}">
                <td style="font-family: monospace; font-weight: 500;">${dateStr}</td>
                <td style="font-weight: 600;">
                  <div>${claim.title}</div>
                  <div style="font-size: 11px; color: var(--text-muted); font-weight: normal; margin-top: 2px;">申請者: ${claim.applicantName || 'Y Rai'}</div>
                </td>
                <td>
                  <span class="transit-type-tag ${claim.category}">
                    ${getTransitTagEmoji(claim.category)} ${TRANSIT_METRIC_CONFIG[claim.category]?.label || claim.category}
                  </span>
                </td>
                <td style="font-size: 12px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
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
                  <span class="badge ${statusMeta.badgeClass}">
                    ${statusMeta.label}
                  </span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  ${(claim.status === 'pending' && isAdmin) ? `
                    <button class="btn btn-secondary btn-icon-only approve-btn" title="スピード承認" style="margin-right: 6px; border-color: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  ` : ''}
                  <button class="btn btn-secondary btn-icon-only edit-btn" title="詳細・編集">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Bind Actions
  const tableRows = container.querySelectorAll('.claim-table tbody tr');
  tableRows.forEach(row => {
    const id = row.getAttribute('data-id');
    if (!id) return;

    const editBtn = row.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        onEditClaim(id);
      });
    }

    const approveBtn = row.querySelector('.approve-btn');
    if (approveBtn) {
      approveBtn.addEventListener('click', () => {
        onApproveClaim(id);
      });
    }

    const receiptBadge = row.querySelector('.view-receipt-badge');
    if (receiptBadge) {
      receiptBadge.addEventListener('click', () => {
        const claim = claims.find(c => c.id === id);
        if (claim) {
          const receiptLegs = claim.legs.filter(l => l.receiptImage);
          if (receiptLegs.length > 0) {
            onViewReceipt(receiptLegs, claim.title);
          }
        }
      });
    }
  });

  const redirectBtn = document.getElementById('dashboard-to-history-btn');
  if (redirectBtn) {
    redirectBtn.addEventListener('click', () => onViewChange('history'));
  }
}

function getTransitTagEmoji(cat) {
  return TRANSIT_METRIC_CONFIG[cat]?.dotColor ? '📍' : '🚗';
}
