// SmartFare OCR Scanner Component

import { EDGE_FUNCTIONS, SUPABASE_CONFIG } from '../config.js';

export function initScanner(containerId, onScanComplete, showToast) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render initial layout
  container.innerHTML = `
    <div class="claim-container">
      <!-- Left side: Upload area -->
      <div class="scanner-card glass-card">
        <div class="form-header">
          <h3>スクリーンショット自動読込</h3>
        </div>
        
        <p class="text-secondary" style="font-size: 13px; line-height: 1.5; margin-bottom: 10px;">
          乗換案内アプリの検索結果、領収書、乗車券のスクリーンショット、またはPDFファイルをアップロードすると、AIが自動で日付・ルート・金額を解析して入力フォームに反映します。
        </p>

        <!-- Dropzone -->
        <div id="scanner-dropzone" class="dropzone">
          <div class="dropzone-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div class="dropzone-text">
            <h4>画像またはPDFをドラッグ＆ドロップ</h4>
            <p>またはファイルを選択 (PNG, JPG, PDF)</p>
          </div>
          <input type="file" id="scanner-file-input" style="display: none;" accept="image/*,application/pdf">
        </div>

        <!-- Skip / Manual Entry option -->
        <div style="margin-top: 20px; border-top: 1px solid var(--glass-border); padding-top: 16px; text-align: center;">
          <p class="text-secondary" style="font-size: 12px; margin-bottom: 10px; line-height: 1.4;">
            領収書・検索結果がない場合や、手動で入力したい場合はこちらから作成できます
          </p>
          <button id="skip-scan-btn" class="btn btn-secondary" style="width: 100%; justify-content: center; padding: 10px 14px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
            手動で新規申請を作成する
          </button>
        </div>
      </div>

      <!-- Right side: Preview screen with lasers & overlays -->
      <div class="glass-card" style="display: flex; flex-direction: column; gap: 20px;">
        <div class="form-header">
          <h3>スキャン解析プレビュー</h3>
          <span id="scan-status-badge" class="badge" style="display: none;">スキャン中</span>
        </div>
        
        <!-- Live Preview Container -->
        <div class="scanner-preview-wrapper" id="preview-wrapper">
          <div id="scanner-placeholder" class="text-secondary" style="text-align: center; padding: 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted" style="margin-bottom: 12px; opacity: 0.5;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p style="font-size: 13px;">左側から画像またはPDFをアップロードしてください</p>
          </div>
          
          <img id="preview-image" class="scanner-preview-img" style="display: none;" alt="Scan Preview">
          <div id="preview-pdf" class="scanner-preview-pdf" style="display: none; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 40px; text-align: center; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px dashed var(--glass-border);">
            <div class="pdf-icon-wrapper" style="font-size: 64px;">📄</div>
            <div id="pdf-filename" style="font-weight: 600; font-size: 14px; color: var(--text-primary); word-break: break-all; max-width: 80%;">document.pdf</div>
            <div style="font-size: 11px; color: var(--text-secondary);">PDFドキュメントを読み込みました</div>
          </div>
          <div id="laser-line" class="scanner-laser"></div>
          
          <!-- Bounding Boxes will be dynamically inserted here -->
          <div id="ocr-overlay-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></div>
        </div>
        
        <!-- Scan progress logs -->
        <div id="scan-log-box" class="glass-card" style="padding: 14px; font-family: monospace; font-size: 12px; height: 110px; overflow-y: auto; background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.04); display: none;">
          <div style="color: var(--accent-cyan); font-weight: bold;">[SYSTEM] 解析エンジン起動待ち...</div>
        </div>
      </div>
    </div>
  `;

  // DOM Elements
  const dropzone = document.getElementById('scanner-dropzone');
  const fileInput = document.getElementById('scanner-file-input');
  const previewWrapper = document.getElementById('preview-wrapper');
  const previewImage = document.getElementById('preview-image');
  const previewPdf = document.getElementById('preview-pdf');
  const placeholder = document.getElementById('scanner-placeholder');
  const laserLine = document.getElementById('laser-line');
  const ocrContainer = document.getElementById('ocr-overlay-container');
  const scanBadge = document.getElementById('scan-status-badge');
  const logBox = document.getElementById('scan-log-box');

  // Register Skip Scan / Manual Entry click handler
  const skipBtn = document.getElementById('skip-scan-btn');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      onScanComplete({});
    });
  }

  // Drag and Drop Listeners
  dropzone.addEventListener('click', () => fileInput.click());
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUserFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleUserFile(files[0]);
    }
  });

  function handleUserFile(file) {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      showToast('エラー: 画像またはPDFファイルのみサポートされています', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const upload = {
        id: 'user-uploaded',
        name: file.name,
        mimeType: file.type,
        isPdf: isPdf,
        imgUrl: event.target.result
      };
      startScanning(upload);
    };
    reader.readAsDataURL(file);
  }

  // Scanning Simulation / Real OCR Logic
  async function startScanning(sample) {
    // Reset scanner overlays
    ocrContainer.innerHTML = '';
    laserLine.style.display = 'block';
    
    // Set Preview
    if (sample.isPdf) {
      previewImage.style.display = 'none';
      previewPdf.style.display = 'flex';
      document.getElementById('pdf-filename').textContent = sample.name;
      previewWrapper.style.aspectRatio = '4 / 3'; // Standard PDF ratio
      previewWrapper.style.height = 'auto';
      previewWrapper.style.width = 'auto';
    } else {
      previewPdf.style.display = 'none';
      previewImage.onload = () => {
        const isVertical = previewImage.naturalHeight > previewImage.naturalWidth;
        if (isVertical) {
          previewWrapper.style.aspectRatio = 'auto';
          previewWrapper.style.height = '480px';
          previewWrapper.style.width = 'fit-content';
          previewWrapper.style.margin = '0 auto';
        } else {
          previewWrapper.style.aspectRatio = '16 / 9';
          previewWrapper.style.height = 'auto';
          previewWrapper.style.width = 'auto';
        }
      };
      previewImage.src = sample.imgUrl;
      previewImage.style.display = 'block';
    }
    placeholder.style.display = 'none';
    
    // Status Badge & Log Box
    scanBadge.style.display = 'inline-flex';
    scanBadge.className = 'badge badge-pending';
    scanBadge.textContent = '解析中...';
    
    logBox.style.display = 'block';
    logBox.innerHTML = `<div style="color: var(--accent-cyan);">[INFO] 画像読み込み成功: ${sample.name}</div>`;
    
    const isProductionOcrAvailable = SUPABASE_CONFIG.URL &&
      !SUPABASE_CONFIG.URL.includes("your-project-ref") &&
      EDGE_FUNCTIONS.GEMINI_OCR_URL;

    if (sample.id === 'user-uploaded' && isProductionOcrAvailable) {
      writeLog('[OCR] Gemini AI Vision 解析エンジンを起動中...');
      writeLog('[OCR] 画像データをクラウドに送信しています...');
      
      try {
        const base64Data = sample.imgUrl.split(',')[1];
        const mimeType = sample.mimeType || 'image/png';
        
        const parsedData = await performGeminiOCR(base64Data, mimeType, sample.name);
        
        writeLog('[OCR] AI 解析結果を受信しました。データをマッピングしています...');
        writeLog(`[INFO] ルート: ${parsedData.title}`);
        writeLog(`[INFO] 合計金額: ¥${(parsedData.amount || 0).toLocaleString()}`);
        
        // Add visual overlay covering the image
        const div = document.createElement('div');
        div.className = 'ocr-highlight cyan-highlight detected';
        div.style.top = '10%';
        div.style.left = '10%';
        div.style.width = '80%';
        div.style.height = '80%';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.background = 'rgba(6, 182, 212, 0.05)';
        div.style.border = '2px dashed var(--accent-cyan)';
        div.innerHTML = `<span style="color: var(--accent-cyan); font-weight: bold; font-size: 14px; background: rgba(0,0,0,0.8); padding: 6px 12px; border-radius: 4px;">AI解析成功: ${parsedData.title}</span>`;
        ocrContainer.appendChild(div);

        laserLine.style.display = 'none';
        scanBadge.className = 'badge badge-approved';
        scanBadge.textContent = '解析完了';
        
        writeLog('<span style="color: var(--accent-emerald);">[SUCCESS] Gemini AIによる正確な路線読み込みに成功しました！</span>');
        showToast('AIによるスクリーンショットの解析が完了しました！', 'success');
        
        setTimeout(() => {
          onScanComplete(parsedData);
        }, 1200);
        
      } catch (err) {
        console.error("Gemini OCR failed:", err);
        writeLog(`<span style="color: var(--accent-rose);">[ERROR] AI解析に失敗しました: ${err.message}</span>`);
        writeLog('[INFO] Edge Functionのデプロイ、Gemini APIキーのSecret設定、またはインターネット接続をご確認ください。');
        
        laserLine.style.display = 'none';
        scanBadge.className = 'badge badge-pending'; // Styled like warning
        scanBadge.textContent = '解析エラー';
        
        showToast(`AI解析エラー: ${err.message}`, 'danger');
        
      }
    } else {
      laserLine.style.display = 'none';
      scanBadge.className = 'badge badge-pending';
      scanBadge.textContent = '設定未完了';
      showToast('AI解析の本番接続が設定されていません', 'danger');
    }
  }

  async function performGeminiOCR(base64Data, mimeType, filename) {
    const token = localStorage.getItem('smartfare_token');
    const authToken = isSupabaseJwt(token) ? token : SUPABASE_CONFIG.ANON_KEY;
    const response = await fetch(EDGE_FUNCTIONS.GEMINI_OCR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        base64Data,
        mimeType,
        filename
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg = typeof errBody.error === 'string'
        ? errBody.error
        : errBody.error?.message || errBody.message || `Status ${response.status}`;
      throw new Error(`Gemini API Error: ${errMsg}`);
    }

    const result = await response.json();
    if (!result || !result.date || !result.title || !Array.isArray(result.legs)) {
      throw new Error("AI解析結果の形式が正しくありません。");
    }
    return result;
  }

  function isSupabaseJwt(token) {
    return typeof token === 'string' && token.split('.').length === 3;
  }

  function writeLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logBox.innerHTML += `<div style="margin-top: 4px;"><span style="color: var(--text-muted); font-size: 11px;">[${timestamp}]</span> ${message}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
  }
}
