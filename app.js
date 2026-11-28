(() => {
  'use strict';

  const API_BASE = 'https://api.siputzx.my.id';
  const AI_ENDPOINTS = [
    { id: 'gptoss120b', label: 'GPT-OSS 120B', path: '/api/ai/gptoss120b' },
    { id: 'glm47flash', label: 'GLM 4.7 Flash', path: '/api/ai/glm47flash' },
    { id: 'metaai', label: 'Meta AI', path: '/api/ai/metaai' }
  ];

  const HEADER_META = {
    downloader: { icon: '📥', title: 'Media Downloader', sub: 'Fast Load & HD No-Watermark' },
    stalker: { icon: '🕵️', title: 'Profile Stalker', sub: 'Cek Profil TikTok & Twitter' },
    ai: { icon: '🤖', title: 'AI Chat & Tools', sub: 'gptoss120b • glm47flash • metaai' },
    gacha: { icon: '🎰', title: 'Love Gacha & Match', sub: 'Spin Kartu & Cek Kecocokan' }
  };

  const GACHA_POOL = [
    { rarity: 'MYTHIC 0.5%', emoji: '👑', title: 'Soulmate Abadi', desc: 'Aura kecocokan maksimal! Komunikasi lancar dan saling mengerti tanpa banyak kata.' },
    { rarity: 'UR 4%', emoji: '💎', title: 'Cinta Tanpa Drama', desc: 'Hubungan adem, penuh kejutan manis, dan selalu saling dukung setiap hari.' },
    { rarity: 'SSR 12%', emoji: '🌹', title: 'Romantis Tingkat Dewa', desc: 'Hari ini cocok buat kirim pesan manis atau ajak jalan santai berdua.' },
    { rarity: 'SR 25%', emoji: '💌', title: 'Sinyal Positif', desc: 'Ada seseorang yang diam-diam memperhatikan unggahan dan ceritamu.' },
    { rarity: 'R 35%', emoji: '☕', title: 'Teman Ngobrol Asik', desc: 'Obrolan ringan hari ini bisa membuka kedekatan baru yang tak terduga.' },
    { rarity: 'N 23.5%', emoji: '🍀', title: 'Fokus Diri Sendiri', desc: 'Waktu terbaik untuk upgrade diri, istirahat cukup, dan nikmati me-time.' }
  ];

  // State
  let activeTab = 'downloader';
  let selectedDlPlatform = 'tiktok';
  let selectedStalkPlatform = 'tiktok';
  let currentVideoUrl = '';
  let preferredModelIndex = 0;
  let chatHistory = [];
  let gachaCollection = [];

  // DOM Helpers
  const $ = (id) => document.getElementById(id);

  function showToast(msg) {
    const toast = $('toastBox');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function formatNumber(num) {
    if (num === undefined || num === null || num === '') return '0';
    const n = Number(num);
    if (Number.isNaN(n)) return String(num);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString('id-ID');
  }

  async function fetchJsonWithTimeout(url, timeoutMs = 16000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  // Theme
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('lovehub_theme', theme);
  }

  function initTheme() {
    const saved = localStorage.getItem('lovehub_theme') || 'dark';
    applyTheme(saved);
    $('themeToggleBtn').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Drawer & Tabs
  function setDrawerOpen(open) {
    $('sidebarDrawer').classList.toggle('open', open);
    $('drawerBackdrop').classList.toggle('open', open);
  }

  function switchTab(tab) {
    if (!HEADER_META[tab]) return;
    activeTab = tab;

    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${tab}`));
    document.querySelectorAll('.tab-pill').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));

    $('headerIcon').textContent = HEADER_META[tab].icon;
    $('headerTitle').textContent = HEADER_META[tab].title;
    $('headerSubtitle').textContent = HEADER_META[tab].sub;
    setDrawerOpen(false);
  }

  function initNavigation() {
    $('openDrawerBtn').addEventListener('click', () => setDrawerOpen(true));
    $('closeDrawerBtn').addEventListener('click', () => setDrawerOpen(false));
    $('drawerBackdrop').addEventListener('click', () => setDrawerOpen(false));

    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  // 1. MEDIA DOWNLOADER
  function extractMediaUrl(payload) {
    if (!payload) return '';
    const d = payload.data || payload.result || payload;
    if (typeof d === 'string' && d.startsWith('http')) return d;

    const candidates = [
      d.nowm, d.no_watermark, d.hd, d.video_hd, d.video, d.url, d.play, d.wmplay,
      d.download_url, d.downloadUrl, d.mp4,
      Array.isArray(d.urls) ? d.urls[0] : null,
      Array.isArray(d.media) ? (d.media[0]?.url || d.media[0]) : null,
      Array.isArray(d.videos) ? (d.videos[0]?.url || d.videos[0]) : null
    ];

    for (const c of candidates) {
      if (typeof c === 'string' && c.startsWith('http')) return c;
    }

    // Deep scan first mp4/http link
    const rawStr = JSON.stringify(d);
    const mp4Match = rawStr.match(/https?:\/\/[^"\s]+\.mp4[^"\s]*/i);
    if (mp4Match) return mp4Match[0];
    return '';
  }

  function initDownloader() {
    const placeholders = {
      capcut: 'https://www.capcut.com/t/...',
      tiktok: 'https://vt.tiktok.com/...',
      douyin: 'https://v.douyin.com/...',
      facebook: 'https://www.facebook.com/watch/?v=...'
    };

    document.querySelectorAll('#dlPlatformGrid .plat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedDlPlatform = btn.dataset.platform;
        document.querySelectorAll('#dlPlatformGrid .plat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        $('dlUrlInput').placeholder = placeholders[selectedDlPlatform] || 'Tempel link video...';
      });
    });

    $('pasteDlBtn').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          $('dlUrlInput').value = text.trim();
          showToast('Link berhasil ditempel!');
        }
      } catch {
        showToast('Tempel manual di kolom link ya.');
      }
    });

    $('closeDlResultBtn').addEventListener('click', () => {
      $('dlVideoPlayer').pause();
      $('dlVideoPlayer').removeAttribute('src');
      $('dlResultCard').classList.add('hidden');
    });

    $('copyDlLinkBtn').addEventListener('click', async () => {
      if (!currentVideoUrl) return;
      try {
        await navigator.clipboard.writeText(currentVideoUrl);
        showToast('Link video langsung disalin!');
      } catch {
        showToast('Gagal menyalin link.');
      }
    });

    $('fetchVideoBtn').addEventListener('click', async () => {
      const inputUrl = $('dlUrlInput').value.trim();
      if (!inputUrl) {
        showToast('Masukkan link video terlebih dahulu!');
        return;
      }

      const btn = $('fetchVideoBtn');
      btn.disabled = true;
      btn.textContent = '⏳ Mengambil video...';

      const endpointMap = {
        capcut: [`/api/d/capcut?url=${encodeURIComponent(inputUrl)}`],
        tiktok: [
          `/api/d/tiktok/v2?url=${encodeURIComponent(inputUrl)}`,
          `/api/d/tiktok?url=${encodeURIComponent(inputUrl)}`
        ],
        douyin: [
          `/api/d/douyin?url=${encodeURIComponent(inputUrl)}`,
          `/api/d/tiktok?url=${encodeURIComponent(inputUrl)}`
        ],
        facebook: [
          `/api/d/facebook?url=${encodeURIComponent(inputUrl)}`,
          `/api/d/fb?url=${encodeURIComponent(inputUrl)}`
        ]
      };

      const routes = endpointMap[selectedDlPlatform] || endpointMap.tiktok;
      let mediaUrl = '';
      let titleText = `Video ${selectedDlPlatform.toUpperCase()}`;

      for (const route of routes) {
        try {
          const json = await fetchJsonWithTimeout(`${API_BASE}${route}`, 18000);
          mediaUrl = extractMediaUrl(json);
          const d = json?.data || json?.result || {};
          if (d.title || d.desc || d.caption) {
            titleText = String(d.title || d.desc || d.caption).slice(0, 72);
          }
          if (mediaUrl) break;
        } catch (err) {
          console.warn('Downloader fallback:', route, err.message);
        }
      }

      btn.disabled = false;
      btn.textContent = '⬇️ Ambil Video Sekarang';

      if (!mediaUrl) {
        showToast('Video gagal diambil. Cek link atau coba platform lain.');
        return;
      }

      currentVideoUrl = mediaUrl;
      $('dlResultTitle').textContent = titleText;
      $('dlResultMeta').textContent = `Platform: ${selectedDlPlatform.toUpperCase()} • 1 link video ditemukan`;
      $('dlVideoPlayer').src = mediaUrl;
      $('dlDirectBtn').href = mediaUrl;
      $('dlResultCard').classList.remove('hidden');
      showToast('Video siap diputar & diunduh!');
    });
  }

  // 2. PROFILE STALKER
  function initStalker() {
    document.querySelectorAll('#stalkPlatformGrid .plat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedStalkPlatform = btn.dataset.stalk;
        document.querySelectorAll('#stalkPlatformGrid .plat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        $('stalkUserInput').placeholder = selectedStalkPlatform === 'tiktok'
          ? 'Contoh: manzz_xy1'
          : 'Contoh: elonmusk';
      });
    });

    $('closeStalkResultBtn').addEventListener('click', () => {
      $('stalkResultCard').classList.add('hidden');
    });

    $('checkProfileBtn').addEventListener('click', async () => {
      const rawUser = $('stalkUserInput').value.trim().replace(/^@+/, '');
      if (!rawUser) {
        showToast('Masukkan username tanpa tanda @');
        return;
      }

      const btn = $('checkProfileBtn');
      btn.disabled = true;
      btn.textContent = '⏳ Mengecek...';

      const routes = selectedStalkPlatform === 'tiktok'
        ? [
            `/api/stalk/tiktok?username=${encodeURIComponent(rawUser)}`,
            `/api/stalk/tiktok?user=${encodeURIComponent(rawUser)}`
          ]
        : [
            `/api/stalk/twitter?user=${encodeURIComponent(rawUser)}`,
            `/api/stalk/twitter?username=${encodeURIComponent(rawUser)}`
          ];

      let profile = null;
      for (const route of routes) {
        try {
          const json = await fetchJsonWithTimeout(`${API_BASE}${route}`, 16000);
          const d = json?.data || json?.result || json;
          if (d && (d.user || d.username || d.nickname || d.name || d.stats)) {
            profile = d;
            break;
          }
        } catch (err) {
          console.warn('Stalker fallback:', route, err.message);
        }
      }

      btn.disabled = false;
      btn.textContent = '🔍 Cek Profil';

      if (!profile) {
        showToast('Profil tidak ditemukan atau server sedang sibuk.');
        return;
      }

      const u = profile.user || profile;
      const stats = profile.stats || profile;

      const displayName = u.nickname || u.name || u.fullName || rawUser;
      const username = u.uniqueId || u.username || u.screen_name || rawUser;
      const bio = u.signature || u.bio || u.description || 'Tidak ada bio.';
      const avatar = u.avatarLarger || u.avatarMedium || u.avatar || u.profile_image_url || 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + encodeURIComponent(username);
      const verified = Boolean(u.verified || u.isVerified);

      const followers = stats.followerCount ?? stats.followers ?? stats.followers_count ?? 0;
      const following = stats.followingCount ?? stats.following ?? stats.friends_count ?? 0;
      const thirdMetric = selectedStalkPlatform === 'tiktok'
        ? (stats.heartCount ?? stats.heart ?? stats.likes ?? 0)
        : (stats.statuses_count ?? stats.tweets ?? stats.posts ?? 0);

      $('stalkHeaderName').textContent = displayName;
      $('stalkHeaderHandle').textContent = `@${username} • ${selectedStalkPlatform.toUpperCase()}`;
      $('stalkDisplayName').textContent = displayName;
      $('stalkUsernameText').textContent = `@${username}`;
      $('stalkBio').textContent = bio;
      $('stalkAvatar').src = avatar;
      $('stalkVerified').classList.toggle('hidden', !verified);

      $('stalkFollowers').textContent = formatNumber(followers);
      $('stalkFollowing').textContent = formatNumber(following);
      $('stalkLikes').textContent = formatNumber(thirdMetric);
      $('stalkThirdLabel').textContent = selectedStalkPlatform === 'tiktok' ? 'Total Likes' : 'Total Posts';

      const extraItems = [];
      if (u.id || u.userId) extraItems.push({ label: 'User ID', val: u.id || u.userId });
      if (u.region || u.location) extraItems.push({ label: 'Lokasi / Region', val: u.region || u.location });
      if (stats.videoCount !== undefined) extraItems.push({ label: 'Total Video', val: formatNumber(stats.videoCount) });
      extraItems.push({ label: 'Status Akun', val: u.privateAccount ? 'Privat 🔒' : 'Publik 🌐' });

      $('stalkExtraMeta').innerHTML = extraItems.map((item) => `
        <div class="meta-item">
          <span>${item.label}</span>
          <strong>${item.val}</strong>
        </div>
      `).join('');

      $('stalkResultCard').classList.remove('hidden');
      showToast('Data profil berhasil dimuat!');
    });
  }

  // 3. AI CHAT WITH MULTI-ENDPOINT AUTO FALLBACK
  function renderChat() {
    const box = $('chatMessages');
    box.innerHTML = chatHistory.map((m) => `
      <div class="msg-bubble ${m.role}">
        <div>${escapeHtml(m.text)}</div>
        ${m.meta ? `<div class="msg-meta">${escapeHtml(m.meta)}</div>` : ''}
      </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function extractAiReply(json) {
    if (!json) return '';
    if (typeof json === 'string') return json.trim();
    const candidates = [
      json.data,
      json.result,
      json.response,
      json.reply,
      json.message,
      json.answer,
      json.data?.response,
      json.data?.result,
      json.data?.text,
      json.result?.response
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return '';
  }

  function getOrderedEndpoints() {
    const ordered = [];
    for (let i = 0; i < AI_ENDPOINTS.length; i++) {
      ordered.push(AI_ENDPOINTS[(preferredModelIndex + i) % AI_ENDPOINTS.length]);
    }
    return ordered;
  }

  function updateAiModelLabel() {
    const ordered = getOrderedEndpoints();
    $('aiModelIndicator').textContent = `Auto Fallback • ${ordered.map((e) => e.id).join(' → ')}`;
  }

  async function sendPromptToAi(promptText) {
    const text = promptText.trim();
    if (!text) return;

    chatHistory.push({ role: 'user', text });
    renderChat();

    const sendBtn = $('sendChatBtn');
    sendBtn.disabled = true;
    $('aiStatusText').textContent = 'Love Hub AI • Mengetik...';

    const ordered = getOrderedEndpoints();
    let replyText = '';
    let usedEndpoint = null;

    for (const ep of ordered) {
      try {
        $('aiStatusText').textContent = `Mencoba ${ep.id}...`;
        const url = `${API_BASE}${ep.path}?prompt=${encodeURIComponent(text)}`;
        const json = await fetchJsonWithTimeout(url, 18000);
        const extracted = extractAiReply(json);
        if (extracted) {
          replyText = extracted;
          usedEndpoint = ep;
          break;
        }
      } catch (err) {
        console.warn(`Endpoint ${ep.id} gagal, fallback berikutnya:`, err.message);
      }
    }

    if (!replyText) {
      replyText = 'Maaf, ketiga server AI (gptoss120b, glm47flash, metaai) sedang sibuk sesaat. Coba kirim ulang pertanyaanmu ya!';
      usedEndpoint = { id: 'offline-fallback' };
    }

    chatHistory.push({
      role: 'ai',
      text: replyText,
      meta: `via ${usedEndpoint.id}`
    });
    localStorage.setItem('lovehub_chat', JSON.stringify(chatHistory.slice(-30)));
    renderChat();

    sendBtn.disabled = false;
    $('aiStatusText').textContent = `Love Hub AI • Siap (${usedEndpoint.id})`;
  }

  function initAiChat() {
    try {
      const saved = JSON.parse(localStorage.getItem('lovehub_chat') || '[]');
      if (Array.isArray(saved) && saved.length) {
        chatHistory = saved;
      }
    } catch {
      chatHistory = [];
    }

    if (chatHistory.length === 0) {
      chatHistory.push({
        role: 'ai',
        text: 'Halo! 👋 Aku asisten AI di Love Hub. Bisa bantu cari ide, nulis caption, ngobrol santai, atau jawab apa aja. Mau tanya apa hari ini?',
        meta: 'Auto Fallback Ready'
      });
    }

    updateAiModelLabel();
    renderChat();

    $('cycleModelBtn').addEventListener('click', () => {
      preferredModelIndex = (preferredModelIndex + 1) % AI_ENDPOINTS.length;
      updateAiModelLabel();
      showToast(`Prioritas utama: ${AI_ENDPOINTS[preferredModelIndex].id}`);
    });

    $('clearChatBtn').addEventListener('click', () => {
      chatHistory = [{
        role: 'ai',
        text: 'Riwayat chat dibersihkan! Ada yang bisa kubantu sekarang? ✨',
        meta: 'Reset'
      }];
      localStorage.setItem('lovehub_chat', JSON.stringify(chatHistory));
      renderChat();
    });

    document.querySelectorAll('.chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        sendPromptToAi(chip.dataset.prompt);
      });
    });

    $('chatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('chatInput');
      const val = input.value;
      input.value = '';
      sendPromptToAi(val);
    });
  }

  // 4. LOVE GACHA & MATCH
  function rollSingleCard() {
    const r = Math.random() * 100;
    if (r < 0.5) return GACHA_POOL[0];
    if (r < 4.5) return GACHA_POOL[1];
    if (r < 16.5) return GACHA_POOL[2];
    if (r < 41.5) return GACHA_POOL[3];
    if (r < 76.5) return GACHA_POOL[4];
    return GACHA_POOL[5];
  }

  function renderGachaInventory() {
    $('gachaCount').textContent = gachaCollection.length;
    const inv = $('gachaInventory');
    if (gachaCollection.length === 0) {
      inv.innerHTML = '<p class="muted small">Belum ada kartu yang didapat. Yuk spin dulu!</p>';
      return;
    }
    inv.innerHTML = gachaCollection.slice(0, 12).map((c) => `
      <div class="inv-item">
        <span class="muted small">${c.rarity}</span>
        <strong>${c.emoji} ${escapeHtml(c.title)}</strong>
      </div>
    `).join('');
  }

  function performSpin(count = 1) {
    let latest = null;
    for (let i = 0; i < count; i++) {
      latest = rollSingleCard();
      gachaCollection.unshift(latest);
    }
    gachaCollection = gachaCollection.slice(0, 40);
    localStorage.setItem('lovehub_gacha', JSON.stringify(gachaCollection));

    const box = $('gachaCardBox');
    box.classList.remove('pop');
    void box.offsetWidth;
    box.classList.add('pop');

    $('gachaRarity').textContent = latest.rarity;
    $('gachaEmoji').textContent = latest.emoji;
    $('gachaCardTitle').textContent = latest.title;
    $('gachaCardDesc').textContent = latest.desc;

    renderGachaInventory();
    showToast(count > 1 ? `Berhasil Spin ${count}x! Dapat ${latest.title}` : `Dapat kartu: ${latest.title}!`);
  }

  function initGacha() {
    try {
      const saved = JSON.parse(localStorage.getItem('lovehub_gacha') || '[]');
      if (Array.isArray(saved)) gachaCollection = saved;
    } catch {
      gachaCollection = [];
    }
    renderGachaInventory();

    $('spinSingleBtn').addEventListener('click', () => performSpin(1));
    $('spinMultiBtn').addEventListener('click', () => performSpin(5));
    $('clearGachaBtn').addEventListener('click', () => {
      gachaCollection = [];
      localStorage.removeItem('lovehub_gacha');
      renderGachaInventory();
      showToast('Koleksi gacha direset.');
    });

    $('calcMatchBtn').addEventListener('click', () => {
      const n1 = $('nameOneInput').value.trim();
      const n2 = $('nameTwoInput').value.trim();
      if (!n1 || !n2) {
        showToast('Isi kedua nama terlebih dahulu!');
        return;
      }
      const combo = `${n1.toLowerCase()}❤️${n2.toLowerCase()}`;
      let hash = 0;
      for (let i = 0; i < combo.length; i++) {
        hash = (hash * 31 + combo.charCodeAt(i)) % 101;
      }
      const score = Math.max(48, hash);
      $('matchScoreText').textContent = `${score}%`;

      let verdict = 'Pasangan Serasi!';
      let desc = 'Kalian punya frekuensi obrolan yang nyambung dan saling melengkapi.';
      if (score >= 88) {
        verdict = 'Soulmate Tingkat Tinggi! 💖';
        desc = 'Chemistry luar biasa! Cocok banget buat jangka panjang tanpa banyak drama.';
      } else if (score >= 70) {
        verdict = 'Kombinasi Manis ✨';
        desc = 'Tinggal jaga komunikasi terbuka, hubungan kalian bakal makin solid.';
      }

      $('matchVerdictTitle').textContent = `${n1} & ${n2} — ${verdict}`;
      $('matchVerdictDesc').textContent = desc;
      $('matchResultBox').classList.remove('hidden');
    });
  }

  // Boot
  initTheme();
  initNavigation();
  initDownloader();
  initStalker();
  initAiChat();
  initGacha();
})();
