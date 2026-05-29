// SmartFare Claim Form Editor Component

// Supported transport modes
const TRANSPORT_TYPES = [
  { value: 'subway', label: '地下鉄・在来線', class: 'subway', icon: '🚇' },
  { value: 'shinkansen', label: '新幹線・特急', class: 'shinkansen', icon: '🚄' },
  { value: 'highway', label: '高速道路・有料道路', class: 'highway', icon: '🛣️' },
  { value: 'flight', label: '飛行機・LCC', class: 'flight', icon: '✈️' },
  { value: 'bus', label: '路線バス・高速バス', class: 'bus', icon: '🚌' },
  { value: 'taxi', label: 'タクシー', class: 'taxi', icon: '🚕' }
];

const RECEIPT_REQUIRED_CATEGORIES = ['highway', 'shinkansen', 'flight', 'taxi'];

export function initClaimForm(containerId, initialData, onSave, onCancel, showToast) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Set default initial data structure
  const formData = {
    id: initialData?.id || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    title: initialData?.title || initialData?.purpose || '',
    applicantName: initialData?.applicantName || 'Y Rai',
    isNameLocked: initialData?.isNameLocked || false,
    category: initialData?.category || 'subway',
    status: initialData?.status || 'pending',
    legs: initialData?.legs ? JSON.parse(JSON.stringify(initialData.legs)) : [
      { id: 'leg-1', type: 'subway', from: '', to: '', amount: 0, remark: '', receiptImage: null }
    ]
  };

  // Unique ID generator for new legs
  let legCounter = formData.legs.length;
  const generateLegId = () => `leg-new-${++legCounter}`;

  // Render initial template
  renderForm();

  function renderForm() {
    container.innerHTML = `
      <div class="form-card glass-card">
        <div class="form-header">
          <h3>${formData.id ? '申請情報の修正' : '交通費精算の作成'}</h3>
          <span class="badge ${formData.status === 'approved' ? 'badge-approved' : 'badge-pending'}">
            ${formData.status === 'approved' ? '承認済' : '未承認'}
          </span>
        </div>

        <form id="claim-form-element" onsubmit="return false;">
          <!-- Basic Info -->
          <div class="form-group-row" style="margin-bottom: 16px;">
            <div class="form-group">
              <label for="claim-date">利用日</label>
              <input type="date" id="claim-date" class="form-control" value="${formData.date}" required>
            </div>
            <div class="form-group">
              <label for="claim-applicant">申請者氏名</label>
              <input type="text" id="claim-applicant" class="form-control" placeholder="氏名を入力してください" value="${formData.applicantName}" required ${formData.isNameLocked ? 'disabled style="opacity: 0.7; cursor: not-allowed;"' : ''}>
            </div>
          </div>

          <div class="form-group-row" style="margin-bottom: 16px;">
            <div class="form-group">
              <label for="claim-title">目的、詳細</label>
              <input type="text" id="claim-title" class="form-control" placeholder="例: 関西出張（○○社訪問のため）" value="${formData.title}" required>
            </div>
            <div class="form-group">
              <label for="claim-category">交通費主分類</label>
              <select id="claim-category" class="form-control">
                ${TRANSPORT_TYPES.map(type => `
                  <option value="${type.value}" ${formData.category === type.value ? 'selected' : ''}>
                    ${type.icon} ${type.label}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="form-group-row" style="margin-bottom: 20px;">
            <div class="form-group">
              <label>精算区分</label>
              <div style="display: flex; gap: 20px; align-items: center; height: 100%;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: normal; color: var(--text-primary);">
                  <input type="radio" name="claim-status-radio" value="pending" ${formData.status === 'pending' ? 'checked' : ''} style="accent-color: var(--accent-purple);"> 未承認
                </label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: normal; color: var(--text-primary);">
                  <input type="radio" name="claim-status-radio" value="approved" ${formData.status === 'approved' ? 'checked' : ''} style="accent-color: var(--accent-emerald);"> 承認済
                </label>
              </div>
            </div>
          </div>

          <!-- Multi-leg Transfer Editor -->
          <div class="legs-container">
            <div class="legs-header">
              <span>🚇 利用区間・経路明細 （乗換順に入力、領収書は必要な区間ごとに添付してください）</span>
              <button type="button" id="add-leg-btn" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                乗り換え区間の追加
              </button>
            </div>
            
            <div id="legs-list-wrapper" class="legs-list">
              <!-- Leg items will be rendered dynamically here -->
            </div>

            <!-- Aggregate summary box -->
            <div class="claim-summary-box">
              <span>合計金額</span>
              <span id="claim-total-display" class="claim-total-amount">¥ 0</span>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" id="cancel-claim-btn" class="btn btn-secondary">キャンセル</button>
            <button type="submit" id="save-claim-btn" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              精算申請を保存
            </button>
          </div>
        </form>
      </div>
    `;

    // Bind core event listeners
    document.getElementById('add-leg-btn').addEventListener('click', addNewLeg);
    document.getElementById('cancel-claim-btn').addEventListener('click', onCancel);
    document.getElementById('claim-form-element').addEventListener('submit', handleFormSubmit);

    // Initial legs render
    renderLegs();
  }

  function renderLegs() {
    const wrapper = document.getElementById('legs-list-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    
    formData.legs.forEach((leg, index) => {
      const legEl = document.createElement('div');
      legEl.className = 'leg-item';
      legEl.setAttribute('data-index', index);
      legEl.setAttribute('data-id', leg.id || `leg-${index}`);

      const requiresReceipt = RECEIPT_REQUIRED_CATEGORIES.includes(leg.type);

      legEl.innerHTML = `
        <div class="leg-number">${index + 1}</div>
        
        <!-- Transport select -->
        <div>
          <select class="form-control leg-type-select" style="padding: 8px 10px; font-size: 13px;">
            ${TRANSPORT_TYPES.map(type => `
              <option value="${type.value}" ${leg.type === type.value ? 'selected' : ''}>
                ${type.icon} ${type.label.split('・')[0]}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- From -->
        <div>
          <input type="text" class="form-control leg-from-input" placeholder="出発地" value="${leg.from}" style="padding: 8px 10px; font-size: 13px;" required>
        </div>

        <!-- To -->
        <div>
          <input type="text" class="form-control leg-to-input" placeholder="到着地" value="${leg.to}" style="padding: 8px 10px; font-size: 13px;" required>
        </div>

        <!-- Price -->
        <div>
          <input type="number" class="form-control leg-amount-input" placeholder="金額 (円)" value="${leg.amount || ''}" min="0" style="padding: 8px 10px; font-size: 13px;" required>
        </div>

        <!-- Delete button -->
        <div style="text-align: center;">
          <button type="button" class="btn btn-danger btn-icon-only delete-leg-btn" ${formData.legs.length === 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>

        <!-- Sub row for Remarks/Memo & receipt image attachment -->
        <div style="grid-column: span 6; margin-top: 4px; padding-left: 50px; display: flex; gap: 12px; align-items: center;">
          <input type="text" class="form-control leg-remark-input" placeholder="特記事項・メモ（例: のぞみ片道、領収書添付など）" value="${leg.remark || ''}" style="padding: 6px 12px; font-size: 12px; flex: 1;">
          
          <!-- Receipt element -->
          <div class="leg-receipt-container" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <input type="file" class="leg-receipt-file-input" style="display: none;" accept="image/*">
            
            ${leg.receiptImage ? `
              <div style="display: flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--border-radius-sm); padding: 4px 10px; box-shadow: 0 0 8px rgba(16,185,129,0.1);">
                <span style="font-size: 11px; color: var(--accent-emerald); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;" class="leg-receipt-preview-trigger">
                  📄 領収書添付済
                </span>
                <button type="button" class="leg-receipt-delete-btn" style="background: none; border: none; color: var(--accent-rose); cursor: pointer; font-size: 12px; font-weight: 800; padding: 0 2px; line-height: 1;">✕</button>
              </div>
            ` : `
              <button type="button" class="btn btn-secondary leg-receipt-upload-btn" style="padding: 4px 10px; font-size: 11px; white-space: nowrap; ${requiresReceipt ? 'border-color: rgba(244, 63, 94, 0.4); color: #fb7185; background: rgba(244, 63, 94, 0.05); font-weight:600;' : ''}">
                📎 領収書${requiresReceipt ? ' (必須)' : '添付'}
              </button>
            `}
          </div>
        </div>
      `;

      // Attach inline input synchronization to calculate totals in real-time
      const amountInput = legEl.querySelector('.leg-amount-input');
      amountInput.addEventListener('input', (e) => {
        leg.amount = parseInt(e.target.value) || 0;
        updateTotalDisplay();
      });

      // Leg category changes: Re-render list to show/hide receipt requirement dynamically
      legEl.querySelector('.leg-type-select').addEventListener('change', (e) => {
        leg.type = e.target.value;
        renderLegs();
      });

      legEl.querySelector('.leg-from-input').addEventListener('input', (e) => {
        leg.from = e.target.value;
      });

      legEl.querySelector('.leg-to-input').addEventListener('input', (e) => {
        leg.to = e.target.value;
      });

      legEl.querySelector('.leg-remark-input').addEventListener('input', (e) => {
        leg.remark = e.target.value;
      });

      // Bind delete button
      legEl.querySelector('.delete-leg-btn').addEventListener('click', () => {
        if (formData.legs.length > 1) {
          removeLeg(index);
        }
      });

      // Bind Receipt upload actions
      const fileInput = legEl.querySelector('.leg-receipt-file-input');
      const uploadBtn = legEl.querySelector('.leg-receipt-upload-btn');
      const deleteReceiptBtn = legEl.querySelector('.leg-receipt-delete-btn');
      const previewTrigger = legEl.querySelector('.leg-receipt-preview-trigger');

      if (uploadBtn) {
        uploadBtn.addEventListener('click', () => fileInput.click());
      }

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          if (!file.type.startsWith('image/')) {
            showToast('エラー: 画像ファイルのみ対応しています', 'danger');
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            leg.receiptImage = event.target.result;
            showToast(`${index + 1}区間目の領収書を添付しました！`, 'success');
            renderLegs();
          };
          reader.readAsDataURL(file);
        }
      });

      if (deleteReceiptBtn) {
        deleteReceiptBtn.addEventListener('click', () => {
          leg.receiptImage = null;
          showToast(`${index + 1}区間目の領収書を削除しました`, 'info');
          renderLegs();
        });
      }

      if (previewTrigger) {
        previewTrigger.addEventListener('click', () => {
          showLocalPreviewModal(leg.receiptImage, `${index + 1}区間目 (${getCategoryLabel(leg.type)})`);
        });
      }

      wrapper.appendChild(legEl);
    });

    updateTotalDisplay();
  }

  function addNewLeg() {
    formData.legs.push({
      id: generateLegId(),
      type: 'subway',
      from: '',
      to: '',
      amount: 0,
      remark: '',
      receiptImage: null
    });
    renderLegs();
    showToast('乗り換え区間を追加しました', 'info');
  }

  function removeLeg(index) {
    formData.legs.splice(index, 1);
    renderLegs();
    showToast('区間を削除しました', 'info');
  }

  function updateTotalDisplay() {
    const total = formData.legs.reduce((sum, leg) => sum + (parseInt(leg.amount) || 0), 0);
    const totalDisplay = document.getElementById('claim-total-display');
    if (totalDisplay) {
      totalDisplay.textContent = `¥ ${total.toLocaleString()}`;
    }
  }

  // Local popup modal for quick receipt review
  function showLocalPreviewModal(imgSrc, title) {
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

    modal.innerHTML = `
      <div class="glass-card" style="position: relative; max-width: 90%; max-height: 80%; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
        <button id="close-local-modal-btn" class="btn btn-secondary btn-icon-only" style="position: absolute; top: 10px; right: 10px; border-radius: 50%;">✕</button>
        <h4 style="margin-right: 30px;">${title} 領収書プレビュー</h4>
        <img src="${imgSrc}" style="max-width: 100%; max-height: 380px; object-fit: contain; border-radius: 6px; border: 1px solid var(--glass-border);">
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#close-local-modal-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  function handleFormSubmit() {
    // Validate inputs
    const dateInput = document.getElementById('claim-date').value;
    const titleInput = document.getElementById('claim-title').value; // Holds 目的、詳細
    const applicantInput = document.getElementById('claim-applicant').value;
    const categorySelect = document.getElementById('claim-category').value;
    
    // Check status radio selection
    const statusRadio = document.querySelector('input[name="claim-status-radio"]:checked').value;

    if (!dateInput || !titleInput || !applicantInput) {
      showToast('必須項目を入力してください', 'danger');
      return;
    }

    // Double check validity of legs
    let hasInvalidLeg = false;
    formData.legs.forEach(leg => {
      if (!leg.from || !leg.to) {
        hasInvalidLeg = true;
      }
    });

    if (hasInvalidLeg) {
      showToast('利用区間の出発地・到着地を入力してください', 'danger');
      return;
    }

    // Receipt Validation per Leg
    let missingReceipts = [];
    formData.legs.forEach((leg, index) => {
      const isReceiptRequired = RECEIPT_REQUIRED_CATEGORIES.includes(leg.type);
      if (isReceiptRequired && !leg.receiptImage) {
        missingReceipts.push(index + 1);
      }
    });

    if (missingReceipts.length > 0) {
      const proceed = confirm(`【警告】以下の区間は領収書の添付が必要です：\n区間: ${missingReceipts.join(', ')}\n\n領収書を添付せずに精算申請を保存しますか？`);
      if (!proceed) return;
    }

    const totalAmount = formData.legs.reduce((sum, sumLeg) => sum + (parseInt(sumLeg.amount) || 0), 0);

    const savedData = {
      id: formData.id,
      date: dateInput,
      title: titleInput,
      applicantName: applicantInput,
      category: categorySelect,
      status: statusRadio,
      amount: totalAmount,
      legs: formData.legs
    };

    onSave(savedData);
  }
}

// Helper
function getCategoryLabel(cat) {
  const map = {
    shinkansen: '新幹線・特急',
    subway: '地下鉄・在来線',
    highway: '高速道路',
    flight: '飛行機',
    bus: 'バス',
    taxi: 'タクシー'
  };
  return map[cat] || cat;
}
