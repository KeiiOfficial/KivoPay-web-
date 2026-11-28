// ==========================================
// KONFIGURASI SIPUTZX API & ENDPOINTS
// ==========================================
const SIPUTZX_BASE = 'https://api.siputzx.my.id';

const ENDPOINTS = {
  ai: {
    gptoss120b: '/api/ai/gptoss120b',
    deepseekr1: '/api/ai/deepseekr1',
    metaai: '/api/ai/metaai'
  },
  downloader: {
    capcut: '/api/d/capcut',
    tiktok: '/api/d/tiktok/v2',
    tiktokFallback: '/api/d/tiktok',
    douyin: '/api/d/douyin',
    facebook: '/api/d/facebook'
  },
  stalker: {
    tiktok: '/api/stalk/tiktok',
    twitter: '/api/stalk/twitter'
  }
};

function buildSiputzUrl(path, params = {}) {
  const url = new URL(`${SIPUTZX_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      url.searchParams.set(k, v);
    }
  });
  return url.toString();
}

async function fetchJsonSafe(url, timeoutMs = 14000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json, */*' },
      signal: controller.signal
    });
    const text = await res.text();
    const json = JSON.parse(text);
    if (!res.ok) {
      throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
    }
    return json;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Koneksi ke server terlalu lama (timeout). Coba lagi.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ==========================================
// KONFIGURASI GACHA & KODE RAHASIA
// ==========================================
const PRIZES = [
  {
    id: 'boneka',
    name: 'Boneka Lucu Pilihanmu',
    emoji: '🧸',
    rarity: 'SSR',
    weight: 10,
    desc: 'YEAY! Kamu dapet hadiah boneka lucu. Tinggal pilih mau boneka apa!'
  },
  {
    id: 'tf100k',
    name: 'Transfer Uang Rp 100.000',
    emoji: '💸',
    rarity: 'SSR',
    weight: 10,
    desc: 'JACKPOT! Jajan cair Rp 100.000 langsung meluncur ke rekening / e-wallet kamu!'
  },
  {
    id: 'robux400',
    name: 'Top Up 400 Robux',
    emoji: '💎',
    rarity: 'SR',
    weight: 15,
    desc: 'Asik! Waktunya belanja avatar atau gamepass pake 400 Robux!'
  },
  {
    id: 'tf50k',
    name: 'Transfer Uang Rp 50.000',
    emoji: '💵',
    rarity: 'SR',
    weight: 20,
    desc: 'Lumayan banget! Saldo Rp 50.000 siap ditransfer buat jajan.'
  },
  {
    id: 'eskrim',
    name: 'Beli Es Krim',
    emoji: '🍦',
    rarity: 'R',
    weight: 25,
    desc: 'Waktunya ngadem! Traktiran es krim favorit buat kamu.'
  },
  {
    id: 'zonk_pap',
    name: 'ZONK! Wajib Kirim PAP ke Cowoknya',
    emoji: '📸',
    rarity: 'ZONK',
    weight: 20,
    desc: 'Yah kena ZONK! Hukumannya wajib kirim PAP ke cowokmu sekarang juga, gak boleh nolak!'
  }
];

const SECRET_CODES = {
  'SAYANGKU': 2,
  'MAUGACHA': 2,
  'CANTIK': 3,
  'ILOVEYOU': 3,
  'PAPDULU': 1
};

const PITY_LIMIT = 5;
const STORAGE_KEY = 'love_hub_state_v3';

let state = {
  tickets: 3,
  pity: 0,
  theme: 'dark',
  sound: true,
  lastDaily: null,
  usedCodes: [],
  inventory: [],
  activePage: 'gacha'
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) state = { ...state, ...saved };
  } catch (e) {
    console.warn('Gagal memuat state:', e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ==========================================
// NAVIGASI SIDEBAR (GARIS TIGA) & TEMA
// ==========================================
const sidebarDrawer = document.getElementById('sidebarDrawer');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function openSidebar() {
  sidebarDrawer.classList.add('open');
  sidebarBackdrop.classList.remove('hidden');
}

function closeSidebar() {
  sidebarDrawer.classList.remove('open');
  sidebarBackdrop.classList.add('hidden');
}

document.getElementById('menuToggleBtn').addEventListener('click', openSidebar);
document.getElementById('closeSidebarBtn').addEventListener('click', closeSidebar);
sidebarBackdrop.addEventListener('click', closeSidebar);

const PAGE_META = {
  gacha: { title: 'Love Gacha', subtitle: 'Banner Spesial Buat Sayang' },
  ai: { title: 'AI Chat & Tools', subtitle: 'gptoss120b • deepseekr1 • metaai' },
  downloader: { title: 'Media Downloader', subtitle: 'CapCut • TikTok v2 • Douyin • Facebook' },
  stalker: { title: 'Profile Stalker', subtitle: 'Cek Profil TikTok & Twitter Lengkap' }
};

function switchPage(pageId) {
  if (!PAGE_META[pageId]) return;
  state.activePage = pageId;
  saveState();

  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.toggle('hidden', sec.id !== `page-${pageId}`);
    sec.classList.toggle('active', sec.id === `page-${pageId}`);
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });

  document.getElementById('headerTitle').textContent = PAGE_META[pageId].title;
  document.getElementById('headerSubtitle').textContent = PAGE_META[pageId].subtitle;
  closeSidebar();
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  document.getElementById('soundToggle').textContent = state.sound ? '🔊' : '🔇';
}

document.getElementById('themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveState();
  applyTheme();
});

document.getElementById('soundToggle').addEventListener('click', () => {
  state.sound = !state.sound;
  saveState();
  applyTheme();
});

// ==========================================
// AUDIO SYNTHESIZER
// ==========================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playTone(freq, type = 'sine', duration = 0.12, delay = 0) {
  if (!state.sound) return;
  if (!audioCtx) audioCtx = new AudioCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration);
}

function playSpinSound() {
  for (let i = 0; i < 8; i++) {
    playTone(280 + i * 45, 'triangle', 0.08, i * 0.11);
  }
}

function playWinSound(rarity) {
  if (rarity === 'ZONK') {
    playTone(300, 'sawtooth', 0.2, 0);
    playTone(220, 'sawtooth', 0.35, 0.2);
  } else if (rarity === 'SSR') {
    [523, 659, 784, 1046].forEach((f, idx) => playTone(f, 'triangle', 0.25, idx * 0.1));
  } else {
    [440, 554, 659].forEach((f, idx) => playTone(f, 'sine', 0.2, idx * 0.1));
  }
}

// ==========================================
// LOGIKA GACHA & PITY
// ==========================================
function rollPrize() {
  state.pity += 1;
  let pool = PRIZES;

  if (state.pity >= PITY_LIMIT) {
    pool = PRIZES.filter(p => p.rarity === 'SSR');
    state.pity = 0;
  }

  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of pool) {
    if (random < item.weight) {
      if (item.rarity === 'SSR') state.pity = 0;
      return item;
    }
    random -= item.weight;
  }
  return pool[0];
}

function generateClaimCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `LOVE-${num}`;
}

const ticketCountEl = document.getElementById('ticketCount');
const pityTextEl = document.getElementById('pityText');
const pityBarEl = document.getElementById('pityBar');
const pullBtn = document.getElementById('pullBtn');
const capsuleCore = document.getElementById('capsuleCore');
const capsuleEmoji = document.getElementById('capsuleEmoji');
const inventoryListEl = document.getElementById('inventoryList');

let latestPullItem = null;
let isPulling = false;

function renderUI() {
  applyTheme();
  ticketCountEl.textContent = state.tickets;
  pityTextEl.textContent = `${state.pity} / ${PITY_LIMIT}`;
  pityBarEl.style.width = `${(state.pity / PITY_LIMIT) * 100}%`;
  pullBtn.disabled = state.tickets <= 0 || isPulling;
  pullBtn.innerHTML = state.tickets > 0
    ? `<span>🎲 Gacha Sekarang (1x)</span>`
    : `<span>🎟️ Tiket Habis (+ Dapet Tiket)</span>`;

  renderInventory();
}

function renderInventory() {
  if (!state.inventory.length) {
    inventoryListEl.innerHTML = `<div class="empty-state">Belum ada hadiah nih. Coba gacha dulu di atas! 👆</div>`;
    return;
  }

  inventoryListEl.innerHTML = state.inventory.map((entry, index) => {
    const isZonk = entry.rarity === 'ZONK';
    const badgeClass = entry.claimed ? 'done' : (isZonk ? 'punishment' : 'pending');
    const badgeLabel = entry.claimed
      ? (isZonk ? 'Sudah PAP ✅' : 'Diklaim ✅')
      : (isZonk ? 'Wajib PAP 📸' : 'Belum Diklaim');

    return `
      <div class="inv-card">
        <div class="inv-left">
          <span class="inv-emoji">${entry.emoji}</span>
          <div>
            <div class="inv-title">${entry.name}</div>
            <div class="inv-meta">${entry.code} • ${entry.time}</div>
          </div>
        </div>
        <button class="status-pill ${badgeClass}" onclick="toggleClaim(${index})" title="Klik untuk ubah status">
          ${badgeLabel}
        </button>
      </div>
    `;
  }).join('');
}

window.toggleClaim = function(index) {
  state.inventory[index].claimed = !state.inventory[index].claimed;
  saveState();
  renderInventory();
};

pullBtn.addEventListener('click', () => {
  if (state.tickets <= 0 || isPulling) return;

  isPulling = true;
  state.tickets -= 1;
  renderUI();

  capsuleCore.classList.add('shaking');
  playSpinSound();

  const emojis = ['💸', '💎', '🧸', '🍦', '📸', '💖'];
  let tick = 0;
  const shuffleInterval = setInterval(() => {
    capsuleEmoji.textContent = emojis[tick % emojis.length];
    tick++;
  }, 90);

  setTimeout(() => {
    clearInterval(shuffleInterval);
    capsuleCore.classList.remove('shaking');

    const prize = rollPrize();
    const code = generateClaimCode();
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    latestPullItem = {
      ...prize,
      code,
      time: now,
      claimed: false
    };

    state.inventory.unshift(latestPullItem);
    saveState();

    capsuleEmoji.textContent = prize.emoji;
    isPulling = false;
    renderUI();
    showResultModal(latestPullItem);
    playWinSound(prize.rarity);

    if (prize.rarity !== 'ZONK') {
      launchConfetti();
    }
  }, 1100);
});

function showResultModal(item) {
  const modal = document.getElementById('resultModal');
  const badge = document.getElementById('resultRarityBadge');
  document.getElementById('resultIcon').textContent = item.emoji;
  document.getElementById('resultTitle').textContent = item.name;
  document.getElementById('resultDesc').textContent = item.desc;
  document.getElementById('claimCode').textContent = item.code;

  const colors = {
    SSR: '#fbbf24',
    SR: '#c084fc',
    R: '#38bdf8',
    ZONK: '#f87171'
  };
  badge.textContent = item.rarity;
  badge.style.background = `${colors[item.rarity]}33`;
  badge.style.color = colors[item.rarity];

  modal.classList.remove('hidden');
}

document.getElementById('closeResultBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.add('hidden');
});

document.getElementById('copyProofBtn').addEventListener('click', () => {
  if (!latestPullItem) return;
  const text = latestPullItem.rarity === 'ZONK'
    ? `Yah aku kena ZONK di Love Gacha (${latestPullItem.code}) 😭 Siap-siap aku kirim PAP ke kamu sekarang!`
    : `Sayang! Aku dapet *${latestPullItem.name}* di Love Gacha 🎉\nKode Klaim: ${latestPullItem.code}\nDitunggu ya hadiahnya 💖`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyProofBtn');
    btn.textContent = '✅ Tersalin!';
    setTimeout(() => { btn.textContent = '📋 Salin Bukti Buat WA'; }, 1800);
  });
});

document.getElementById('toggleRatesBtn').addEventListener('click', () => {
  document.getElementById('ratesPanel').classList.toggle('hidden');
});

const questModal = document.getElementById('questModal');
document.getElementById('openQuestBtn').addEventListener('click', () => {
  questModal.classList.remove('hidden');
});
document.getElementById('closeQuestBtn').addEventListener('click', () => {
  questModal.classList.add('hidden');
});
document.getElementById('closeQuestBackdrop').addEventListener('click', () => {
  questModal.classList.add('hidden');
});

document.getElementById('dailyClaimBtn').addEventListener('click', () => {
  const today = new Date().toDateString();
  const feedback = document.getElementById('promoFeedback');
  if (state.lastDaily === today) {
    feedback.style.color = '#f87171';
    feedback.textContent = 'Tiket harian hari ini sudah diklaim! Besok lagi ya 💖';
    return;
  }
  state.lastDaily = today;
  state.tickets += 1;
  saveState();
  renderUI();
  feedback.style.color = '#34d399';
  feedback.textContent = '+1 Tiket berhasil ditambahkan! Jangan lupa bilang I Love You 😘';
});

document.getElementById('redeemBtn').addEventListener('click', () => {
  const input = document.getElementById('promoInput');
  const feedback = document.getElementById('promoFeedback');
  const code = input.value.trim().toUpperCase();

  if (!code) return;
  if (state.usedCodes.includes(code)) {
    feedback.style.color = '#f87171';
    feedback.textContent = 'Kode ini sudah pernah kamu pakai!';
    return;
  }
  if (SECRET_CODES[code]) {
    const bonus = SECRET_CODES[code];
    state.tickets += bonus;
    state.usedCodes.push(code);
    saveState();
    renderUI();
    input.value = '';
    feedback.style.color = '#34d399';
    feedback.textContent = `Yeay! Kode valid, dapet +${bonus} Tiket Gacha! 🎟️`;
  } else {
    feedback.style.color = '#f87171';
    feedback.textContent = 'Kode salah nih, coba minta kode ke cowokmu!';
  }
});

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (confirm('Reset semua tiket dan riwayat hadiah ke awal?')) {
    const currentPage = state.activePage;
    localStorage.removeItem(STORAGE_KEY);
    state = {
      tickets: 3,
      pity: 0,
      theme: state.theme,
      sound: state.sound,
      lastDaily: null,
      usedCodes: [],
      inventory: [],
      activePage: currentPage
    };
    saveState();
    renderUI();
  }
});

// ==========================================
// KATEGORI AI (MODERN CHAT + MARKDOWN FORMATTER)
// ==========================================
const chatMessagesEl = document.getElementById('chatMessages');
const aiChatForm = document.getElementById('aiChatForm');
const aiPromptInput = document.getElementById('aiPromptInput');
const aiModelSelect = document.getElementById('aiModelSelect');
const aiSystemInput = document.getElementById('aiSystemInput');
const aiTempInput = document.getElementById('aiTempInput');
const aiTempVal = document.getElementById('aiTempVal');
const aiActiveBadge = document.getElementById('aiActiveBadge');
const aiSettingsDrawer = document.getElementById('aiSettingsDrawer');

let conversationHistory = [];

document.getElementById('toggleAiSettingsBtn').addEventListener('click', () => {
  aiSettingsDrawer.classList.toggle('hidden');
});

aiTempInput.addEventListener('input', () => {
  aiTempVal.textContent = aiTempInput.value;
});

aiModelSelect.addEventListener('change', () => {
  const val = aiModelSelect.value;
  aiActiveBadge.textContent = val === 'auto' ? 'Auto Best • gptoss120b' : `Model • ${val}`;
});

document.querySelectorAll('.chip-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    aiPromptInput.value = btn.dataset.prompt;
    aiPromptInput.focus();
  });
});

document.getElementById('clearChatBtn').addEventListener('click', () => {
  conversationHistory = [];
  chatMessagesEl.innerHTML = `
    <div class="chat-row bot">
      <div class="msg-avatar">🤖</div>
      <div class="msg-content">
        <div class="chat-bubble">Riwayat chat dibersihkan ✨ Mau ngobrol atau tanya apa lagi?</div>
        <div class="chat-meta-row"><span class="chat-meta">Love Hub AI • Siap</span></div>
      </div>
    </div>
  `;
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatBotMarkdown(rawText) {
  let safe = escapeHtml(rawText);
  safe = safe.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\n/g, '<br>');
  return safe;
}

function appendChatRow(role, text, metaText = '', isLoading = false) {
  const row = document.createElement('div');
  row.className = `chat-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? '🧑' : '🤖';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';

  if (isLoading) {
    bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
  } else if (role === 'bot') {
    bubble.innerHTML = formatBotMarkdown(text);
  } else {
    bubble.textContent = text;
  }

  const metaRow = document.createElement('div');
  metaRow.className = 'chat-meta-row';

  const meta = document.createElement('span');
  meta.className = 'chat-meta';
  meta.textContent = metaText;
  metaRow.appendChild(meta);

  if (role === 'bot' && !isLoading) {
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-msg-btn';
    copyBtn.textContent = 'Salin';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Tersalin ✓';
      setTimeout(() => { copyBtn.textContent = 'Salin'; }, 1500);
    });
    metaRow.appendChild(copyBtn);
  }

  content.appendChild(bubble);
  content.appendChild(metaRow);
  row.appendChild(avatar);
  row.appendChild(content);

  chatMessagesEl.appendChild(row);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  return { bubble, meta, metaRow };
}

function extractAiReply(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  return (
    data.result ||
    data.response ||
    data.answer ||
    data.output ||
    data.content ||
    data.data?.response ||
    data.data?.result ||
    data.data?.content ||
    data.message ||
    null
  );
}

function buildContextualPrompt(userPrompt) {
  const recent = conversationHistory.slice(-6);
  if (!recent.length) return userPrompt;
  const formatted = recent
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');
  return `${formatted}\nUser: ${userPrompt}\nAssistant:`;
}

async function querySingleAiModel(modelKey, userPrompt, systemPrompt, temperature) {
  const contextualPrompt = buildContextualPrompt(userPrompt);
  let url = '';

  if (modelKey === 'gptoss120b') {
    url = buildSiputzUrl(ENDPOINTS.ai.gptoss120b, {
      prompt: contextualPrompt,
      system: systemPrompt,
      temperature
    });
  } else if (modelKey === 'deepseekr1') {
    url = buildSiputzUrl(ENDPOINTS.ai.deepseekr1, {
      prompt: contextualPrompt,
      system: systemPrompt,
      temperature
    });
  } else if (modelKey === 'metaai') {
    const combinedQuery = systemPrompt
      ? `${systemPrompt}\n\n${contextualPrompt}`
      : contextualPrompt;
    url = buildSiputzUrl(ENDPOINTS.ai.metaai, {
      query: combinedQuery
    });
  }

  const json = await fetchJsonSafe(url, 16000);
  const reply = extractAiReply(json);
  if (!reply || String(reply).trim() === '') {
    throw new Error(`Respons kosong dari ${modelKey}`);
  }
  return String(reply).trim();
}

async function runAiWithFallback(userPrompt) {
  const selected = aiModelSelect.value;
  const systemPrompt = aiSystemInput.value.trim() || 'You are a helpful assistant.';
  const temperature = aiTempInput.value || '0.7';

  const queue = selected === 'auto'
    ? ['gptoss120b', 'deepseekr1', 'metaai']
    : [selected, ...['gptoss120b', 'deepseekr1', 'metaai'].filter(m => m !== selected)];

  let lastError = null;
  for (const modelKey of queue) {
    try {
      aiActiveBadge.textContent = `Aktif • ${modelKey}`;
      const reply = await querySingleAiModel(modelKey, userPrompt, systemPrompt, temperature);
      return { reply, usedModel: modelKey };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Semua endpoint AI gagal merespons.');
}

aiChatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prompt = aiPromptInput.value.trim();
  if (!prompt) return;

  aiPromptInput.value = '';
  aiPromptInput.style.height = 'auto';
  const sendBtn = document.getElementById('aiSendBtn');
  sendBtn.disabled = true;

  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  appendChatRow('user', prompt, `Kamu • ${nowStr}`);
  conversationHistory.push({ role: 'user', text: prompt });

  const loadingObj = appendChatRow('bot', '', 'Mengetik...', true);

  try {
    const { reply, usedModel } = await runAiWithFallback(prompt);
    loadingObj.bubble.innerHTML = formatBotMarkdown(reply);
    loadingObj.meta.textContent = `${usedModel} • ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-msg-btn';
    copyBtn.textContent = 'Salin';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(reply);
      copyBtn.textContent = 'Tersalin ✓';
      setTimeout(() => { copyBtn.textContent = 'Salin'; }, 1500);
    });
    loadingObj.metaRow.appendChild(copyBtn);

    conversationHistory.push({ role: 'bot', text: reply });
  } catch (err) {
    loadingObj.bubble.textContent = `Maaf, AI sedang gangguan: ${err.message}`;
    loadingObj.meta.textContent = 'Gagal terhubung';
  } finally {
    sendBtn.disabled = false;
    aiPromptInput.focus();
  }
});

aiPromptInput.addEventListener('input', () => {
  aiPromptInput.style.height = 'auto';
  aiPromptInput.style.height = `${Math.min(aiPromptInput.scrollHeight, 110)}px`;
});

aiPromptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    aiChatForm.dispatchEvent(new Event('submit'));
  }
});

// ==========================================
// DOWNLOADER (FAST LOAD + NO-WM PRIORITY)
// ==========================================
let currentDlPlatform = 'capcut';
const dlUrlInput = document.getElementById('dlUrlInput');
const dlResultCard = document.getElementById('dlResultCard');
const dlResultBody = document.getElementById('dlResultBody');

const DL_PLACEHOLDERS = {
  capcut: 'https://www.capcut.com/tv2/ZSmm1R7Sd/',
  tiktok: 'https://vt.tiktok.com/ZSjXNEnbC/',
  douyin: 'https://www.douyin.com/video/7256984651137289483',
  facebook: 'https://www.facebook.com/share/r/1CbPCn9MQw/'
};

document.querySelectorAll('.plat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.plat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDlPlatform = btn.dataset.platform;
    dlUrlInput.placeholder = `Contoh: ${DL_PLACEHOLDERS[currentDlPlatform]}`;
  });
});

document.getElementById('pasteUrlBtn').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) dlUrlInput.value = text.trim();
  } catch {
    dlUrlInput.focus();
  }
});

document.getElementById('dlClearBtn').addEventListener('click', () => {
  dlResultCard.classList.add('hidden');
  dlResultBody.innerHTML = '';
});

function collectMediaLinks(obj, result = { videos: [], audios: [], cover: '', title: '' }) {
  if (!obj) return result;
  if (typeof obj === 'string') {
    if (obj.startsWith('http')) {
      if (obj.includes('.mp3') || obj.includes('music') || obj.includes('audio')) {
        if (!result.audios.includes(obj)) result.audios.push(obj);
      } else if (obj.includes('.mp4') || obj.includes('video') || obj.includes('play') || obj.includes('download')) {
        if (!result.videos.includes(obj)) result.videos.push(obj);
      }
    }
    return result;
  }
  if (Array.isArray(obj)) {
    obj.forEach(item => collectMediaLinks(item, result));
    return result;
  }
  if (typeof obj === 'object') {
    if (!result.title) {
      const t = obj.title || obj.desc || obj.caption || obj.name;
      if (typeof t === 'string' && t.trim()) result.title = t.trim();
    }
    if (!result.cover) {
      const c = obj.cover || obj.thumbnail || obj.origin_cover || obj.poster || obj.dynamic_cover;
      if (typeof c === 'string' && c.startsWith('http')) result.cover = c;
    }

    // Prioritaskan URL video ringan / No-Watermark terlebih dahulu agar cepat dimuat
    const priorityKeys = ['play', 'nowm', 'no_watermark', 'video_no_watermark', 'hdplay', 'wmplay', 'video', 'url', 'download'];
    for (const pk of priorityKeys) {
      for (const [k, v] of Object.entries(obj)) {
        if (k.toLowerCase().includes(pk) && typeof v === 'string' && v.startsWith('http')) {
          if (!/cover|avatar|thumb|music|audio|mp3/i.test(k) && !result.videos.includes(v)) {
            result.videos.push(v);
          }
        }
      }
    }

    Object.entries(obj).forEach(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('http')) {
        if (/music|audio|mp3/i.test(k) && !result.audios.includes(v)) {
          result.audios.push(v);
        } else if (/video|play|hd|wm|nowm|download|media/i.test(k) && !/cover|avatar|thumb/i.test(k)) {
          if (!result.videos.includes(v)) result.videos.push(v);
        }
      } else if (typeof v === 'object') {
        collectMediaLinks(v, result);
      }
    });
  }
  return result;
}

document.getElementById('downloaderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const targetUrl = dlUrlInput.value.trim();
  if (!targetUrl) return;

  const submitBtn = document.getElementById('dlSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⚡ Mengambil link tercepat...';

  dlResultCard.classList.remove('hidden');
  document.getElementById('dlResultTitle').textContent = `Memproses ${currentDlPlatform.toUpperCase()}...`;
  document.getElementById('dlResultMeta').textContent = 'Mengambil metadata video';
  dlResultBody.innerHTML = `<div class="empty-state">Sedang mengambil link video...</div>`;

  try {
    let rawData = null;
    if (currentDlPlatform === 'tiktok') {
      // Coba TikTok v2 & fallback paralel/cepat
      try {
        rawData = await fetchJsonSafe(buildSiputzUrl(ENDPOINTS.downloader.tiktok, { url: targetUrl }), 9000);
      } catch {
        rawData = await fetchJsonSafe(buildSiputzUrl(ENDPOINTS.downloader.tiktokFallback, { url: targetUrl }), 10000);
      }
    } else {
      const endpointPath = ENDPOINTS.downloader[currentDlPlatform];
      rawData = await fetchJsonSafe(buildSiputzUrl(endpointPath, { url: targetUrl }), 12000);
    }

    const media = collectMediaLinks(rawData);
    const title = media.title || `Video ${currentDlPlatform.toUpperCase()}`;

    document.getElementById('dlResultTitle').textContent = title;
    document.getElementById('dlResultMeta').textContent = `Platform: ${currentDlPlatform.toUpperCase()} • ${media.videos.length} kualitas video siap`;

    if (!media.videos.length) {
      dlResultBody.innerHTML = `
        <div class="info-box">
          Link video tidak ditemukan otomatis. Pastikan link video bersifat publik dan valid.
        </div>
      `;
    } else {
      const primaryVideo = media.videos[0];
      const videoBtns = media.videos.slice(0, 3).map((vUrl, idx) => `
        <a href="${vUrl}" target="_blank" rel="noopener noreferrer" download class="btn-primary small-btn">
          ⬇️ Download Video ${idx === 0 ? '(Cepat / No WM)' : `#${idx + 1}`}
        </a>
      `).join('');

      const audioBtn = media.audios.length
        ? `<a href="${media.audios[0]}" target="_blank" rel="noopener noreferrer" download class="btn-secondary small-btn">🎵 Download Audio</a>`
        : '';

      // Render thumbnail poster dulu agar tidak memblokir bandwidth saat tombol download sudah siap dipakai!
      dlResultBody.innerHTML = `
        <div class="video-player-box" id="videoPreviewContainer">
          ${media.cover ? `
            <div class="video-poster-overlay" id="loadVideoTrigger" title="Klik untuk memutar preview video">
              <img src="${media.cover}" alt="Thumbnail Video" />
              <div class="play-overlay-btn">▶️ Putar Preview Video</div>
            </div>
          ` : `
            <video controls playsinline preload="none" src="${primaryVideo}"></video>
          `}
        </div>
        <div class="dl-actions-grid">
          ${videoBtns}
          ${audioBtn}
          <button type="button" class="btn-secondary small-btn" id="copyDlLinkBtn">📋 Salin Link</button>
        </div>
      `;

      const trigger = document.getElementById('loadVideoTrigger');
      if (trigger) {
        trigger.addEventListener('click', () => {
          document.getElementById('videoPreviewContainer').innerHTML = `
            <video controls autoplay playsinline preload="metadata" poster="${media.cover}" src="${primaryVideo}"></video>
          `;
        });
      }

      document.getElementById('copyDlLinkBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(primaryVideo);
        const cBtn = document.getElementById('copyDlLinkBtn');
        cBtn.textContent = '✅ Tersalin!';
        setTimeout(() => { cBtn.textContent = '📋 Salin Link'; }, 1600);
      });
    }
  } catch (err) {
    document.getElementById('dlResultTitle').textContent = 'Gagal Mengambil Video';
    dlResultBody.innerHTML = `<div class="info-box">Error: ${err.message}</div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '⬇️ Ambil Video Sekarang';
  }
});

// ==========================================
// STALKER LENGKAP (DEEP OBJECT EXTRACTOR)
// ==========================================
let currentStalkPlatform = 'tiktok';
const stalkResultCard = document.getElementById('stalkResultCard');
const stalkResultBody = document.getElementById('stalkResultBody');
const stalkUsernameInput = document.getElementById('stalkUsernameInput');

document.querySelectorAll('.stalk-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stalk-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStalkPlatform = btn.dataset.stalk;
    stalkUsernameInput.placeholder = currentStalkPlatform === 'tiktok'
      ? 'Username TikTok (contoh: mrbeast)'
      : 'Username Twitter (contoh: siputzx)';
  });
});

document.getElementById('stalkClearBtn').addEventListener('click', () => {
  stalkResultCard.classList.add('hidden');
  stalkResultBody.innerHTML = '';
});

function formatCompactNum(num) {
  if (num === undefined || num === null || num === '' || Number.isNaN(Number(num))) return '-';
  const n = Number(num);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('id-ID');
}

function flattenProfileData(root) {
  const flat = {};
  function walk(node, depth = 0) {
    if (!node || typeof node !== 'object' || depth > 4) return;
    for (const [k, v] of Object.entries(node)) {
      if (v === null || v === undefined || v === '') continue;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        if (flat[k] === undefined) flat[k] = v;
      } else if (typeof v === 'object' && !Array.isArray(v)) {
        walk(v, depth + 1);
      }
    }
  }
  walk(root);
  return flat;
}

function pickFirst(flat, keys, fallback = null) {
  for (const k of keys) {
    if (flat[k] !== undefined && flat[k] !== null && String(flat[k]).trim() !== '') {
      return flat[k];
    }
  }
  return fallback;
}

function formatDateIfPossible(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const ms = val < 1e12 ? val * 1000 : val;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime()) && d.getFullYear() > 2005) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  if (typeof val === 'string' && val.length >= 8) {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime()) && d.getFullYear() > 2005) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return String(val);
}

document.getElementById('stalkerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cleanUser = stalkUsernameInput.value.trim().replace(/^@+/, '');
  if (!cleanUser) return;

  const submitBtn = document.getElementById('stalkSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳...';

  stalkResultCard.classList.remove('hidden');
  document.getElementById('stalkResultHeading').textContent = `Mencari @${cleanUser}...`;
  document.getElementById('stalkResultSub').textContent = `Platform: ${currentStalkPlatform.toUpperCase()}`;
  stalkResultBody.innerHTML = `<div class="empty-state">Mengambil detail profil lengkap...</div>`;

  try {
    const path = ENDPOINTS.stalker[currentStalkPlatform];
    const params = currentStalkPlatform === 'tiktok'
      ? { username: cleanUser }
      : { user: cleanUser };

    const apiUrl = buildSiputzUrl(path, params);
    const json = await fetchJsonSafe(apiUrl, 12000);
    const flat = flattenProfileData(json);

    const nickname = pickFirst(flat, ['nickname', 'name', 'displayName', 'full_name'], `@${cleanUser}`);
    const username = pickFirst(flat, ['uniqueId', 'username', 'screen_name', 'user_name'], cleanUser);
    const bio = pickFirst(flat, ['signature', 'bio', 'description'], 'Tidak ada bio.');
    const avatar = pickFirst(flat, ['avatarLarger', 'avatarMedium', 'avatarThumb', 'avatar', 'profile_image_url_https', 'profile_image_url'], '');
    const userId = pickFirst(flat, ['id', 'id_str', 'uid', 'userId', 'secUid']);
    const region = pickFirst(flat, ['region', 'country', 'location', 'language']);
    const verified = Boolean(pickFirst(flat, ['verified', 'is_verified', 'isVerified'], false));
    const isPrivate = Boolean(pickFirst(flat, ['privateAccount', 'isPrivate', 'protected', 'is_private'], false));
    const bioLink = pickFirst(flat, ['link', 'url', 'bioLink', 'website', 'external_url']);
    const createdAt = formatDateIfPossible(pickFirst(flat, ['createTime', 'created_at', 'create_time', 'joined']));

    const followers = pickFirst(flat, ['followerCount', 'followers_count', 'followers']);
    const following = pickFirst(flat, ['followingCount', 'friends_count', 'following']);
    const likes = pickFirst(flat, ['heartCount', 'heart', 'likes', 'favourites_count', 'diggCount']);
    const videosOrTweets = pickFirst(flat, ['videoCount', 'videos', 'statuses_count', 'tweets', 'media_count']);

    const profileUrl = currentStalkPlatform === 'tiktok'
      ? `https://www.tiktok.com/@${username}`
      : `https://x.com/${username}`;

    document.getElementById('stalkResultHeading').textContent = nickname;
    document.getElementById('stalkResultSub').textContent = `@${username} • ${currentStalkPlatform.toUpperCase()}`;

    const extraRows = [
      userId ? { label: 'User ID', value: userId } : null,
      region ? { label: 'Region / Lokasi', value: String(region).toUpperCase() } : null,
      createdAt ? { label: 'Akun Dibuat / Bergabung', value: createdAt } : null,
      { label: 'Status Akun', value: isPrivate ? '🔒 Privat' : '🌍 Publik' },
      { label: 'Centang Biru / Verified', value: verified ? '✅ Terverifikasi' : 'Tidak' },
      bioLink ? { label: 'Tautan Bio', value: bioLink } : null
    ].filter(Boolean);

    stalkResultBody.innerHTML = `
      <div class="stalk-profile-card">
        ${avatar ? `<img src="${avatar}" alt="${username}" class="stalk-avatar" />` : `<div class="stalk-avatar" style="display:grid;place-items:center;font-size:1.8rem;">👤</div>`}
        <div style="flex:1;min-width:210px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong style="font-size:1.08rem;">${escapeHtml(nickname)}</strong>
            ${verified ? `<span class="verified-badge">✓ Verified</span>` : ''}
            ${isPrivate ? `<span class="private-badge">🔒 Private</span>` : ''}
          </div>
          <div class="muted" style="margin-top:2px;">@${escapeHtml(username)}</div>
          <p style="font-size:0.86rem;margin-top:8px;line-height:1.45;">${escapeHtml(bio)}</p>
        </div>
      </div>

      <div class="stalk-stats">
        <div class="stat-box">
          <strong>${formatCompactNum(followers)}</strong>
          <span>Followers</span>
        </div>
        <div class="stat-box">
          <strong>${formatCompactNum(following)}</strong>
          <span>Following</span>
        </div>
        <div class="stat-box">
          <strong>${formatCompactNum(likes)}</strong>
          <span>${currentStalkPlatform === 'tiktok' ? 'Total Likes' : 'Likes'}</span>
        </div>
        <div class="stat-box">
          <strong>${formatCompactNum(videosOrTweets)}</strong>
          <span>${currentStalkPlatform === 'tiktok' ? 'Total Video' : 'Total Post'}</span>
        </div>
      </div>

      <div class="stalk-detail-grid">
        ${extraRows.map(r => `
          <div class="detail-kv-card">
            <span>${r.label}</span>
            <strong>${escapeHtml(String(r.value))}</strong>
          </div>
        `).join('')}
      </div>

      <div class="stalk-actions-row">
        <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary small-btn">🔗 Buka Profil Asli</a>
        <button type="button" class="btn-secondary small-btn" id="copyStalkSummaryBtn">📋 Salin Info Profil</button>
      </div>
    `;

    document.getElementById('copyStalkSummaryBtn').addEventListener('click', () => {
      const summary = [
        `Profil ${currentStalkPlatform.toUpperCase()}: ${nickname} (@${username})`,
        `Followers: ${formatCompactNum(followers)} | Following: ${formatCompactNum(following)}`,
        `Likes: ${formatCompactNum(likes)} | Post/Video: ${formatCompactNum(videosOrTweets)}`,
        userId ? `ID: ${userId}` : '',
        region ? `Region: ${region}` : '',
        `Bio: ${bio}`
      ].filter(Boolean).join('\n');

      navigator.clipboard.writeText(summary);
      const btn = document.getElementById('copyStalkSummaryBtn');
      btn.textContent = '✅ Tersalin!';
      setTimeout(() => { btn.textContent = '📋 Salin Info Profil'; }, 1600);
    });
  } catch (err) {
    document.getElementById('stalkResultHeading').textContent = 'Gagal Mengambil Profil';
    stalkResultBody.innerHTML = `<div class="info-box">Error: ${err.message}</div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '🔍 Cek Profil';
  }
});

// ==========================================
// CONFETTI & INIT
// ==========================================
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 70 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 100,
    r: 5 + Math.random() * 6,
    c: ['#ff4d8d', '#fbbf24', '#c084fc', '#38bdf8', '#34d399'][Math.floor(Math.random() * 5)],
    vy: 3 + Math.random() * 4,
    vx: -2 + Math.random() * 4
  }));

  let frames = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    frames++;
    if (frames < 95) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

loadState();
renderUI();
switchPage(state.activePage || 'gacha');
