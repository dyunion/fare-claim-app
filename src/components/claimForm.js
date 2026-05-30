// SmartFare Claim Form Editor Component

// Supported transport modes
const TRANSPORT_TYPES = [
  { value: 'jr', label: 'JR線', class: 'jr', icon: '🚆' },
  { value: 'subway', label: '地下鉄', class: 'subway', icon: '🚇' },
  { value: 'private_rail', label: '私鉄', class: 'private_rail', icon: '🚃' },
  { value: 'shinkansen', label: '新幹線・特急', class: 'shinkansen', icon: '🚄' },
  { value: 'bus', label: '路線バス・高速バス', class: 'bus', icon: '🚌' },
  { value: 'taxi', label: 'タクシー', class: 'taxi', icon: '🚕' },
  { value: 'private_car', label: '自家用車', class: 'private_car', icon: '🚗' },
  { value: 'rental_car', label: 'レンタカー', class: 'rental_car', icon: '🚙' },
  { value: 'highway', label: '高速道路・有料道路', class: 'highway', icon: '🛣️' },
  { value: 'flight', label: '飛行機・LCC', class: 'flight', icon: '✈️' }
];

const RECEIPT_REQUIRED_CATEGORIES = ['highway', 'shinkansen', 'flight', 'taxi', 'rental_car'];

function getStatusMeta(status) {
  const normalized = status || 'pending';
  if (normalized === 'approved') return { label: '承認済', className: 'badge-approved' };
  if (normalized === 'draft') return { label: '下書き', className: 'badge-draft' };
  return { label: '承認待ち', className: 'badge-pending' };
}

export function initClaimForm(containerId, initialData, onSave, onCancel, showToast, fuelSettings) {
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
    status: initialData?.status || 'draft',
    legs: initialData?.legs ? JSON.parse(JSON.stringify(initialData.legs)) : [
      { id: 'leg-1', type: 'subway', from: '', to: '', amount: 0, remark: '', receiptImage: null, distance: 0, fuelEfficiencyType: 'standard', fuelEfficiency: 9.6, gasPrice: 160, parkingFee: 0 }
    ]
  };

  // Unique ID generator for new legs
  let legCounter = formData.legs.length;
  const generateLegId = () => `leg-new-${++legCounter}`;

  // Render initial template
  renderForm();

  function renderForm() {
    const statusMeta = getStatusMeta(formData.status);
    const isApproved = formData.status === 'approved';
    container.innerHTML = `
      <div class="form-card glass-card">
        <div class="form-header">
          <h3>${formData.id ? '申請情報の修正' : '交通費精算の作成'}</h3>
          <span class="badge ${statusMeta.className}">
            ${statusMeta.label}
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
            ${!isApproved ? `
              <button type="button" id="draft-claim-btn" class="btn btn-secondary">
                下書き保存
              </button>
            ` : ''}
            <button type="submit" id="save-claim-btn" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              ${isApproved ? '変更を保存' : '申請する'}
            </button>
          </div>
        </form>
      </div>
    `;

    // Bind core event listeners
    document.getElementById('add-leg-btn').addEventListener('click', addNewLeg);
    document.getElementById('cancel-claim-btn').addEventListener('click', onCancel);
    document.getElementById('claim-form-element').addEventListener('submit', (event) => {
      event.preventDefault();
      handleFormSubmit(isApproved ? 'approved' : 'pending', true);
    });

    const draftBtn = document.getElementById('draft-claim-btn');
    if (draftBtn) {
      draftBtn.addEventListener('click', () => handleFormSubmit('draft', false));
    }

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
      const isCar = leg.type === 'private_car' || leg.type === 'rental_car';

      // Set default fuel config if not present
      if (isCar) {
        if (leg.distance === undefined) leg.distance = 0;
        if (leg.fuelEfficiencyType === undefined) leg.fuelEfficiencyType = 'standard';
        if (leg.fuelEfficiency === undefined) leg.fuelEfficiency = 9.6;
        if (leg.gasPrice === undefined) leg.gasPrice = 160;
        if (leg.parkingFee === undefined) leg.parkingFee = 0;
      }

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
          <input type="number" class="form-control leg-amount-input" placeholder="金額 (円)" value="${leg.amount || ''}" min="0" style="padding: 8px 10px; font-size: 13px;" required ${isCar ? 'readonly style="background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: not-allowed;"' : ''}>
        </div>

        <!-- Delete button -->
        <div style="text-align: center;">
          <button type="button" class="btn btn-danger btn-icon-only delete-leg-btn" ${formData.legs.length === 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>

        <!-- Car Cost Calculation Panel (Only shown if private_car or rental_car is selected) -->
        ${isCar ? `
        <div class="car-calculation-panel" style="grid-column: span 6; margin-top: 6px; padding: 12px; border-radius: var(--border-radius-sm); background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--glass-border); display: flex; flex-direction: column; gap: 8px;">
          <div class="car-calculation-grid" style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
            <div class="car-calculation-field" style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">距離 (往復):</span>
              <input type="number" class="form-control leg-distance-input" placeholder="km" value="${leg.distance !== undefined ? leg.distance : ''}" style="width: 70px; padding: 4px 8px; font-size: 12px;" min="0" step="any" required>
              <span style="font-size: 12px; color: var(--text-muted);">km</span>
            </div>

            <div class="car-calculation-field" style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">車種/燃費:</span>
              <select class="form-control leg-fuel-type-select" style="width: 140px; padding: 4px 8px; font-size: 12px;">
                <option value="standard" ${leg.fuelEfficiencyType === 'standard' ? 'selected' : ''}>普通 (${fuelSettings ? fuelSettings.standard : 9.6} km/L)</option>
                <option value="compact" ${leg.fuelEfficiencyType === 'compact' ? 'selected' : ''}>小型 (${fuelSettings ? fuelSettings.compact : 12.4} km/L)</option>
                <option value="kei" ${leg.fuelEfficiencyType === 'kei' ? 'selected' : ''}>軽 (${fuelSettings ? fuelSettings.kei : 15.1} km/L)</option>
                <option value="bike" ${leg.fuelEfficiencyType === 'bike' ? 'selected' : ''}>二輪 (${fuelSettings ? fuelSettings.bike : 30.0} km/L)</option>
                <option value="custom" ${leg.fuelEfficiencyType === 'custom' ? 'selected' : ''}>カスタム</option>
              </select>
            </div>

            <div class="custom-fuel-efficiency-wrapper car-calculation-field" style="display: ${leg.fuelEfficiencyType === 'custom' ? 'flex' : 'none'}; align-items: center; gap: 6px;">
              <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">燃費値:</span>
              <input type="number" class="form-control leg-fuel-input" placeholder="km/L" value="${leg.fuelEfficiency || ''}" style="width: 70px; padding: 4px 8px; font-size: 12px;" min="0.1" step="any" ${leg.fuelEfficiencyType === 'custom' ? 'required' : ''}>
              <span style="font-size: 12px; color: var(--text-muted);">km/L</span>
            </div>

            <div class="car-calculation-field" style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">単価:</span>
              <input type="number" class="form-control leg-gas-price-input" placeholder="円" value="${leg.gasPrice !== undefined ? leg.gasPrice : 160}" style="width: 70px; padding: 4px 8px; font-size: 12px;" min="0" required>
              <span style="font-size: 12px; color: var(--text-muted);">円/L</span>
            </div>

            <div class="car-calculation-field" style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap;">駐車場代:</span>
              <input type="number" class="form-control leg-parking-input" placeholder="円" value="${leg.parkingFee !== undefined ? leg.parkingFee : 0}" style="width: 80px; padding: 4px 8px; font-size: 12px;" min="0" required>
              <span style="font-size: 12px; color: var(--text-muted);">円</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 6px; margin-top: 2px;">
            <div class="leg-dist-warning" style="font-size: 11px; color: #f97316; font-weight: 600; display: ${leg.distance >= 300 ? 'block' : 'none'};">
              💡 往復300km以上：日当支給対象
            </div>
            <div style="flex-grow: 1;"></div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              ガソリン代: <span class="gas-cost-preview-label" style="font-weight: 600; color: var(--text-primary);">¥0</span>
              <span class="parking-cost-preview-label" style="display: ${leg.parkingFee > 0 ? 'inline' : 'none'};"> + 駐車場代: <span style="font-weight: 600; color: var(--text-primary);">¥${parseInt(leg.parkingFee || 0).toLocaleString()}</span></span>
              (1円未満切り上げ)
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Sub row for Remarks/Memo & receipt image attachment -->
        <div class="leg-extra-row" style="grid-column: span 6; margin-top: 4px; padding-left: 50px; display: flex; gap: 12px; align-items: center;">
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

      if (isCar) {
        const distInput = legEl.querySelector('.leg-distance-input');
        const fuelTypeSelect = legEl.querySelector('.leg-fuel-type-select');
        const fuelInput = legEl.querySelector('.leg-fuel-input');
        const customFuelWrapper = legEl.querySelector('.custom-fuel-efficiency-wrapper');
        const gasPriceInput = legEl.querySelector('.leg-gas-price-input');
        const parkingInput = legEl.querySelector('.leg-parking-input');
        const distWarning = legEl.querySelector('.leg-dist-warning');
        const gasPreview = legEl.querySelector('.gas-cost-preview-label');
        const parkingPreview = legEl.querySelector('.parking-cost-preview-label');

        const updateCarCalculation = () => {
          leg.distance = parseFloat(distInput.value) || 0;
          leg.fuelEfficiencyType = fuelTypeSelect.value;
          
          const standardEff = fuelSettings ? fuelSettings.standard : 9.6;
          const compactEff = fuelSettings ? fuelSettings.compact : 12.4;
          const keiEff = fuelSettings ? fuelSettings.kei : 15.1;
          const bikeEff = fuelSettings ? fuelSettings.bike : 30.0;

          if (leg.fuelEfficiencyType === 'custom') {
            leg.fuelEfficiency = parseFloat(fuelInput.value) || standardEff;
          } else {
            if (leg.fuelEfficiencyType === 'standard') leg.fuelEfficiency = standardEff;
            else if (leg.fuelEfficiencyType === 'compact') leg.fuelEfficiency = compactEff;
            else if (leg.fuelEfficiencyType === 'kei') leg.fuelEfficiency = keiEff;
            else if (leg.fuelEfficiencyType === 'bike') leg.fuelEfficiency = bikeEff;
          }
          
          leg.gasPrice = parseFloat(gasPriceInput.value) !== undefined ? parseFloat(gasPriceInput.value) : 160;
          leg.parkingFee = parseInt(parkingInput.value) || 0;

          const { gasCost, amount } = calculateCarCost(leg, fuelSettings);
          
          amountInput.value = amount || '';
          if (gasPreview) {
            gasPreview.textContent = `¥${gasCost.toLocaleString()}`;
          }
          if (parkingPreview) {
            parkingPreview.style.display = leg.parkingFee > 0 ? 'inline' : 'none';
            parkingPreview.innerHTML = ` + 駐車場代: <span style="font-weight: 600; color: var(--text-primary);">¥${leg.parkingFee.toLocaleString()}</span>`;
          }
          if (distWarning) {
            distWarning.style.display = leg.distance >= 300 ? 'block' : 'none';
          }
          updateTotalDisplay();
        };

        distInput.addEventListener('input', updateCarCalculation);
        gasPriceInput.addEventListener('input', updateCarCalculation);
        parkingInput.addEventListener('input', updateCarCalculation);

        fuelTypeSelect.addEventListener('change', (e) => {
          const isCustom = e.target.value === 'custom';
          customFuelWrapper.style.display = isCustom ? 'flex' : 'none';
          if (isCustom) {
            fuelInput.setAttribute('required', 'true');
            if (!fuelInput.value) fuelInput.value = (fuelSettings ? fuelSettings.standard : '9.6');
          } else {
            fuelInput.removeAttribute('required');
          }
          updateCarCalculation();
        });

        fuelInput.addEventListener('input', updateCarCalculation);

        // Run initial calculation to update preview on render
        const { gasCost } = calculateCarCost(leg, fuelSettings);
        if (gasPreview) {
          gasPreview.textContent = `¥${gasCost.toLocaleString()}`;
        }
      }

      // Leg category changes: Re-render list to show/hide receipt requirement dynamically
      legEl.querySelector('.leg-type-select').addEventListener('change', (e) => {
        leg.type = e.target.value;
        if (leg.type === 'private_car' || leg.type === 'rental_car') {
          leg.distance = leg.distance || 0;
          leg.fuelEfficiencyType = leg.fuelEfficiencyType || 'standard';
          leg.fuelEfficiency = leg.fuelEfficiency || (fuelSettings ? fuelSettings.standard : 9.6);
          leg.gasPrice = leg.gasPrice || 160;
          leg.parkingFee = leg.parkingFee || 0;
          calculateCarCost(leg, fuelSettings);
        }
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
      receiptImage: null,
      distance: 0,
      fuelEfficiencyType: 'standard',
      fuelEfficiency: 9.6,
      gasPrice: 160,
      parkingFee: 0
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

  function handleFormSubmit(targetStatus = 'pending', shouldValidateForSubmit = true) {
    // Validate inputs
    const dateInput = document.getElementById('claim-date').value;
    const titleInput = document.getElementById('claim-title').value; // Holds 目的、詳細
    const applicantInput = document.getElementById('claim-applicant').value;
    const categorySelect = document.getElementById('claim-category').value;

    if (!dateInput || !applicantInput) {
      showToast('必須項目を入力してください', 'danger');
      return;
    }

    if (shouldValidateForSubmit && !titleInput) {
      showToast('目的、詳細を入力してください', 'danger');
      return;
    }

    // Double check validity of legs
    let hasInvalidLeg = false;
    if (shouldValidateForSubmit) {
      formData.legs.forEach(leg => {
        if (!leg.from || !leg.to) {
          hasInvalidLeg = true;
        }
      });
    }

    if (hasInvalidLeg) {
      showToast('利用区間の出発地・到着地を入力してください', 'danger');
      return;
    }

    // Receipt Validation per Leg
    let missingReceipts = [];
    if (shouldValidateForSubmit) {
      formData.legs.forEach((leg, index) => {
        const isReceiptRequired = RECEIPT_REQUIRED_CATEGORIES.includes(leg.type);
        if (isReceiptRequired && !leg.receiptImage) {
          missingReceipts.push(index + 1);
        }
      });
    }

    if (missingReceipts.length > 0) {
      const proceed = confirm(`【警告】以下の区間は領収書の添付が必要です：\n区間: ${missingReceipts.join(', ')}\n\n領収書を添付せずに申請しますか？`);
      if (!proceed) return;
    }

    const totalAmount = formData.legs.reduce((sum, sumLeg) => sum + (parseInt(sumLeg.amount) || 0), 0);

    const savedData = {
      id: formData.id,
      date: dateInput,
      title: titleInput || '下書き',
      applicantName: applicantInput,
      category: categorySelect,
      status: targetStatus,
      amount: totalAmount,
      legs: formData.legs
    };

    onSave(savedData);
  }
}

// Helper
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

// Car cost calculation helper (Math.ceil for 1 yen rounding up)
function calculateCarCost(leg, fuelSettings) {
  const distance = parseFloat(leg.distance) || 0;
  const standardEff = fuelSettings ? fuelSettings.standard : 9.6;
  const compactEff = fuelSettings ? fuelSettings.compact : 12.4;
  const keiEff = fuelSettings ? fuelSettings.kei : 15.1;
  const bikeEff = fuelSettings ? fuelSettings.bike : 30.0;

  let efficiency = standardEff;
  if (leg.fuelEfficiencyType === 'standard') efficiency = standardEff;
  else if (leg.fuelEfficiencyType === 'compact') efficiency = compactEff;
  else if (leg.fuelEfficiencyType === 'kei') efficiency = keiEff;
  else if (leg.fuelEfficiencyType === 'bike') efficiency = bikeEff;
  else if (leg.fuelEfficiencyType === 'custom') efficiency = parseFloat(leg.fuelEfficiency) || standardEff;
  
  const gasPrice = parseFloat(leg.gasPrice) !== undefined ? parseFloat(leg.gasPrice) : 160;
  const parkingFee = parseInt(leg.parkingFee) || 0;

  let gasCost = 0;
  if (distance > 0 && efficiency > 0) {
    gasCost = Math.ceil((distance / efficiency) * gasPrice);
  }
  
  leg.amount = gasCost + parkingFee;
  return { gasCost, amount: leg.amount };
}
