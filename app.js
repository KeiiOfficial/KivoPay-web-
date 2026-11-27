// State & Storage Keys
const STORAGE_KEYS = {
  PROFILE: 'nexus_user_profile_v3',
  THEME: 'nexus_theme_v3',
  SYSTEM_PROMPT: 'nexus_ai_system_prompt_v3',
  FIREBASE_CFG: 'nexus_firebase_cfg_v3',
  FRIENDS: 'nexus_friends_list_v3',
  MESSAGES: 'nexus_chat_messages_v3'
};

// Siputzx Multi-AI Auto-Fallback Chain
const SIPUTZ_AI_MODELS = [
  {
    name: 'GPT-OSS 120B',
    url: 'https://api.siputzx.my.id/api/ai/gptoss120b',
    type: 'prompt_system'
  },
  {
    name: 'GLM 4.7 Flash',
    url: 'https://api.siputzx.my.id/api/ai/glm47flash',
    type: 'prompt_system'
  },
  {
    name: 'Meta AI',
    url: 'https://api.siputzx.my.id/api/ai/metaai',
    type: 'query_only'
  }
];

// Safe BroadcastChannel wrapper (prevents crash on mobile browsers / restricted WebViews)
let localBus = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    localBus = new BroadcastChannel('nexus_realtime_bus');
  }
} catch (e) {
  localBus = null;
}

// Default profile so the app NEVER freezes on a blank screen
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE));
} catch (e) {
  currentUser = null;
}

if (!currentUser) {
  currentUser = {
    id: 'user-' + Date.now(),
    name: 'Keii',
    bio: 'Eksplor NexusChat & Siputzx AI',
    interest: 'Teknologi & AI',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Keii',
    isDefault: true
  };
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(currentUser));
  } catch (e) {}
}

let activeChatId = null;
let currentFilter = 'Semua';
let searchQuery = '';
let firebaseDb = null;

// Default Siputz AI Contact + Global Community Room
const SYSTEM_CONTACTS = [
  {
    id: 'siputz-ai',
    name: 'Siputzx Multi-AI',
    bio: 'GPT-OSS 120B • GLM 4.7 Flash • Meta AI (Auto-Fallback)',
    interest: 'Teknologi & AI',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SiputzAI&backgroundColor=00a884',
    isAI: true,
    online: true
  },
  {
    id: 'global-lobby',
    name: 'Lobby Cari Teman (Global)',
    bio: 'Grup chat publik real-time untuk kenalan dengan pengguna lain!',
    interest: 'Semua',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=GlobalLobby&backgroundColor=0284c7',
    isGroup: true,
    online: true
  }
];

// Directory of People to Discover & Add
const DIRECTORY_USERS = [
  { id: 'usr-nadia', name: 'Nadia Putri', bio: 'UI/UX Designer & pecinta kopi susu gula aren', interest: 'Bisnis & Desain', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia', online: true },
  { id: 'usr-dimas', name: 'Dimas Aditya', bio: 'Push rank Valorant & Mobile Legends tiap malam', interest: 'Gaming & Esports', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dimas', online: true },
  { id: 'usr-alya', name: 'Alya Rahma', bio: 'Suka eksplor tempat makan hidden gem & traveling', interest: 'Traveling & Kuliner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alya', online: true },
  { id: 'usr-rizky', name: 'Rizky Pratama', bio: 'Fullstack dev, ngulik AI & open source', interest: 'Teknologi & AI', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rizky', online: true },
  { id: 'usr-tarisa', name: 'Tarisa Melati', bio: 'Nonton film sci-fi & dengerin playlist indie', interest: 'Musik & Film', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tarisa', online: true }
];

// Initialize App Immediately
function initApp() {
  initTheme();
  updateProfileUI();
  loadSettingsInputs();

  try {
    if (!localStorage.getItem(STORAGE_KEYS.FRIENDS)) {
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(['usr-nadia', 'usr-rizky']));
    }
  } catch (e) {}

  renderChatList();
  renderDiscoverList();
  setupEventListeners();
  loadFirebaseSDKIfNeeded();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function setupEventListeners() {
  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('setupName').value.trim();
      const bio = document.getElementById('setupBio').value.trim();
      const interest = document.getElementById('setupInterest').value;

      currentUser = {
        id: 'user-' + Date.now(),
        name,
        bio,
        interest,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
      };
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(currentUser));
      } catch (err) {}
      closeModal('authModal');
      updateProfileUI();
      showToast(`Selamat datang, ${name}!`);
      announcePresence();
    });
  }

  const msgForm = document.getElementById('messageForm');
  if (msgForm) {
    msgForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('messageInput');
      const text = input.value.trim();
      if (!text || !activeChatId) return;

      input.value = '';
      await sendMessage(activeChatId, text);
    });
  }

  if (localBus) {
    localBus.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'NEW_MESSAGE') {
        saveMessageLocally(payload.chatId, payload.message, false);
        if (activeChatId === payload.chatId) {
          renderMessages(activeChatId);
        }
        renderChatList();
      } else if (type === 'USER_JOINED' && payload.id !== currentUser?.id) {
        showToast(`${payload.name} baru saja online!`);
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.MESSAGES) {
      if (activeChatId) renderMessages(activeChatId);
      renderChatList();
    }
  });
}

function announcePresence() {
  if (!currentUser) return;
  if (localBus) {
    try { localBus.postMessage({ type: 'USER_JOINED', payload: currentUser }); } catch (e) {}
  }
  if (firebaseDb) {
    firebaseDb.ref('online_users/' + currentUser.id).set({
      ...currentUser,
      lastSeen: Date.now()
    });
  }
}

function updateProfileUI() {
  if (!currentUser) return;
  const img = document.getElementById('myAvatarImg');
  const btn = document.getElementById('myAvatarBtn');
  if (img) img.src = currentUser.avatar;
  if (btn) btn.title = `${currentUser.name} (${currentUser.interest})`;
}

// Theme Management
function initTheme() {
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark'; } catch (e) {}
  applyTheme(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(`Mode ${next === 'dark' ? 'Gelap (Dark)' : 'Terang (Light)'} aktif`);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEYS.THEME, theme); } catch (e) {}
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// Tabs & Navigation
function switchTab(tab) {
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  if (tab === 'chats') {
    document.getElementById('sidebarTitle').textContent = 'Obrolan';
    document.getElementById('chatsPanel').classList.remove('hidden');
    document.getElementById('discoverPanel').classList.add('hidden');
    renderChatList();
  } else {
    document.getElementById('sidebarTitle').textContent = 'Cari Teman';
    document.getElementById('chatsPanel').classList.add('hidden');
    document.getElementById('discoverPanel').classList.remove('hidden');
    renderDiscoverList();
  }
}

function handleSearch(val) {
  searchQuery = val.toLowerCase();
  renderChatList();
  renderDiscoverList();
}

// Friends & Contacts Helper
function getFriendIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS)) || ['usr-nadia', 'usr-rizky'];
  } catch (e) {
    return ['usr-nadia', 'usr-rizky'];
  }
}

function getAllActiveContacts() {
  const friendIds = getFriendIds();
  const addedFriends = DIRECTORY_USERS.filter(u => friendIds.includes(u.id));
  return [...SYSTEM_CONTACTS, ...addedFriends];
}

function addFriend(userId) {
  const friendIds = getFriendIds();
  if (!friendIds.includes(userId)) {
    friendIds.push(userId);
    try { localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friendIds)); } catch (e) {}
    const user = DIRECTORY_USERS.find(u => u.id === userId);
    if (user) showToast(`${user.name} ditambahkan ke daftar teman!`);
    renderDiscoverList();
    switchTab('chats');
    selectChat(userId);
  }
}

// Render Chat Sidebar
function renderChatList() {
  const listEl = document.getElementById('chatList');
  if (!listEl) return;

  const contacts = getAllActiveContacts().filter(c =>
    c.name.toLowerCase().includes(searchQuery) || c.bio.toLowerCase().includes(searchQuery)
  );
  const allMessages = getAllMessages();

  listEl.innerHTML = contacts.map(contact => {
    const msgs = allMessages[contact.id] || [];
    const lastMsg = msgs[msgs.length - 1];
    const preview = lastMsg ? lastMsg.text : contact.bio;
    const time = lastMsg ? lastMsg.time : '';
    const isActive = activeChatId === contact.id ? 'active' : '';

    return `
      <div class="chat-item ${isActive}" onclick="selectChat('${contact.id}')">
        <div class="avatar-wrap">
          <img src="${contact.avatar}" alt="${contact.name}" />
          <span class="status-dot ${contact.online ? 'online' : ''}"></span>
        </div>
        <div class="chat-item-info">
          <div class="chat-item-top">
            <span class="chat-item-name">
              ${contact.name}
              ${contact.isAI ? '<span class="ai-tag">AI</span>' : ''}
            </span>
            <span class="chat-item-time">${time}</span>
          </div>
          <div class="chat-item-preview">${escapeHtml(preview)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Discover Friends
function renderDiscoverList() {
  const listEl = document.getElementById('discoverList');
  if (!listEl) return;

  const friendIds = getFriendIds();
  const filtered = DIRECTORY_USERS.filter(u => {
    const matchInterest = currentFilter === 'Semua' || u.interest === currentFilter;
    const matchSearch = u.name.toLowerCase().includes(searchQuery) || u.bio.toLowerCase().includes(searchQuery);
    return matchInterest && matchSearch;
  });

  listEl.innerHTML = filtered.map(user => {
    const isFriend = friendIds.includes(user.id);
    return `
      <div class="friend-card">
        <div style="display:flex; align-items:center; gap:10px; min-width:0;">
          <div class="avatar-wrap">
            <img src="${user.avatar}" alt="${user.name}" />
            <span class="status-dot online"></span>
          </div>
          <div class="friend-meta">
            <h4>${user.name}</h4>
            <p>${user.bio}</p>
            <span class="interest-pill">${user.interest}</span>
          </div>
        </div>
        ${isFriend
          ? `<button type="button" class="btn-secondary btn-sm" onclick="selectChat('${user.id}')"><i class="fa-solid fa-comment"></i> Chat</button>`
          : `<button type="button" class="btn-primary btn-sm" onclick="addFriend('${user.id}')"><i class="fa-solid fa-user-plus"></i> Tambah</button>`
        }
      </div>
    `;
  }).join('');
}

function filterDiscover(interest, btn) {
  currentFilter = interest;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderDiscoverList();
}

// Select & Open Chat
function selectChat(chatId) {
  activeChatId = chatId;
  const contact = getAllActiveContacts().find(c => c.id === chatId);
  if (!contact) return;

  document.getElementById('emptyChatState').classList.add('hidden');
  document.getElementById('activeChatWindow').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('chat-open');

  document.getElementById('chatAvatar').src = contact.avatar;
  document.getElementById('chatName').textContent = contact.name;
  document.getElementById('chatAiBadge').classList.toggle('hidden', !contact.isAI);

  if (contact.isAI) {
    document.getElementById('chatSubtitle').textContent = 'Online • Auto-Fallback (GPT-OSS 120B → GLM 4.7 → Meta AI)';
  } else if (contact.isGroup) {
    document.getElementById('chatSubtitle').textContent = 'Ruang Obrolan Publik Real-Time';
  } else {
    document.getElementById('chatSubtitle').textContent = `Online • ${contact.interest}`;
  }

  renderChatList();
  renderMessages(chatId);

  const msgs = getAllMessages()[chatId] || [];
  if (contact.isAI && msgs.length === 0) {
    const welcomeMsg = {
      id: 'msg-' + Date.now(),
      senderId: 'siputz-ai',
      senderName: 'Siputzx AI',
      modelUsed: 'Auto-Fallback Ready',
      text: 'Halo! Aku sudah terhubung langsung ke 3 server AI Siputzx (GPT-OSS 120B, GLM 4.7 Flash, dan Meta AI). Kalau salah satu server lagi sibuk atau mati, aku otomatis pindah ke model lain. Mau ngobrolin apa hari ini?',
      time: getCurrentTime(),
      isAI: true
    };
    saveMessageLocally(chatId, welcomeMsg, false);
    renderMessages(chatId);
  }
}

function closeMobileChat() {
  document.getElementById('appContainer').classList.remove('chat-open');
}

// Messaging Storage & Real-Time Engine
let memoryMessages = {};

function getAllMessages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || memoryMessages;
  } catch (e) {
    return memoryMessages;
  }
}

function saveMessageLocally(chatId, message, broadcast = true) {
  const all = getAllMessages();
  if (!all[chatId]) all[chatId] = [];
  if (all[chatId].some(m => m.id === message.id)) return;

  all[chatId].push(message);
  memoryMessages = all;
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
  } catch (e) {}

  if (broadcast && localBus) {
    try {
      localBus.postMessage({
        type: 'NEW_MESSAGE',
        payload: { chatId, message }
      });
    } catch (e) {}
  }
}

async function sendMessage(chatId, text) {
  const msg = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    senderId: currentUser.id,
    senderName: currentUser.name,
    text,
    time: getCurrentTime()
  };

  saveMessageLocally(chatId, msg, true);
  renderMessages(chatId);
  renderChatList();

  if (firebaseDb && chatId !== 'siputz-ai') {
    firebaseDb.ref(`chats/${chatId}/${msg.id}`).set(msg);
  }

  if (chatId === 'siputz-ai') {
    await querySiputzMultiAI(text);
  }
}

// Helper: Fetch with Timeout
async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Siputzx Multi-AI Auto-Fallback Engine
async function querySiputzMultiAI(userPrompt) {
  let systemPrompt = 'Kamu adalah asisten AI yang ramah, asik, cerdas, dan menjawab dalam bahasa Indonesia yang natural.';
  try {
    systemPrompt = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT) || systemPrompt;
  } catch (e) {}

  let finalReply = null;
  let activeModelName = '';
  let errorsLog = [];

  for (let i = 0; i < SIPUTZ_AI_MODELS.length; i++) {
    const model = SIPUTZ_AI_MODELS[i];
    showTypingIndicator(true, `Menghubungi ${model.name}...`);

    try {
      const urlObj = new URL(model.url);
      if (model.type === 'prompt_system') {
        urlObj.searchParams.set('prompt', userPrompt);
        urlObj.searchParams.set('system', systemPrompt);
        urlObj.searchParams.set('temperature', '0.7');
      } else {
        urlObj.searchParams.set('query', userPrompt);
      }

      const response = await fetchWithTimeout(urlObj.toString(), 16000);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      let extracted =
        data?.data?.response ||
        data?.data?.result ||
        data?.data ||
        data?.result ||
        data?.response ||
        data?.answer ||
        data?.message;

      if (typeof extracted === 'object' && extracted !== null) {
        extracted = extracted.text || extracted.content || extracted.reply || JSON.stringify(extracted);
      }

      if (!extracted || String(extracted).trim() === '' || data?.status === false) {
        throw new Error('Respons kosong / status false');
      }

      finalReply = String(extracted).trim();
      activeModelName = model.name;
      break;
    } catch (err) {
      errorsLog.push(`${model.name}: ${err.message}`);
    }
  }

  showTypingIndicator(false);

  if (finalReply) {
    const aiMsg = {
      id: 'msg-' + Date.now(),
      senderId: 'siputz-ai',
      senderName: 'Siputzx AI',
      modelUsed: activeModelName,
      text: finalReply,
      time: getCurrentTime(),
      isAI: true
    };
    saveMessageLocally('siputz-ai', aiMsg, false);
  } else {
    const failMsg = {
      id: 'msg-' + Date.now(),
      senderId: 'siputz-ai',
      senderName: 'Siputzx AI',
      modelUsed: 'Offline',
      text: `⚠️ Ketiga server AI Siputzx sedang tidak merespons saat ini.
Detail:
• ${errorsLog.join('
• ')}

Silakan coba kirim ulang pesan beberapa saat lagi.`,
      time: getCurrentTime(),
      isAI: true
    };
    saveMessageLocally('siputz-ai', failMsg, false);
  }

  renderMessages('siputz-ai');
  renderChatList();
}

function renderMessages(chatId) {
  const container = document.getElementById('messagesContainer');
  if (!container) return;

  const msgs = getAllMessages()[chatId] || [];

  container.innerHTML = msgs.map(m => {
    const isOutgoing = m.senderId === currentUser?.id;
    const rowClass = isOutgoing ? 'outgoing' : 'incoming';
    const aiClass = m.isAI ? 'ai-msg' : '';

    return `
      <div class="msg-row ${rowClass} ${aiClass}">
        <div class="msg-bubble">
          ${!isOutgoing ? `
            <div class="msg-sender">
              <span>${escapeHtml(m.senderName)}</span>
              ${m.modelUsed ? `<span class="model-badge">${escapeHtml(m.modelUsed)}</span>` : ''}
            </div>
          ` : ''}
          <div>${escapeHtml(m.text)}</div>
          <div class="msg-meta">
            <span>${m.time}</span>
            ${isOutgoing ? '<i class="fa-solid fa-check-double text-accent"></i>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator(show, statusText = 'AI sedang mengetik...') {
  const container = document.getElementById('messagesContainer');
  if (!container) return;

  let div = document.getElementById('typingBox');

  if (!show) {
    if (div) div.remove();
    return;
  }

  if (!div) {
    div = document.createElement('div');
    div.id = 'typingBox';
    div.className = 'typing-indicator';
    container.appendChild(div);
  }

  div.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(statusText)}`;
  container.scrollTop = container.scrollHeight;
}

function clearCurrentChat() {
  if (!activeChatId) return;
  const all = getAllMessages();
  delete all[activeChatId];
  memoryMessages = all;
  try { localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all)); } catch (e) {}
  renderMessages(activeChatId);
  renderChatList();
  showToast('Riwayat chat dibersihkan');
}

// Settings & Optional Firebase Real-Time Sync
function loadSettingsInputs() {
  const nameInput = document.getElementById('editProfileName');
  const sysInput = document.getElementById('aiSystemPrompt');
  const fbInput = document.getElementById('firebaseConfigInput');

  if (nameInput && currentUser) nameInput.value = currentUser.name;
  if (sysInput) {
    try {
      sysInput.value = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT) ||
        'Kamu adalah asisten AI yang ramah, asik, cerdas, dan menjawab dalam bahasa Indonesia yang natural.';
    } catch (e) {}
  }
  if (fbInput) {
    try { fbInput.value = localStorage.getItem(STORAGE_KEYS.FIREBASE_CFG) || ''; } catch (e) {}
  }
}

function saveSettings() {
  const newName = document.getElementById('editProfileName').value.trim();
  const sysPrompt = document.getElementById('aiSystemPrompt').value.trim();
  const fbCfg = document.getElementById('firebaseConfigInput').value.trim();

  if (newName && currentUser) {
    currentUser.name = newName;
    currentUser.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newName)}`;
    try { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(currentUser)); } catch (e) {}
    updateProfileUI();
  }

  try {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, sysPrompt);
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CFG, fbCfg);
  } catch (e) {}

  loadFirebaseSDKIfNeeded();
  closeModal('settingsModal');
  showToast('Pengaturan berhasil disimpan!');
}

function loadFirebaseSDKIfNeeded() {
  let raw = '';
  try { raw = localStorage.getItem(STORAGE_KEYS.FIREBASE_CFG) || ''; } catch (e) {}
  const pill = document.getElementById('connectionStatus');
  if (!raw) {
    if (pill) pill.innerHTML = '<i class="fa-solid fa-circle"></i> Multi-AI & Real-Time Aktif';
    return;
  }

  if (typeof firebase === 'undefined') {
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js';
      s2.onload = () => initFirebase(raw);
      document.body.appendChild(s2);
    };
    document.body.appendChild(s1);
  } else {
    initFirebase(raw);
  }
}

function initFirebase(raw) {
  const pill = document.getElementById('connectionStatus');
  try {
    const config = JSON.parse(raw);
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    firebaseDb = firebase.database();
    if (pill) pill.innerHTML = '<i class="fa-solid fa-circle"></i> Multi-AI & Firebase Cloud Aktif';

    firebaseDb.ref('chats').on('child_added', (chatSnap) => {
      const chatId = chatSnap.key;
      chatSnap.ref.on('child_added', (msgSnap) => {
        const msg = msgSnap.val();
        saveMessageLocally(chatId, msg, false);
        if (activeChatId === chatId) renderMessages(chatId);
        renderChatList();
      });
    });
  } catch (e) {
    showToast('Format JSON Firebase tidak valid');
  }
}

// Helpers
function openModal(id) {
  loadSettingsInputs();
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function insertEmoji() {
  const emojis = ['😊', '😂', '🔥', '🙌', '❤️', '✨', '👍', '😎'];
  const pick = emojis[Math.floor(Math.random() * emojis.length)];
  const input = document.getElementById('messageInput');
  input.value += pick;
  input.focus();
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function showToast(text) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}
