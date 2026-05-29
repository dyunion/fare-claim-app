// SmartFare Mock Data and Sample OCR Files

// Generate a premium SVG string for Shinkansen Ticket
const createShinkansenTicketSVG = () => {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
    <rect width="600" height="340" rx="16" fill="%23f0fbf6" stroke="%23a3e635" stroke-width="3"/>
    <!-- Ticket Design -->
    <rect x="20" y="20" width="560" height="300" rx="8" fill="none" stroke="%2386efac" stroke-width="1.5" stroke-dasharray="8,4"/>
    <text x="40" y="55" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="700" fill="%23166534">新幹線指定席特急券・乗車券</text>
    <text x="500" y="55" font-family="monospace" font-size="14" font-weight="700" fill="%23166534">JR乗車券</text>
    
    <!-- Origin to Destination -->
    <text x="60" y="120" font-family="'Noto Sans JP', sans-serif" font-size="28" font-weight="800" fill="%231e293b">東京都区内</text>
    <text x="210" y="112" font-family="sans-serif" font-size="20" fill="%2364748b">➡</text>
    <text x="290" y="120" font-family="'Noto Sans JP', sans-serif" font-size="28" font-weight="800" fill="%231e293b">京都市内</text>
    
    <!-- Train Details -->
    <text x="60" y="170" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%23334155">2026年 05月20日 08:00発</text>
    <text x="60" y="195" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%23334155">のぞみ 15号 (1号車 10番 C席)</text>
    
    <!-- Price -->
    <rect x="60" y="225" width="200" height="40" rx="6" fill="%23dcfce7" stroke="%2386efac" stroke-width="1"/>
    <text x="75" y="252" font-family="'Outfit', sans-serif" font-size="20" font-weight="800" fill="%2315803d">¥ 13,910-</text>
    <text x="270" y="250" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="%2364748b">（内訳：乗車券 ¥8,360 特急券 ¥5,550）</text>
    
    <!-- Barcode mock -->
    <rect x="420" y="200" width="120" height="40" fill="none" stroke="%231e293b" stroke-width="2" stroke-dasharray="2,3,4,1,2,4,1,3,2"/>
    <text x="440" y="260" font-family="monospace" font-size="10" fill="%2364748b">1042-8829-0034</text>
    
    <path d="M 0 170 L 20 170 M 580 170 L 600 170" stroke="%2386efac" stroke-width="3"/>
  </svg>`;
};

// Generate a premium SVG string for Subway Route Search
const createSubwaySearchSVG = () => {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
    <rect width="600" height="340" rx="16" fill="%230f172a" stroke="%2338bdf8" stroke-width="2"/>
    <!-- Mock Google Maps Route Interface -->
    <rect x="20" y="20" width="560" height="50" rx="6" fill="%231e293b"/>
    <text x="40" y="50" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="700" fill="%23ffffff">ルート検索結果：新宿駅 ➡ 六本木一丁目駅</text>
    
    <!-- Time and Price -->
    <text x="40" y="110" font-family="'Noto Sans JP', sans-serif" font-size="16" font-weight="500" fill="%2394a3b8">所要時間: 18分</text>
    <text x="200" y="110" font-family="'Noto Sans JP', sans-serif" font-size="18" font-weight="800" fill="%2338bdf8">金額: ¥ 280</text>
    <text x="350" y="110" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%23e2e8f0">2026/05/25 14:30発</text>
    
    <!-- Visual Route Diagram -->
    <line x1="60" y1="180" x2="60" y2="280" stroke="%23f43f5e" stroke-width="6" stroke-linecap="round"/>
    <circle cx="60" cy="180" r="8" fill="%23ffffff" stroke="%23f43f5e" stroke-width="3"/>
    <circle cx="60" cy="280" r="8" fill="%23ffffff" stroke="%23f43f5e" stroke-width="3"/>
    
    <text x="85" y="185" font-family="'Noto Sans JP', sans-serif" font-size="16" font-weight="700" fill="%23ffffff">新宿駅</text>
    <text x="85" y="220" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%23cbd5e1">都営大江戸線（六本木・大門方面）</text>
    <text x="85" y="240" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="%2364748b">乗車 9分（4駅）</text>
    <text x="85" y="285" font-family="'Noto Sans JP', sans-serif" font-size="16" font-weight="700" fill="%23ffffff">麻布十番駅（乗換）</text>
    
    <!-- Leg 2 -->
    <line x1="320" y1="180" x2="320" y2="280" stroke="%2306b6d4" stroke-width="6" stroke-linecap="round"/>
    <circle cx="320" cy="180" r="8" fill="%23ffffff" stroke="%2306b6d4" stroke-width="3"/>
    <circle cx="320" cy="280" r="8" fill="%23ffffff" stroke="%2306b6d4" stroke-width="3"/>
    
    <text x="345" y="185" font-family="'Noto Sans JP', sans-serif" font-size="16" font-weight="700" fill="%23ffffff">麻布十番駅</text>
    <text x="345" y="220" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%23cbd5e1">東京メトロ南北線（赤羽岩淵行）</text>
    <text x="345" y="240" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="%2364748b">乗車 2分（1駅）</text>
    <text x="345" y="285" font-family="'Noto Sans JP', sans-serif" font-size="16" font-weight="700" fill="%23ffffff">六本木一丁目駅</text>
  </svg>`;
};

// Generate a premium SVG string for Flight Boarding Pass/Receipt
const createFlightReceiptSVG = () => {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
    <rect width="600" height="340" rx="16" fill="%231e1b4b" stroke="%23818cf8" stroke-width="2"/>
    
    <!-- Plane icon background -->
    <path d="M420,70 L480,180 L520,180 L490,210 L500,240 L480,240 L460,210 L400,210 L370,180 Z" fill="rgba(99, 102, 241, 0.08)" transform="scale(2) translate(-140, -10)"/>
    
    <rect x="25" y="25" width="550" height="290" rx="8" fill="none" stroke="%234f46e5" stroke-width="1.5"/>
    <text x="45" y="60" font-family="'Outfit', sans-serif" font-size="20" font-weight="800" fill="%23a5b4fc">JAPAN AIRLINES</text>
    <text x="480" y="60" font-family="'Noto Sans JP', sans-serif" font-size="12" font-weight="700" fill="%23818cf8">領収明細書</text>
    
    <!-- Flights Details -->
    <text x="50" y="115" font-family="sans-serif" font-size="12" fill="%2394a3b8">FLIGHT</text>
    <text x="50" y="145" font-family="'Outfit', sans-serif" font-size="26" font-weight="800" fill="%23ffffff">HND</text>
    <text x="50" y="170" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="%2394a3b8">東京（羽田空港）</text>
    
    <!-- Plane icon -->
    <text x="140" y="140" font-family="sans-serif" font-size="24" fill="%23818cf8">✈</text>
    
    <text x="210" y="115" font-family="sans-serif" font-size="12" fill="%2394a3b8">TO</text>
    <text x="210" y="145" font-family="'Outfit', sans-serif" font-size="26" font-weight="800" fill="%23ffffff">FUK</text>
    <text x="210" y="170" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="%2394a3b8">福岡（福岡空港）</text>
    
    <text x="360" y="115" font-family="sans-serif" font-size="11" fill="%2394a3b8">搭乗日 / DATE</text>
    <text x="360" y="135" font-family="'Outfit', sans-serif" font-size="15" font-weight="600" fill="%23ffffff">2026/05/18</text>
    
    <text x="360" y="175" font-family="sans-serif" font-size="11" fill="%2394a3b8">便名 / FLIGHT NO</text>
    <text x="360" y="195" font-family="'Outfit', sans-serif" font-size="15" font-weight="600" fill="%23ffffff">JAL 315</text>
    
    <line x1="50" y1="225" x2="550" y2="225" stroke="%234f46e5" stroke-dasharray="5,5"/>
    
    <!-- Price -->
    <text x="50" y="270" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%23cbd5e1">精算代金合計 / TOTAL FARE</text>
    <text x="50" y="295" font-family="'Outfit', sans-serif" font-size="24" font-weight="800" fill="%23a5b4fc">¥ 28,400-</text>
    
    <text x="400" y="270" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="%2394a3b8">決済方法：クレジットカード</text>
    <text x="400" y="290" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="%2394a3b8">旅客名：Y RAI 様</text>
  </svg>`;
};

// Generate a premium SVG string for Highway Toll Receipt
const createHighwayReceiptSVG = () => {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
    <rect width="600" height="340" rx="16" fill="%231e293b" stroke="%2334d399" stroke-width="2"/>
    <rect x="20" y="20" width="560" height="300" rx="8" fill="none" stroke="%23475569" stroke-width="1"/>
    
    <!-- Receipt Title -->
    <text x="210" y="55" font-family="'Noto Sans JP', sans-serif" font-size="20" font-weight="800" fill="%2334d399" letter-spacing="4">ETC料金領収書</text>
    <text x="480" y="50" font-family="'Noto Sans JP', sans-serif" font-size="11" fill="%2394a3b8">東日本高速道路</text>
    
    <!-- Main content -->
    <text x="50" y="110" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%2394a3b8">利用日時：</text>
    <text x="140" y="110" font-family="'Outfit', sans-serif" font-size="14" font-weight="600" fill="%23ffffff">2026年 05月22日 18:24</text>
    
    <text x="50" y="145" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%2394a3b8">入場ＩＣ：</text>
    <text x="140" y="145" font-family="'Noto Sans JP', sans-serif" font-size="16" font-weight="700" fill="%23ffffff">用賀IC (首都高速)</text>
    
    <text x="50" y="180" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%2394a3b8">出場ＩＣ：</text>
    <text x="140" y="180" font-family="'Noto Sans JP', sans-serif" font-size="16" font-weight="700" fill="%23ffffff">厚木IC (東名高速)</text>
    
    <text x="50" y="215" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%2394a3b8">車両区分：</text>
    <text x="140" y="215" font-family="'Noto Sans JP', sans-serif" font-size="14" fill="%23ffffff">普通車 (ETC車載器)</text>
    
    <line x1="50" y1="240" x2="550" y2="240" stroke="%23475569" stroke-width="1"/>
    
    <!-- Amount -->
    <text x="50" y="285" font-family="'Noto Sans JP', sans-serif" font-size="18" font-weight="700" fill="%2334d399">利用料金：</text>
    <text x="150" y="290" font-family="'Outfit', sans-serif" font-size="28" font-weight="800" fill="%2334d399">¥ 2,800</text>
    <text x="430" y="285" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="%2394a3b8">ETCクレジットカード決済</text>
  </svg>`;
};

// Initial state data for claims log
export const MOCK_CLAIMS = [
  {
    id: "claim-101",
    date: "2026-05-18",
    title: "福岡営業所定例監査役員訪問（福岡出張・復路）",
    category: "flight",
    amount: 28400,
    status: "approved",
    applicantName: "Y Rai",
    purpose: "",
    legs: [
      { id: "leg-101-1", type: "flight", from: "羽田空港(HND)", to: "福岡空港(FUK)", amount: 28400, remark: "JAL315便 出張", receiptImage: createFlightReceiptSVG() }
    ]
  },
  {
    id: "claim-102",
    date: "2026-05-20",
    title: "京都クライアント定例ミーティング出席（京都出張・往路）",
    category: "shinkansen",
    amount: 13910,
    status: "pending",
    applicantName: "Y Rai",
    purpose: "",
    legs: [
      { id: "leg-102-1", type: "shinkansen", from: "東京駅", to: "京都駅", amount: 13910, remark: "のぞみ 指定席", receiptImage: createShinkansenTicketSVG() }
    ]
  },
  {
    id: "claim-103",
    date: "2026-05-22",
    title: "伊勢原新規顧客向けデモンストレーション実施（神奈川クライアント訪問）",
    category: "highway",
    amount: 3260,
    status: "pending",
    applicantName: "佐藤 健二",
    purpose: "",
    legs: [
      { id: "leg-103-1", type: "subway", from: "代々木公園駅", to: "用賀駅", amount: 460, remark: "小田急線乗り継ぎ" },
      { id: "leg-103-2", type: "highway", from: "用賀IC", to: "厚木IC", amount: 2800, remark: "社用車 ETC", receiptImage: createHighwayReceiptSVG() }
    ]
  },
  {
    id: "claim-104",
    date: "2026-05-25",
    title: "六本木オフィスクライアント契約締結商談（六本木オフィス移動）",
    category: "subway",
    amount: 280,
    status: "approved",
    applicantName: "鈴木 美咲",
    purpose: "",
    legs: [
      { id: "leg-104-1", type: "subway", from: "新宿駅", to: "麻布十番駅", amount: 220, remark: "都営大江戸線" },
      { id: "leg-104-2", type: "subway", from: "麻布十番駅", to: "六本木一丁目駅", amount: 60, remark: "東京メトロ南北線" }
    ]
  }
];

// Preconfigured OCR samples with bounding box coordinates
export const MOCK_OCR_SAMPLES = [
  {
    id: "sample-shinkansen",
    name: "新幹線特急券 (東京〜京都)",
    imgUrl: createShinkansenTicketSVG(),
    ocrBoxes: [
      { text: "新幹線指定席特急券", top: "40px", left: "38px", width: "180px", height: "20px", delay: 300, isCyan: false },
      { text: "東京都区内", top: "95px", left: "55px", width: "125px", height: "34px", delay: 600, isCyan: true },
      { text: "京都市内", top: "95px", left: "285px", width: "110px", height: "34px", delay: 900, isCyan: true },
      { text: "2026年 05月20日", top: "155px", left: "55px", width: "120px", height: "20px", delay: 1200, isCyan: false },
      { text: "¥13,910-", top: "228px", left: "70px", width: "120px", height: "32px", delay: 1500, isCyan: true }
    ],
    parsedData: {
      date: "2026-05-20",
      title: "京都クライアント定例ミーティング出席（京都出張・往路）",
      category: "shinkansen",
      amount: 13910,
      applicantName: "Y Rai",
      purpose: "",
      legs: [
        { type: "shinkansen", from: "東京駅", to: "京都駅", amount: 13910, remark: "新幹線 のぞみ 指定席", receiptImage: createShinkansenTicketSVG() }
      ]
    }
  },
  {
    id: "sample-subway",
    name: "乗換案内結果 (新宿〜六本木一丁目)",
    imgUrl: createSubwaySearchSVG(),
    ocrBoxes: [
      { text: "新宿駅", top: "165px", left: "80px", width: "70px", height: "24px", delay: 300, isCyan: true },
      { text: "都営大江戸線", top: "205px", left: "80px", width: "110px", height: "20px", delay: 600, isCyan: false },
      { text: "麻布十番駅", top: "265px", left: "80px", width: "100px", height: "24px", delay: 900, isCyan: true },
      { text: "東京メトロ南北線", top: "205px", left: "340px", width: "120px", height: "20px", delay: 1200, isCyan: false },
      { text: "六本木一丁目駅", top: "265px", left: "340px", width: "140px", height: "24px", delay: 1500, isCyan: true },
      { text: "¥ 280", top: "90px", left: "245px", width: "70px", height: "24px", delay: 1800, isCyan: true }
    ],
    parsedData: {
      date: "2026-05-25",
      title: "六本木オフィスクライアント契約締結商談（六本木オフィス移動）",
      category: "subway",
      amount: 280,
      applicantName: "鈴木 美咲",
      purpose: "",
      legs: [
        { type: "subway", from: "新宿駅", to: "麻布十番駅", amount: 220, remark: "都営大江戸線" },
        { type: "subway", from: "麻布十番駅", to: "六本木一丁目駅", amount: 60, remark: "東京メトロ南北線" }
      ]
    }
  },
  {
    id: "sample-flight",
    name: "航空券領収明細 (羽田〜福岡)",
    imgUrl: createFlightReceiptSVG(),
    ocrBoxes: [
      { text: "HND", top: "118px", left: "45px", width: "80px", height: "32px", delay: 300, isCyan: true },
      { text: "FUK", top: "118px", left: "205px", width: "80px", height: "32px", delay: 600, isCyan: true },
      { text: "2026/05/18", top: "130px", left: "355px", width: "95px", height: "20px", delay: 900, isCyan: false },
      { text: "¥ 28,400-", top: "270px", left: "45px", width: "160px", height: "32px", delay: 1200, isCyan: true }
    ],
    parsedData: {
      date: "2026-05-18",
      title: "福岡営業所定例監査役員訪問（福岡出張・復路）",
      category: "flight",
      amount: 28400,
      applicantName: "Y Rai",
      purpose: "",
      legs: [
        { type: "flight", from: "羽田空港(HND)", to: "福岡空港(FUK)", amount: 28400, remark: "JAL315便", receiptImage: createFlightReceiptSVG() }
      ]
    }
  },
  {
    id: "sample-highway",
    name: "ETC料金領収書 (用賀IC〜厚木IC)",
    imgUrl: createHighwayReceiptSVG(),
    ocrBoxes: [
      { text: "用賀IC", top: "138px", left: "135px", width: "70px", height: "20px", delay: 300, isCyan: true },
      { text: "厚木IC", top: "173px", left: "135px", width: "70px", height: "20px", delay: 600, isCyan: true },
      { text: "2026年 05月22日", top: "103px", left: "135px", width: "150px", height: "20px", delay: 900, isCyan: false },
      { text: "¥ 2,800", top: "265px", left: "145px", width: "110px", height: "32px", delay: 1200, isCyan: true }
    ],
    parsedData: {
      date: "2026-05-22",
      title: "伊勢原新規顧客向けデモンストレーション実施（神奈川クライアント訪問）",
      category: "highway",
      amount: 2800,
      applicantName: "佐藤 健二",
      purpose: "",
      legs: [
        { type: "highway", from: "用賀IC", to: "厚木IC", amount: 2800, remark: "社用車 ETC", receiptImage: createHighwayReceiptSVG() }
      ]
    }
  },
  {
    id: "sample-yahoo",
    name: "Yahoo!乗換案内 (西日暮里〜広島)",
    imgUrl: "src/assets/yahoo_transit.png",
    ocrBoxes: [
      { text: "52,959円", top: "11%", left: "10%", width: "22%", height: "3%", delay: 300, isCyan: true },
      { text: "西日暮里", top: "18.5%", left: "32%", width: "26%", height: "2.5%", delay: 600, isCyan: true },
      { text: "JR山手線 209円", top: "25%", left: "82%", width: "12%", height: "2%", delay: 900, isCyan: false },
      { text: "上野", top: "35.5%", left: "32%", width: "26%", height: "2.5%", delay: 1200, isCyan: true },
      { text: "浜松町", top: "45.8%", left: "32%", width: "26%", height: "2.5%", delay: 1500, isCyan: true },
      { text: "東京モノレール 519円", top: "51.8%", left: "82%", width: "12%", height: "2%", delay: 1800, isCyan: false },
      { text: "羽田空港第１ビル", top: "58.5%", left: "32%", width: "45%", height: "2.5%", delay: 2100, isCyan: true },
      { text: "JAL 50,730円", top: "69.5%", left: "82%", width: "14%", height: "2%", delay: 2400, isCyan: false },
      { text: "広島空港", top: "73.5%", left: "32%", width: "26%", height: "2.5%", delay: 2700, isCyan: true },
      { text: "リムジンバス 1,500円", top: "80.2%", left: "82%", width: "14%", height: "2%", delay: 3000, isCyan: false },
      { text: "広島", top: "93.0%", left: "32%", width: "26%", height: "2.5%", delay: 3300, isCyan: true }
    ],
    parsedData: {
      date: "2026-05-28",
      title: "広島営業所立ち上げ監査出張（広島出張・往路）",
      category: "flight",
      amount: 52959,
      applicantName: "Y Rai",
      purpose: "",
      legs: [
        { type: "subway", from: "西日暮里駅", to: "浜松町駅", amount: 210, remark: "JR山手線・京浜東北線" },
        { type: "subway", from: "浜松町駅", to: "羽田空港第１ターミナル駅", amount: 519, remark: "東京モノレール" },
        { type: "flight", from: "羽田空港(HND)", to: "広島空港(HIJ)", amount: 50730, remark: "JAL263便", receiptImage: "src/assets/yahoo_transit.png" },
        { type: "bus", from: "広島空港", to: "広島駅新幹線口", amount: 1500, remark: "リムジンバス" }
      ]
    }
  }
];
