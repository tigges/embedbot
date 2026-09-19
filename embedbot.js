/*!
 * Embedbot — drop-in chat widget
 * Usage: <script src="embedbot.js"></script>
 *        <script>Embedbot.init({ botName, botTitle, greeting, quickReplies, color })</script>
 */
(function (global) {
  'use strict';

  const DEFAULT = {
    botName: 'Embedbot',
    botTitle: 'Assistant',
    status: 'online',
    greeting: 'Hi there! 👋 How can I help you today?',
    quickReplies: [],
    color: '#7c5cfc',
    avatarEmoji: '🤖',
    inputPlaceholder: 'Type a message…',
    position: 'bottom-right',
  };

  const css = (color) => `
    #eb-launcher {
      position: fixed; bottom: 28px; right: 28px;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${color};
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      border: none; cursor: pointer; z-index: 99998;
      display: flex; align-items: center; justify-content: center;
      transition: transform .15s ease, box-shadow .15s ease;
    }
    #eb-launcher:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,.32); }
    #eb-launcher svg { pointer-events: none; }

    #eb-bubble {
      position: fixed; bottom: 96px; right: 28px;
      width: 340px;
      background: #fff; border-radius: 18px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      z-index: 99999; display: none; flex-direction: column;
      overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif;
      max-height: 520px;
      transform: translateY(12px) scale(.97); opacity: 0;
      transition: transform .2s ease, opacity .2s ease;
    }
    #eb-bubble.eb-open {
      display: flex; transform: translateY(0) scale(1); opacity: 1;
    }

    /* Header */
    #eb-header {
      background: ${color};
      padding: 14px 16px;
      display: flex; align-items: center; gap: 10px;
      position: relative;
    }
    .eb-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .eb-header-info { flex: 1; min-width: 0; }
    .eb-header-name {
      color: #fff; font-size: .9rem; font-weight: 700;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .eb-header-status {
      color: rgba(255,255,255,.8); font-size: .72rem;
      display: flex; align-items: center; gap: 4px; margin-top: 1px;
    }
    .eb-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #4ade80;
      display: inline-block;
    }
    #eb-close {
      background: rgba(255,255,255,.2); border: none; border-radius: 50%;
      width: 28px; height: 28px; cursor: pointer; color: #fff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 16px; line-height: 1;
      transition: background .15s;
    }
    #eb-close:hover { background: rgba(255,255,255,.35); }

    /* Messages */
    #eb-messages {
      flex: 1; overflow-y: auto; padding: 18px 14px 10px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f9f9fc;
      min-height: 160px;
    }
    #eb-messages::-webkit-scrollbar { width: 4px; }
    #eb-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }

    .eb-msg { display: flex; gap: 8px; align-items: flex-end; max-width: 90%; }
    .eb-msg.eb-bot { align-self: flex-start; }
    .eb-msg.eb-user { align-self: flex-end; flex-direction: row-reverse; }

    .eb-msg-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: ${color}22; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .eb-bubble-text {
      padding: 10px 13px; border-radius: 16px;
      font-size: .875rem; line-height: 1.45; max-width: 100%;
    }
    .eb-bot .eb-bubble-text {
      background: #fff; color: #1a1a2e;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }
    .eb-user .eb-bubble-text {
      background: ${color}; color: #fff;
      border-bottom-right-radius: 4px;
    }

    /* Quick replies */
    #eb-quick-replies {
      padding: 6px 14px 10px;
      display: flex; flex-wrap: wrap; gap: 6px;
      background: #f9f9fc;
    }
    .eb-qr {
      background: #fff; border: 1.5px solid ${color}55;
      border-radius: 999px; padding: 5px 13px;
      font-size: .8rem; color: #333; cursor: pointer;
      transition: background .12s, border-color .12s, color .12s;
      white-space: nowrap;
    }
    .eb-qr:hover { background: ${color}11; border-color: ${color}; color: ${color}; }

    /* Input */
    #eb-input-row {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid #ebebf0;
      background: #fff;
    }
    #eb-text-input {
      flex: 1; border: none; outline: none;
      font-size: .875rem; font-family: inherit;
      color: #1a1a2e; background: transparent;
      min-width: 0;
    }
    #eb-text-input::placeholder { color: #aaa; }
    #eb-send {
      width: 34px; height: 34px; border-radius: 50%;
      background: ${color}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity .15s;
    }
    #eb-send:hover { opacity: .88; }

    /* Powered by */
    #eb-footer {
      text-align: center; padding: 6px;
      font-size: .68rem; color: #bbb;
      background: #fff; border-top: 1px solid #f0f0f5;
    }
    #eb-footer a { color: #bbb; text-decoration: none; }
    #eb-footer a:hover { color: #999; }
  `;

  const Embedbot = {
    _cfg: null,
    _open: false,

    init(userCfg = {}) {
      this._cfg = Object.assign({}, DEFAULT, userCfg);
      this._inject();
    },

    _inject() {
      const cfg = this._cfg;

      // Style
      const style = document.createElement('style');
      style.textContent = css(cfg.color);
      document.head.appendChild(style);

      // Launcher button
      const launcher = document.createElement('button');
      launcher.id = 'eb-launcher';
      launcher.setAttribute('aria-label', 'Open chat');
      launcher.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>`;
      document.body.appendChild(launcher);

      // Bubble
      const bubble = document.createElement('div');
      bubble.id = 'eb-bubble';
      bubble.setAttribute('role', 'dialog');
      bubble.setAttribute('aria-label', 'Chat');
      bubble.innerHTML = `
        <div id="eb-header">
          <div class="eb-avatar">${cfg.avatarEmoji}</div>
          <div class="eb-header-info">
            <div class="eb-header-name">${cfg.botName}</div>
            <div class="eb-header-status">
              <span class="eb-dot"></span>${cfg.botTitle} · ${cfg.status}
            </div>
          </div>
          <button id="eb-close" aria-label="Close chat">✕</button>
        </div>
        <div id="eb-messages"></div>
        <div id="eb-quick-replies"></div>
        <div id="eb-input-row">
          <input id="eb-text-input" type="text" placeholder="${cfg.inputPlaceholder}" autocomplete="off" />
          <button id="eb-send" aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div id="eb-footer">powered by <a href="https://tigges.github.io/embedbot/" target="_blank">embedbot</a></div>
      `;
      document.body.appendChild(bubble);

      // Populate quick replies
      const qrContainer = bubble.querySelector('#eb-quick-replies');
      (cfg.quickReplies || []).forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'eb-qr';
        btn.textContent = label;
        btn.addEventListener('click', () => {
          this._addMessage(label, 'user');
          this._hideQuickReplies();
          setTimeout(() => this._botReply(label), 600);
        });
        qrContainer.appendChild(btn);
      });

      // Show greeting
      setTimeout(() => this._addBotMessage(cfg.greeting), 300);

      // Events
      launcher.addEventListener('click', () => this._toggle());
      bubble.querySelector('#eb-close').addEventListener('click', () => this._close());

      const input = bubble.querySelector('#eb-text-input');
      const send = bubble.querySelector('#eb-send');

      const sendMsg = () => {
        const val = input.value.trim();
        if (!val) return;
        this._addMessage(val, 'user');
        this._hideQuickReplies();
        input.value = '';
        setTimeout(() => this._botReply(val), 700);
      };

      send.addEventListener('click', sendMsg);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
    },

    _toggle() {
      this._open ? this._close() : this._openChat();
    },

    _openChat() {
      this._open = true;
      const bubble = document.getElementById('eb-bubble');
      bubble.style.display = 'flex';
      requestAnimationFrame(() => bubble.classList.add('eb-open'));
      document.getElementById('eb-text-input').focus();
    },

    _close() {
      this._open = false;
      const bubble = document.getElementById('eb-bubble');
      bubble.classList.remove('eb-open');
      setTimeout(() => { if (!this._open) bubble.style.display = 'none'; }, 200);
    },

    _addBotMessage(text) {
      this._addMessage(text, 'bot');
    },

    _addMessage(text, type) {
      const msgs = document.getElementById('eb-messages');
      const wrap = document.createElement('div');
      wrap.className = `eb-msg eb-${type}`;

      if (type === 'bot') {
        wrap.innerHTML = `
          <div class="eb-msg-avatar">${this._cfg.avatarEmoji}</div>
          <div class="eb-bubble-text">${text}</div>`;
      } else {
        wrap.innerHTML = `<div class="eb-bubble-text">${text}</div>`;
      }

      msgs.appendChild(wrap);
      msgs.scrollTop = msgs.scrollHeight;
    },

    _hideQuickReplies() {
      const qr = document.getElementById('eb-quick-replies');
      if (qr) qr.style.display = 'none';
    },

    _botReply(userMsg) {
      const cfg = this._cfg;
      const msg = userMsg.toLowerCase();

      let reply;
      if (msg.includes('haircut') || msg.includes('cut')) {
        reply = `Great choice! ✂️ A ${userMsg} typically takes 45–60 min. Shall I find you the next available slot?`;
      } else if (msg.includes('colour') || msg.includes('color') || msg.includes('highlights') || msg.includes('balayage')) {
        reply = `Lovely! 🎨 Colour services are booked for 2–3 hours. Want me to check availability?`;
      } else if (msg.includes('treatment')) {
        reply = `Perfect — a little TLC goes a long way! 💆 Treatments take about 30 min. Ready to book?`;
      } else if (msg.includes('blow') || msg.includes('blowdry')) {
        reply = `A blow-dry is the perfect finishing touch! 💇 Takes around 30–45 min. Should I find a time?`;
      } else if (msg.includes('book') || msg.includes('appoint') || msg.includes('slot') || msg.includes('available')) {
        reply = `Sure! We have openings this week — Tue 2 pm, Wed 11 am and Thu 3 pm look free. Which suits you best?`;
      } else if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
        reply = `Prices start from £35 for a cut and finish. Colour services from £65. Would you like our full menu?`;
      } else {
        reply = `Thanks for getting in touch! 😊 I'll pass your message to one of our stylists. For quick bookings, hit the <strong>Book</strong> link in the nav.`;
      }

      this._addBotMessage(reply);
    }
  };

  global.Embedbot = Embedbot;
})(window);
