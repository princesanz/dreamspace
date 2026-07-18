// 5 karya nyata Gilang Arif Afrisda. Setiap entri = satu monolit di Stasiun 02.
// `flagship: true` → monolit lebih besar & lebih terang (posisi paling menonjol).
// `url: ''`         → panel fokus menyembunyikan tautan, menampilkan "Proyek privat".

export const PROJECTS = [
  {
    id: 'sanz-capital',
    name: 'SANZ CAPITAL — Trading PMS',
    flagship: true,
    tagline: 'Sistem manajemen portofolio full-stack multi-desk.',
    description:
      'Aplikasi PMS untuk mengelola dan menampilkan track record trading lintas desk — Forex, Crypto, Ekuitas, Komoditas. Dilengkapi live multi-asset price ticker via Vercel Edge Function, plus filter kategori track record dengan agregasi multi-tabel di Supabase.',
    tags: ['React', 'TypeScript', 'Supabase', 'Three.js', 'Vercel'],
    url: 'https://sanz-capital.vercel.app',
    tint: 'amber',
  },
  {
    id: 'sanz-quant',
    name: 'sanz-quant',
    tagline: 'Mesin riset swing trading dengan disiplin anti-overfitting.',
    description:
      'Riset sistematis untuk strategi swing trading XAUUSD/Forex pada timeframe H4–D1. Arsitektur berlapis config-driven, validasi in-sample/out-of-sample yang tegas, dan cost modeling realistis sebelum go-live. Logika sinyal & parameter bersifat proprietary.',
    tags: ['Python', 'vectorbt', 'pandas'],
    url: '',
    tint: 'cyan',
  },
  {
    id: 'sanz-brain',
    name: 'sanz-brain',
    tagline: 'Second brain yang dioperasikan banyak agen AI.',
    description:
      'Sistem knowledge management pribadi yang dijalankan oleh multi-agent AI — Claude, Hermes, OpenClaw, Cursor — terhubung ke satu vault via protokol handoff terstandardisasi. Termasuk visualizer node 3D custom dengan efek bloom dan click-to-focus.',
    tags: ['Obsidian', 'Three.js', 'WebGL', 'MCP'],
    url: '',
    tint: 'violet',
  },
  {
    id: 'news-signal-bot',
    name: 'news-signal-bot',
    tagline: 'Sinyal berita finansial otomatis, dua tahap.',
    description:
      'Pipeline monitoring berita finansial multi-sumber dengan two-stage filtering — keyword deterministik lalu enrichment LLM — dan deteksi anomali harga/volume crypto real-time via Binance WebSocket. Delivery ke bot Telegram dengan pola speed-first, enrich-after.',
    tags: ['Node.js', 'TypeScript', 'DeepSeek', 'Telegram'],
    url: '',
    tint: 'cyan',
  },
  {
    id: 'local-ai',
    name: 'Local AI Agents',
    tagline: 'Menjalankan model AI di mesin sendiri.',
    description:
      'Konfigurasi dan deployment agen AI lokal — PicoClaw dan model Qwen — di lingkungan Ubuntu/Linux, termasuk troubleshooting API key dan file konfigurasi.',
    tags: ['Linux', 'Ubuntu', 'Qwen', 'LLM'],
    url: '',
    tint: 'amber',
  },
];
