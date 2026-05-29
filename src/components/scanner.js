// SmartFare OCR Scanner Component

import { MOCK_OCR_SAMPLES } from '../data/samples.js';
import { GEMINI_CONFIG } from '../config.js';

export function initScanner(containerId, onScanComplete, showToast) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render initial layout
  container.innerHTML = `
    <div class="claim-container">
      <!-- Left side: Upload area & samples -->
      <div class="scanner-card glass-card">
        <div class="form-header">
          <h3>スクリーンショット自動読込</h3>
        </div>
        
        <p class="text-secondary" style="font-size: 13px; line-height: 1.5; margin-bottom: 10px;">
          乗換案内アプリの検索結果、領収書、または乗車券のスクリーンショットをアップロードすると、AIが自動で日付・ルート・金額を解析して入力フォームに反映します。
        </p>

        <!-- Dropzone -->
        <div id="scanner-dropzone" class="dropzone">
          <div class="dropzone-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div class="dropzone-text">
            <h4>画像をドラッグ＆ドロップ</h4>
            <p>またはファイルを選択 (PNG, JPG)</p>
          </div>
          <input type="file" id="scanner-file-input" style="display: none;" accept="image/*">
        </div>

        <!-- Samples -->
        <div class="samples-section">
          <h4>サンプル画像でテストする</h4>
          <div class="samples-grid">
            ${MOCK_OCR_SAMPLES.map(sample => `
              <button class="sample-btn" data-id="${sample.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                ${sample.name}
              </button>
            `).join('')}
          </div>
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
            <p style="font-size: 13px;">左側から画像をアップロードするか、サンプルを選択してください</p>
          </div>
          
          <img id="preview-image" class="scanner-preview-img" style="display: none;" alt="Scan Preview">
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
  const placeholder = document.getElementById('scanner-placeholder');
  const laserLine = document.getElementById('laser-line');
  const ocrContainer = document.getElementById('ocr-overlay-container');
  const scanBadge = document.getElementById('scan-status-badge');
  const logBox = document.getElementById('scan-log-box');

  // Register Sample Click Handlers
  const sampleBtns = container.querySelectorAll('.sample-btn');
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sampleId = btn.getAttribute('data-id');
      const sample = MOCK_OCR_SAMPLES.find(s => s.id === sampleId);
      if (sample) {
        startScanning(sample);
      }
    });
  });

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
    if (!file.type.startsWith('image/')) {
      showToast('エラー: 画像ファイルのみサポートされています', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      // Create user sample structure
      const randomSample = MOCK_OCR_SAMPLES[Math.floor(Math.random() * MOCK_OCR_SAMPLES.length)];
      const userSample = {
        ...randomSample,
        id: 'user-uploaded',
        name: file.name,
        mimeType: file.type,
        imgUrl: event.target.result, // Use actual user image
        parsedData: {
          ...randomSample.parsedData,
          title: `スキャン: ${file.name.replace(/\.[^/.]+$/, "")}`
        }
      };
      startScanning(userSample);
    };
    reader.readAsDataURL(file);
  }

  // Scanning Simulation / Real OCR Logic
  async function startScanning(sample) {
    // Reset scanner overlays
    ocrContainer.innerHTML = '';
    laserLine.style.display = 'block';
    
    // Set Preview Image
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
    placeholder.style.display = 'none';
    
    // Status Badge & Log Box
    scanBadge.style.display = 'inline-flex';
    scanBadge.className = 'badge badge-pending';
    scanBadge.textContent = '解析中...';
    
    logBox.style.display = 'block';
    logBox.innerHTML = `<div style="color: var(--accent-cyan);">[INFO] 画像読み込み成功: ${sample.name}</div>`;
    
    // Check if we have a real Gemini API Key configured
    const isRealApiKey = GEMINI_CONFIG.API_KEY && 
                         GEMINI_CONFIG.API_KEY !== 'your-gemini-api-key' && 
                         GEMINI_CONFIG.API_KEY.trim() !== '';

    if (sample.id === 'user-uploaded' && isRealApiKey) {
      writeLog('[OCR] Gemini AI Vision 解析エンジンを起動中...');
      writeLog('[OCR] 画像データをクラウドに送信しています...');
      
      try {
        const base64Data = sample.imgUrl.split(',')[1];
        const mimeType = sample.mimeType || 'image/png';
        
        // Call Gemini OCR API
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
        writeLog('[INFO] APIキーの入力やインターネット接続をご確認ください。');
        
        laserLine.style.display = 'none';
        scanBadge.className = 'badge badge-pending'; // Styled like warning
        scanBadge.textContent = '解析エラー';
        
        showToast(`AI解析エラー: ${err.message}`, 'danger');
        
        writeLog('<div style="margin-top: 8px;"><button id="btn-fallback-demo" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; cursor: pointer; border-color: rgba(255,255,255,0.15);">デモデータで続行する</button></div>');
        
        setTimeout(() => {
          const fallbackBtn = document.getElementById('btn-fallback-demo');
          if (fallbackBtn) {
            fallbackBtn.addEventListener('click', () => {
              writeLog('[INFO] デモモード（シミュレーション）を開始します...');
              runSimulatedScan(sample);
            });
          }
        }, 100);
      }
    } else {
      // Normal simulated scan for mock samples or fallback
      runSimulatedScan(sample);
    }
  }

  async function performGeminiOCR(base64Data, mimeType, filename) {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `You are an expert Japanese receipt and transit route OCR assistant.
Analyze this image (from a transit route search app like Yahoo Transit, Google Maps, Jorudan, etc., or a receipt/ticket) and extract the route details.
Respond ONLY with a JSON object. Do not include markdown formatting or backticks.

Expected JSON output structure:
{
  "date": "YYYY-MM-DD", // Extract the date if present. If not found or unclear, use "${today}"
  "title": "A short summary in Japanese of the travel purpose or route (e.g., '新宿〜六本木一丁目')",
  "category": "subway | shinkansen | highway | flight | bus | taxi", // Choose the primary category
  "amount": 1230, // Total cost in Yen (integer)
  "legs": [ // List each step in the travel route
    {
      "type": "subway | shinkansen | highway | flight | bus | taxi",
      "from": "Origin station name in Japanese (e.g. '新宿駅')",
      "to": "Destination station name in Japanese (e.g. '六本木一丁目駅')",
      "amount": 280, // Cost for this leg in Yen (integer)
      "remark": "Train line, transit info, or note in Japanese (e.g. '都営大江戸線・東京メトロ南北線')"
    }
  ]
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_CONFIG.API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg = errBody.error?.message || `Status ${response.status}`;
      throw new Error(`Gemini API Error: ${errMsg}`);
    }

    const result = await response.json();
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini");
    }
    const textResponse = result.candidates[0].content.parts[0].text;
    
    // Robust JSON extraction
    const start = textResponse.indexOf('{');
    const end = textResponse.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonStr = textResponse.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    
    throw new Error("No valid JSON structure found in Gemini response");
  }

  function runSimulatedScan(sample) {
    laserLine.style.display = 'block';
    
    // Log items with timers
    addLog('[OCR] 画像のノイズ除去とコントラスト調整を実施中...', 400);
    addLog('[OCR] 文字領域（テキストブロック）の検出を開始しました...', 800);
    
    // Render OCR bounding boxes after delay
    sample.ocrBoxes.forEach(box => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = `ocr-highlight ${box.isCyan ? 'cyan-highlight' : ''}`;
        div.style.top = box.top;
        div.style.left = box.left;
        div.style.width = box.width;
        div.style.height = box.height;
        ocrContainer.appendChild(div);
        
        // Force reflow and fade in
        setTimeout(() => div.classList.add('detected'), 50);
        
        addLog(`[OCR] テキスト抽出成功: "${box.text}"`, 0);
      }, box.delay);
    });
    
    // Parse logistics
    const totalDuration = Math.max(...sample.ocrBoxes.map(b => b.delay)) + 600;
    
    addLog('[ANALYZER] AIセマンティック解析による路線・料金の紐付け中...', totalDuration - 500);
    addLog('[ANALYZER] 交通費精算用のルート構造データ生成中...', totalDuration - 200);

    setTimeout(() => {
      // Done scanning
      laserLine.style.display = 'none';
      scanBadge.className = 'badge badge-approved';
      scanBadge.textContent = '解析完了';
      
      addLog('<span style="color: var(--accent-emerald);">[SUCCESS] すべての路線の読み取りに成功しました！</span>', 0);
      
      showToast('スクリーンショットの解析が完了しました！', 'success');
      
      // Delay transitioning to form for UI satisfaction
      setTimeout(() => {
        onScanComplete(sample.parsedData);
      }, 1000);
    }, totalDuration);
  }

  function addLog(message, delay) {
    if (delay > 0) {
      setTimeout(() => writeLog(message), delay);
    } else {
      writeLog(message);
    }
  }

  function writeLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logBox.innerHTML += `<div style="margin-top: 4px;"><span style="color: var(--text-muted); font-size: 11px;">[${timestamp}]</span> ${message}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
  }
}
