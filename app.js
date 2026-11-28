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
    ai: { icon: '💬', title: 'AI Chat (WA Mode)', sub: 'gptoss120b • glm47flash • metaai' },
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

  let selectedDlPlatform = 'tiktok';
  let selectedStalkPlatform = 'tiktok';
  let currentVideoUrl = '';
  let preferredModelIndex = 0;
  let chatHistory = [];
  let gachaCollection = [];

  const $ = (id) => document.getElementById(id);

  function showToast(msg) {
    const toast = $('toastBox');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function getNowTime() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function formatNumber(num) {
    if (num === undefined || num === null || num === '') return '0';
    const n = Number(num);
    if (Number.isNaN(n)) return String(num);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString('id-ID');
  }

  async function fetchJsonSmart(url, timeoutMs = 18000) {
    const attempts = [
      url,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    ];

    for (const targetUrl of attempts) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(targetUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) continue;
        const text = await res.text();
        return JSON.parse(text);
      } catch (err) {
        clearTimeout(timer);
      }
    }
    throw new Error('Semua jalur koneksi gagal');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('lovehub_theme', theme);
  }

  function initTheme() {
    applyTheme(localStorage.getItem('lovehub_theme') || 'dark');
    $('themeToggleBtn').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  function setDrawerOpen(open) {
    $('sidebarDrawer').classList.toggle('open', open);
    $('drawerBackdrop').classList.toggle('open', open);
  }

  function switchTab(tab) {
    if (!HEADER_META[tab]) return;
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${tab}`));
    document.querySelectorAll('.tab-pill').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));

    $('headerIcon').textContent = HEADER_META[tab].icon;
    $('headerTitle').textContent = HEADER_META[tab].title;
    $('headerSubtitle').textContent = HEADER_META[tab].sub;
    setDrawerOpen(false);

    if (tab === 'ai') {
      const box = $('chatMessages');
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 30);
    }
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
  function collectUrls(obj, found = []) {
    if (!obj) return found;
    if (typeof obj === 'string') {
      if (obj.startsWith('http://') || obj.startsWith('https://')) found.push(obj);
      return found;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) collectUrls(item, found);
      return found;
    }
    if (typeof obj === 'object') {
      const priorityKeys = [
        'hdplay', 'play', 'nowm', 'no_watermark', 'video_hd',
        'nwm_video_url', 'video', 'url', 'download_url', 'mp4', 'wmplay'
      ];
      for (const k of priorityKeys) {
        if (obj[k]) collectUrls(obj[k], found);
      }
      for (const k of Object.keys(obj)) {
        if (!priorityKeys.includes(k)) collectUrls(obj[k], found);
      }
    }
    return found;
  }

  function pickBestVideoUrl(payload) {
    const urls = collectUrls(payload);
    const videoCandidates = urls.filter((u) => {
      const lower = u.toLowerCase();
      const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(lower);
      const isAudio = /\.(mp3|m4a|aac|wav)(\?|$)/.test(lower);
      return !isImage && !isAudio;
    });
    return videoCandidates[0] || urls[0] || '';
  }

  function showMediaPreview(videoUrl, coverUrl = '') {
    const player = $('dlVideoPlayer');
    const fallbackCard = $('coverFallbackCard');
    const coverImg = $('dlCoverImg');

    $('openTabVideoBtn').href = videoUrl;
    $('dlOpenLinkBtn').href = videoUrl;

    fallbackCard.classList.add('hidden');
    player.classList.remove('hidden');

    if (coverUrl) {
      coverImg.src = coverUrl;
      coverImg.classList.remove('hidden');
      player.poster = coverUrl;
    } else {
      coverImg.classList.add('hidden');
      player.removeAttribute('poster');
    }

    player.onerror = () => {
      player.classList.add('hidden');
      fallbackCard.classList.remove('hidden');
    };

    player.src = videoUrl;
    player.load();
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
      const player = $('dlVideoPlayer');
      player.pause();
      player.removeAttribute('src');
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

    $('dlDirectBtn').addEventListener('click', async () => {
      if (!currentVideoUrl) return;
      const btn = $('dlDirectBtn');
      btn.disabled = true;
      btn.textContent = '⏳ Menyiapkan...';
      try {
        const res = await fetch(currentVideoUrl, { referrerPolicy: 'no-referrer' });
        if (!res.ok) throw new Error('CORS');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LoveHub_${selectedDlPlatform}_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast('Download video dimulai!');
      } catch {
        window.open(currentVideoUrl, '_blank', 'noopener,noreferrer');
        showToast('Membuka video untuk disimpan...');
      } finally {
        btn.disabled = false;
        btn.textContent = '⬇️ Download Video';
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

      let mediaUrl = '';
      let coverUrl = '';
      let titleText = `Video ${selectedDlPlatform.toUpperCase()}`;

      if (selectedDlPlatform === 'tiktok' || selectedDlPlatform === 'douyin') {
        try {
          const tikwmUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(inputUrl)}&hd=1`;
          const json = await fetchJsonSmart(tikwmUrl, 16000);
          if (json && json.data) {
            mediaUrl = json.data.hdplay || json.data.play || json.data.wmplay || '';
            coverUrl = json.data.cover || json.data.origin_cover || '';
            if (json.data.title) titleText = String(json.data.title).slice(0, 72);
          }
        } catch (e) {
          console.warn('TikWM fallback to Siputzx:', e.message);
        }
      }

      if (!mediaUrl) {
        const endpointMap = {
          capcut: [`${API_BASE}/api/d/capcut?url=${encodeURIComponent(inputUrl)}`],
          tiktok: [
            `${API_BASE}/api/d/tiktok?url=${encodeURIComponent(inputUrl)}`,
            `${API_BASE}/api/d/tiktok/v2?url=${encodeURIComponent(inputUrl)}`
          ],
          douyin: [
            `${API_BASE}/api/d/douyin?url=${encodeURIComponent(inputUrl)}`,
            `${API_BASE}/api/d/tiktok?url=${encodeURIComponent(inputUrl)}`
          ],
          facebook: [
            `${API_BASE}/api/d/facebook?url=${encodeURIComponent(inputUrl)}`,
            `${API_BASE}/api/d/fb?url=${encodeURIComponent(inputUrl)}`
          ]
        };

        const routes = endpointMap[selectedDlPlatform] || endpointMap.tiktok;
        for (const fullUrl of routes) {
          try {
            const json = await fetchJsonSmart(fullUrl, 18000);
            const payload = json?.data || json?.result || json;
            mediaUrl = pickBestVideoUrl(payload);
            if (payload?.cover || payload?.thumbnail) coverUrl = payload.cover || payload.thumbnail;
            if (payload?.title || payload?.desc) titleText = String(payload.title || payload.desc).slice(0, 72);
            if (mediaUrl) break;
          } catch (err) {
            console.warn('Downloader route failed:', fullUrl);
          }
        }
      }

      btn.disabled = false;
      btn.textContent = '⬇️ Ambil Video Sekarang';

      if (!mediaUrl) {
        showToast('Video gagal diambil. Pastikan link publik & valid.');
        return;
      }

      currentVideoUrl = mediaUrl;
      $('dlResultTitle').textContent = titleText || `Video ${selectedDlPlatform.toUpperCase()}`;
      $('dlResultMeta').textContent = `Platform: ${selectedDlPlatform.toUpperCase()} • HD No-Watermark`;
      $('dlResultCard').classList.remove('hidden');
      showMediaPreview(mediaUrl, coverUrl);
      showToast('Video berhasil dimuat!');
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
            `${API_BASE}/api/stalk/tiktok?username=${encodeURIComponent(rawUser)}`,
            `${API_BASE}/api/stalk/tiktok?user=${encodeURIComponent(rawUser)}`,
            `https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(rawUser)}`
          ]
        : [
            `${API_BASE}/api/stalk/twitter?user=${encodeURIComponent(rawUser)}`,
            `${API_BASE}/api/stalk/twitter?username=${encodeURIComponent(rawUser)}`
          ];

      let profile = null;
      for (const fullUrl of routes) {
        try {
          const json = await fetchJsonSmart(fullUrl, 16000);
          const d = json?.data || json?.result || json;
          if (d && (d.user || d.username || d.uniqueId || d.nickname || d.name || d.stats)) {
            profile = d;
            break;
          }
        } catch (err) {
          console.warn('Stalker route failed:', fullUrl);
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
      const avatar = u.avatarLarger || u.avatarMedium || u.avatarThumb || u.avatar || u.profile_image_url || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}`;
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

  // 3. AI CHAT
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatWaMessageText(raw) {
    let safe = escapeHtml(raw);
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,!?])/g, '$1<em>$2</em>');
    return safe;
  }

  function renderChat() {
    const box = $('chatMessages');
    const headerPill = '<div class="wa-date-pill">Hari Ini • End-to-End AI</div>';
    const bubbles = chatHistory.map((m) => {
      const timeStr = m.time || getNowTime();
      if (m.role === 'user') {
        return `
          <div class="wa-row user">
            <div class="wa-bubble">
              <div class="wa-bubble-text">${formatWaMessageText(m.text)}</div>
              <div class="wa-bubble-footer">
                <span>${escapeHtml(timeStr)}</span>
                <span class="wa-ticks">✓✓</span>
              </div>
            </div>
          </div>
        `;
      }
      return `
        <div class="wa-row ai">
          <div class="wa-bubble">
            <div class="wa-bubble-text">${formatWaMessageText(m.text)}</div>
            <div class="wa-bubble-footer">
              <span>${escapeHtml(m.meta || 'AI')} • ${escapeHtml(timeStr)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    box.innerHTML = headerPill + bubbles;
    box.scrollTop = box.scrollHeight;
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

  function updateAiModelLabel(statusOverride = '') {
    if (statusOverride) {
      $('aiModelIndicator').textContent = statusOverride;
      return;
    }
    const ordered = getOrderedEndpoints();
    $('aiModelIndicator').textContent = `online • ${ordered.map((e) => e.id).join(' → ')}`;
  }

  async function sendPromptToAi(promptText) {
    const text = promptText.trim();
    if (!text) return;

    chatHistory.push({ role: 'user', text, time: getNowTime() });
    renderChat();

    const sendBtn = $('sendChatBtn');
    sendBtn.disabled = true;

    const ordered = getOrderedEndpoints();
    let replyText = '';
    let usedEndpoint = null;

    const fullPrompt = `Jawab lengkap, jelas, ramah, dan tidak terpotong dalam bahasa Indonesia: ${text}`;

    for (const ep of ordered) {
      try {
        updateAiModelLabel(`mengetik via ${ep.id}...`);
        const url = `${API_BASE}${ep.path}?prompt=${encodeURIComponent(fullPrompt)}`;
        const json = await fetchJsonSmart(url, 22000);
        const extracted = extractAiReply(json);
        if (extracted) {
          replyText = extracted;
          usedEndpoint = ep;
          break;
        }
      } catch (err) {
        console.warn(`Endpoint ${ep.id} gagal:`, err.message);
      }
    }

    if (!replyText) {
      replyText = 'Maaf, ketiga server AI (gptoss120b, glm47flash, metaai) sedang sibuk sesaat. Coba kirim ulang pesanmu ya!';
      usedEndpoint = { id: 'offline' };
    }

    chatHistory.push({
      role: 'ai',
      text: replyText,
      meta: usedEndpoint.id,
      time: getNowTime()
    });
    localStorage.setItem('lovehub_chat_v7', JSON.stringify(chatHistory.slice(-40)));
    renderChat();

    sendBtn.disabled = false;
    updateAiModelLabel();
  }

  function initAiChat() {
    try {
      const saved = JSON.parse(localStorage.getItem('lovehub_chat_v7') || '[]');
      if (Array.isArray(saved) && saved.length) chatHistory = saved;
    } catch {
      chatHistory = [];
    }

    if (chatHistory.length === 0) {
      chatHistory.push({
        role: 'ai',
        text: 'Halo! 👋 Aku asisten AI di Love Hub. Mau tanya apa hari ini? Bisa minta ide, caption TikTok, gombalan, atau ngobrol santai.',
        meta: 'gptoss120b',
        time: getNowTime()
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
        text: 'Obrolan dibersihkan! Silakan ketik pesan baru ✨',
        meta: 'ready',
        time: getNowTime()
      }];
      localStorage.setItem('lovehub_chat_v7', JSON.stringify(chatHistory));
      renderChat();
    });

    document.querySelectorAll('.chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => sendPromptToAi(chip.dataset.prompt));
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
    localStorage.setItem('lovehub_gacha_v7', JSON.stringify(gachaCollection));

    $('gachaRarity').textContent = latest.rarity;
    $('gachaEmoji').textContent = latest.emoji;
    $('gachaCardTitle').textContent = latest.title;
    $('gachaCardDesc').textContent = latest.desc;

    renderGachaInventory();
    showToast(count > 1 ? `Berhasil Spin ${count}x! Dapat ${latest.title}` : `Dapat kartu: ${latest.title}!`);
  }

  function initGacha() {
    try {
      const saved = JSON.parse(localStorage.getItem('lovehub_gacha_v7') || '[]');
      if (Array.isArray(saved)) gachaCollection = saved;
    } catch {
      gachaCollection = [];
    }
    renderGachaInventory();

    $('spinSingleBtn').addEventListener('click', () => performSpin(1));
    $('spinMultiBtn').addEventListener('click', () => performSpin(5));
    $('clearGachaBtn').addEventListener('click', () => {
      gachaCollection = [];
      localStorage.removeItem('lovehub_gacha_v7');
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
