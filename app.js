// ==========================================
// KONFIGURASI HADIAH & KODE RAHASIA
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
    name: 'ZONK! Wajib Kirim PAP',
    emoji: '📸',
    rarity: 'ZONK',
    weight: 20,
    desc: 'Yah kena ZONK! Hukumannya wajib kirim PAP gemes ke cowokmu sekarang juga, gak boleh nolak!'
  }
];

// Kode rahasia yang bisa kamu kasih ke pasanganmu buat nambah tiket
const SECRET_CODES = {
  'SAYANGKU': 2,
  'MAUGACHA': 2,
  'CANTIK': 3,
  'ILOVEYOU': 3,
  'PAPDULU': 1
};

const PITY_LIMIT = 5; // Setiap 5x tarik dijamin SSR (100K atau Boneka)

// ==========================================
// STATE MANAGEMENT (LOCALSTORAGE)
// ==========================================
const STORAGE_KEY = 'love_gacha_state_v1';

let state = {
  tickets: 3,
  pity: 0,
  theme: 'dark',
  sound: true,
  lastDaily: null,
  usedCodes: [],
  inventory: []
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
// AUDIO SYNTHESIZER (TANPA FILE MP3 EKSTERNAL)
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

  // Jaminan SSR saat mencapai Pity
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

// ==========================================
// UI RENDER & INTERAKSI
// ==========================================
const ticketCountEl = document.getElementById('ticketCount');
const pityTextEl = document.getElementById('pityText');
const pityBarEl = document.getElementById('pityBar');
const pullBtn = document.getElementById('pullBtn');
const capsuleCore = document.getElementById('capsuleCore');
const capsuleEmoji = document.getElementById('capsuleEmoji');
const inventoryListEl = document.getElementById('inventoryList');

let latestPullItem = null;
let isPulling = false;

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  document.getElementById('soundToggle').textContent = state.sound ? '🔊' : '🔇';
}

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
    let badgeClass = entry.claimed ? 'done' : (isZonk ? 'punishment' : 'pending');
    let badgeLabel = entry.claimed
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
        <div class="inv-actions">
          <button class="status-pill ${badgeClass}" onclick="toggleClaim(${index})" title="Klik untuk ubah status">
            ${badgeLabel}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleClaim = function(index) {
  state.inventory[index].claimed = !state.inventory[index].claimed;
  saveState();
  renderInventory();
};

// Proses Pull Gacha
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
    ? `Yah aku kena ZONK di Love Gacha (${latestPullItem.code}) 😭 Siap-siap aku kirim PAP sekarang!`
    : `Sayang! Aku dapet *${latestPullItem.name}* di Love Gacha 🎉
Kode Klaim: ${latestPullItem.code}
Ditunggu ya hadiahnya 💖`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyProofBtn');
    btn.textContent = '✅ Tersalin!';
    setTimeout(() => { btn.textContent = '📋 Salin Bukti Buat WA'; }, 1800);
  });
});

// Toggle Rates Panel
document.getElementById('toggleRatesBtn').addEventListener('click', () => {
  document.getElementById('ratesPanel').classList.toggle('hidden');
});

// Theme & Sound Toggles
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

// Modal Tambah Tiket
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

// Klaim Harian
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

// Tukar Kode Rahasia
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

// Reset Data
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (confirm('Reset semua tiket dan riwayat hadiah ke awal?')) {
    localStorage.removeItem(STORAGE_KEY);
    state = { tickets: 3, pity: 0, theme: state.theme, sound: state.sound, lastDaily: null, usedCodes: [], inventory: [] };
    saveState();
    renderUI();
  }
});

// ==========================================
// EFEK CONFETTI SEDERHANA
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

// Init
loadState();
renderUI();
