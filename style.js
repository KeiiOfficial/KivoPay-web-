(() => {
  'use strict';

  const cssRules = `
    :root {
      --bg: #0b0a12;
      --bg-card: rgba(23, 21, 36, 0.94);
      --bg-card-solid: #171524;
      --bg-input: rgba(34, 31, 52, 0.98);
      --border: rgba(255, 255, 255, 0.1);
      --text: #f5f4fa;
      --text-muted: #a19db8;
      --primary-1: #ff4d94;
      --primary-2: #8b5cf6;
      --cyan: #22d3ee;
      --danger: #fb7185;
      --success: #25d366;
      --shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
      --radius-lg: 20px;
      --radius-md: 14px;
      --radius-sm: 10px;

      /* WhatsApp Dark Theme */
      --wa-bg: #0b141a;
      --wa-header: #1f2c34;
      --wa-bubble-in: #202c33;
      --wa-bubble-out: #005c4b;
      --wa-text: #e9edef;
      --wa-meta: #8696a0;
      --wa-input-bg: #2a3942;
      --wa-accent: #00a884;
    }

    [data-theme="light"] {
      --bg: #f4f3fa;
      --bg-card: rgba(255, 255, 255, 0.96);
      --bg-card-solid: #ffffff;
      --bg-input: #f0eff8;
      --border: rgba(20, 18, 40, 0.11);
      --text: #181626;
      --text-muted: #5d5975;
      --shadow: 0 14px 32px rgba(32, 24, 68, 0.09);

      /* WhatsApp Light Theme */
      --wa-bg: #efeae2;
      --wa-header: #008069;
      --wa-bubble-in: #ffffff;
      --wa-bubble-out: #d9fdd3;
      --wa-text: #111b21;
      --wa-meta: #667781;
      --wa-input-bg: #ffffff;
      --wa-accent: #00a884;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    html, body {
      min-height: 100%;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      overflow-x: hidden;
    }

    .bg-grid {
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
      background-size: 34px 34px;
      pointer-events: none;
      z-index: 0;
    }

    .bg-glow {
      position: fixed;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.24;
      pointer-events: none;
      z-index: 0;
    }
    .bg-glow-1 { top: -80px; left: -60px; background: var(--primary-1); }
    .bg-glow-2 { bottom: -90px; right: -60px; background: var(--primary-2); }

    .app-shell {
      position: relative;
      z-index: 1;
      max-width: 640px;
      margin: 0 auto;
      padding: 12px 12px 36px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      margin-bottom: 10px;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .topbar-logo {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-1), var(--primary-2));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .topbar-brand h1 {
      font-size: 15px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .topbar-brand p {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--bg-input);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .mini-badge {
      font-size: 10px;
      font-weight: 700;
      color: var(--cyan);
    }

    .tab-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }

    .tab-pill {
      padding: 9px 4px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-muted);
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .tab-pill.active {
      background: linear-gradient(135deg, var(--primary-1), var(--primary-2));
      color: #fff;
      border-color: transparent;
      box-shadow: 0 6px 18px rgba(255, 77, 148, 0.3);
    }

    .panel {
      display: none;
      flex-direction: column;
      gap: 14px;
    }
    .panel.active { display: flex; }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 18px;
      box-shadow: var(--shadow);
    }

    .hero-card h2 {
      font-size: 18px;
      line-height: 1.3;
      margin: 10px 0 6px;
    }

    .muted { color: var(--text-muted); font-size: 13px; line-height: 1.5; }
    .small { font-size: 12px; }

    .badge-row { display: flex; flex-wrap: wrap; gap: 8px; }

    .pill-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .pill-badge.pink {
      background: rgba(255, 77, 148, 0.16);
      color: #ff6ba6;
      border: 1px solid rgba(255, 77, 148, 0.28);
    }
    .pill-badge.cyan {
      background: rgba(34, 211, 238, 0.14);
      color: var(--cyan);
      border: 1px solid rgba(34, 211, 238, 0.26);
    }

    .platform-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 14px 0;
    }

    .plat-btn {
      padding: 11px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--bg-input);
      color: var(--text);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .plat-btn.active {
      background: linear-gradient(135deg, var(--primary-1), var(--primary-2));
      color: #fff;
      border-color: transparent;
    }

    .input-action-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    input[type="url"],
    input[type="text"] {
      width: 100%;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--bg-input);
      color: var(--text);
      font-family: inherit;
      font-size: 13.5px;
      outline: none;
    }
    input:focus { border-color: var(--primary-1); }

    .btn-primary {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      border: none;
      background: linear-gradient(135deg, var(--primary-1), var(--primary-2));
      color: #fff;
      font-family: inherit;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-secondary {
      padding: 11px 13px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--bg-input);
      color: var(--text);
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
    }

    .full-width { width: 100%; }

    .text-danger-btn {
      background: none;
      border: none;
      color: var(--danger);
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }

    .hidden { display: none !important; }

    .result-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .result-header h3 { font-size: 15.5px; }

    .media-preview-box {
      position: relative;
      width: 100%;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: #000;
      border: 1px solid var(--border);
      margin-bottom: 12px;
    }

    .media-preview-box video {
      width: 100%;
      max-height: 380px;
      display: block;
      background: #000;
    }

    .cover-fallback-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 220px;
      padding: 18px;
      text-align: center;
      background: linear-gradient(145deg, #1b1730, #12101f);
    }

    .cover-fallback-card img {
      width: 100%;
      max-height: 280px;
      object-fit: cover;
      border-radius: 10px;
      margin-bottom: 12px;
    }

    .result-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .profile-summary {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
    }

    .profile-avatar {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary-1);
      background: var(--bg-input);
      flex-shrink: 0;
    }

    .profile-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .verified-tag {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(34, 211, 238, 0.18);
      color: var(--cyan);
    }

    .profile-bio {
      margin-top: 6px;
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-line;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .stat-box {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 8px;
      text-align: center;
    }
    .stat-box strong { display: block; font-size: 16px; font-weight: 800; margin-bottom: 2px; }
    .stat-box span { font-size: 11px; color: var(--text-muted); }

    .extra-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 10px;
    }

    .meta-item {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      font-size: 11.5px;
    }
    .meta-item span { display: block; color: var(--text-muted); font-size: 10.5px; }

    /* WhatsApp Chat Layout */
    .wa-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 150px);
      min-height: 480px;
      max-height: 680px;
      background-color: var(--wa-bg);
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .wa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 14px;
      background-color: var(--wa-header);
      color: #ffffff;
      flex-shrink: 0;
    }

    .wa-contact {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .wa-avatar {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00a884, #008069);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .wa-online-dot {
      position: absolute;
      bottom: 1px;
      right: 1px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #25d366;
      border: 2px solid var(--wa-header);
    }

    .wa-contact-meta { min-width: 0; }
    .wa-contact-name {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14.5px;
    }

    .wa-verified-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #25d366;
      color: #0b141a;
      font-size: 10px;
      font-weight: 800;
    }

    .wa-contact-status {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.85);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .wa-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .wa-icon-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wa-quick-bar {
      display: flex;
      gap: 6px;
      padding: 8px 10px;
      overflow-x: auto;
      background: rgba(0, 0, 0, 0.22);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
      scrollbar-width: none;
    }
    .wa-quick-bar::-webkit-scrollbar { display: none; }

    .chip-btn {
      padding: 5px 11px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: var(--wa-header);
      color: #fff;
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .wa-chat-body {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background-image: radial-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px);
      background-size: 18px 18px;
    }

    [data-theme="light"] .wa-chat-body {
      background-image: radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px);
    }

    .wa-date-pill {
      align-self: center;
      background: rgba(0, 0, 0, 0.32);
      color: #e9edef;
      font-size: 10.5px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 8px;
      margin-bottom: 4px;
    }

    [data-theme="light"] .wa-date-pill {
      background: rgba(255, 255, 255, 0.88);
      color: #54656f;
    }

    .wa-row {
      display: flex;
      width: 100%;
    }
    .wa-row.user { justify-content: flex-end; }
    .wa-row.ai { justify-content: flex-start; }

    .wa-bubble {
      position: relative;
      display: inline-block;
      width: fit-content;
      min-width: 72px;
      max-width: 82%;
      padding: 8px 11px 6px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.45;
      color: var(--wa-text);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .wa-row.ai .wa-bubble {
      background-color: var(--wa-bubble-in);
      border-top-left-radius: 2px;
    }

    .wa-row.user .wa-bubble {
      background-color: var(--wa-bubble-out);
      border-top-right-radius: 2px;
    }

    .wa-bubble-text { white-space: pre-wrap; }
    .wa-bubble-text strong { font-weight: 700; }

    .wa-bubble-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 3px;
      font-size: 10px;
      color: var(--wa-meta);
    }

    .wa-ticks {
      color: #53bdeb;
      font-weight: 700;
      letter-spacing: -1px;
    }

    .wa-footer {
      padding: 8px 10px;
      background-color: var(--wa-bg);
      flex-shrink: 0;
    }

    .wa-input-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .wa-input-pill {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: var(--wa-input-bg);
      border-radius: 24px;
      padding: 6px 14px;
      min-height: 44px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .wa-emoji-icon {
      font-size: 18px;
      opacity: 0.8;
      flex-shrink: 0;
    }

    .wa-input-pill input {
      width: 100%;
      border: none;
      background: transparent;
      color: var(--wa-text);
      padding: 4px 0;
      font-family: inherit;
      font-size: 14px;
      outline: none;
    }

    .wa-input-pill input::placeholder { color: var(--wa-meta); }

    .wa-send-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background-color: var(--wa-accent);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
    .wa-send-circle:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Love Gacha */
    .gacha-stage { margin: 14px 0; }
    .gacha-card-preview {
      background: linear-gradient(145deg, rgba(255, 77, 148, 0.14), rgba(139, 92, 246, 0.16));
      border: 1px solid rgba(255, 77, 148, 0.35);
      border-radius: var(--radius-lg);
      padding: 22px 16px;
      text-align: center;
    }
    .gacha-rarity {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      margin-bottom: 8px;
    }
    .gacha-emoji { font-size: 46px; margin: 4px 0 8px; }
    .gacha-btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

    .match-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 12px 0;
    }
    .heart-divider { font-size: 18px; flex-shrink: 0; }
    .match-result {
      margin-top: 14px;
      padding: 14px;
      border-radius: var(--radius-md);
      background: var(--bg-input);
      border: 1px solid var(--border);
      text-align: center;
    }
    .match-score-circle {
      width: 72px;
      height: 72px;
      margin: 0 auto 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-1), var(--primary-2));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      font-weight: 800;
    }
    .gacha-inventory { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .inv-item {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px;
      font-size: 12px;
    }
    .inv-item strong { display: block; margin: 3px 0; }

    /* Sidebar Drawer */
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 40;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease;
    }
    .drawer-backdrop.open { opacity: 1; pointer-events: auto; }

    .sidebar-drawer {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 280px;
      max-width: 82vw;
      background: var(--bg-card-solid);
      border-right: 1px solid var(--border);
      z-index: 50;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      transform: translateX(-104%);
      transition: transform 0.25s ease;
    }
    .sidebar-drawer.open { transform: translateX(0); }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .brand-wrap { display: flex; align-items: center; gap: 10px; }
    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-1), var(--primary-2));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .brand-title { font-weight: 800; font-size: 15px; }
    .brand-sub { font-size: 11px; color: var(--text-muted); }

    .drawer-section-label {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.7px;
      margin-bottom: 8px;
      padding-left: 6px;
    }
    .drawer-nav { display: flex; flex-direction: column; gap: 6px; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 12px;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      background: transparent;
      color: var(--text);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
    }
    .nav-item.active {
      background: linear-gradient(135deg, rgba(255, 77, 148, 0.18), rgba(139, 92, 246, 0.18));
      border-color: rgba(255, 77, 148, 0.35);
    }
    .nav-icon { font-size: 18px; }
    .nav-text strong { display: block; font-size: 13.5px; }
    .nav-text small { font-size: 11px; color: var(--text-muted); }

    .drawer-footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }
    .status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11.5px;
      color: var(--text-muted);
    }
    .dot-online { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(24px);
      background: var(--bg-card-solid);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 10px 16px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 600;
      box-shadow: var(--shadow);
      opacity: 0;
      pointer-events: none;
      z-index: 90;
      transition: all 0.22s ease;
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'lovehub-dynamic-styles';
  styleEl.textContent = cssRules;
  document.head.appendChild(styleEl);
})();
