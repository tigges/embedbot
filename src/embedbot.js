/**
 * embedbot — a self-contained, embeddable hair-salon receptionist chatbot.
 *
 * Drop it into ANY website with a single script tag:
 *
 *   <script src="embedbot.js"
 *           data-salon="Shear Elegance"
 *           data-accent="#8b5cf6"></script>
 *
 * No backend, no API keys, no dependencies. The widget injects its own styles
 * and DOM, then runs a guided appointment-booking conversation that mirrors the
 * questions a real salon receptionist asks.
 *
 * Configuration can be supplied either via data-* attributes on the script tag
 * or a global `window.EmbedBotConfig` object (the latter takes precedence).
 */
(function () {
  "use strict";

  if (window.__embedbotLoaded) return;
  window.__embedbotLoaded = true;

  // ---- Configuration --------------------------------------------------------
  const script = document.currentScript;
  const ds = (script && script.dataset) || {};

  function parseList(value, fallback) {
    if (!value) return fallback;
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const cfg = Object.assign(
    {
      salon: ds.salon || "Bella Hair Studio",
      accent: ds.accent || "#8b5cf6",
      services: parseList(ds.services, [
        "Haircut",
        "Cut & Blow-dry",
        "Colour",
        "Highlights",
        "Balayage",
        "Treatment",
      ]),
      stylists: parseList(ds.stylists, [
        "No preference",
        "Ava",
        "Marco",
        "Priya",
      ]),
      hours: ds.hours || "Mon–Sat, 9am–6pm",
      // Optional: POST the completed booking as JSON to this URL.
      webhook: ds.webhook || (window.EmbedBotConfig && window.EmbedBotConfig.webhook) || "",
    },
    window.EmbedBotConfig || {}
  );

  const ACCENT = cfg.accent;

  // ---- Styles ---------------------------------------------------------------
  const css = `
  .eb-root{position:fixed;bottom:24px;right:24px;z-index:2147483000;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
  .eb-launcher{width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;
    background:${ACCENT};color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.22);
    display:flex;align-items:center;justify-content:center;transition:transform .15s ease, box-shadow .15s ease;}
  .eb-launcher:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.28);}
  .eb-launcher svg{width:28px;height:28px;}
  .eb-launcher.eb-hidden{display:none;}

  .eb-panel{position:absolute;bottom:0;right:0;width:370px;max-width:calc(100vw - 32px);
    height:560px;max-height:calc(100vh - 48px);background:#fff;border-radius:18px;
    box-shadow:0 20px 60px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;
    opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;transition:opacity .18s ease, transform .18s ease;}
  .eb-panel.eb-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}

  .eb-header{background:${ACCENT};color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px;}
  .eb-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;}
  .eb-htext{flex:1;min-width:0;}
  .eb-hname{font-size:15px;font-weight:600;line-height:1.2;}
  .eb-hstatus{font-size:12px;opacity:.9;display:flex;align-items:center;gap:6px;margin-top:2px;}
  .eb-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.6);animation:eb-pulse 2s infinite;}
  @keyframes eb-pulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.5)}70%{box-shadow:0 0 0 6px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
  .eb-close{background:transparent;border:none;color:#fff;cursor:pointer;opacity:.85;padding:4px;border-radius:6px;line-height:0;}
  .eb-close:hover{opacity:1;background:rgba(255,255,255,.15);}

  .eb-body{flex:1;overflow-y:auto;padding:18px;background:#f7f7fb;display:flex;flex-direction:column;gap:10px;}
  .eb-body::-webkit-scrollbar{width:8px;}
  .eb-body::-webkit-scrollbar-thumb{background:#d7d7e2;border-radius:4px;}

  .eb-msg{display:flex;gap:8px;align-items:flex-end;max-width:85%;animation:eb-in .25s ease;}
  @keyframes eb-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .eb-msg.eb-bot{align-self:flex-start;}
  .eb-msg.eb-user{align-self:flex-end;flex-direction:row-reverse;}
  .eb-mav{width:26px;height:26px;border-radius:50%;background:${ACCENT};color:#fff;font-size:13px;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .eb-bubble{padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;word-wrap:break-word;}
  .eb-bot .eb-bubble{background:#fff;color:#1f2233;border:1px solid #ececf3;border-bottom-left-radius:4px;}
  .eb-user .eb-bubble{background:${ACCENT};color:#fff;border-bottom-right-radius:4px;}

  .eb-typing{display:flex;gap:4px;padding:12px 14px;background:#fff;border:1px solid #ececf3;border-radius:14px;border-bottom-left-radius:4px;width:fit-content;}
  .eb-typing span{width:7px;height:7px;border-radius:50%;background:#b9b9c9;animation:eb-bounce 1.2s infinite;}
  .eb-typing span:nth-child(2){animation-delay:.15s;}
  .eb-typing span:nth-child(3){animation-delay:.3s;}
  @keyframes eb-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}

  .eb-quick{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 4px;}
  .eb-chip{background:#fff;border:1.5px solid ${ACCENT};color:${ACCENT};border-radius:20px;
    padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer;transition:background .12s, color .12s;}
  .eb-chip:hover{background:${ACCENT};color:#fff;}

  .eb-inputbar{display:flex;gap:8px;padding:12px;border-top:1px solid #ececf3;background:#fff;}
  .eb-input{flex:1;border:1.5px solid #e2e2ec;border-radius:22px;padding:10px 15px;font-size:14px;outline:none;
    color:#1f2233;transition:border-color .12s;}
  .eb-input:focus{border-color:${ACCENT};}
  .eb-input:disabled{background:#f3f3f8;cursor:not-allowed;}
  .eb-send{width:40px;height:40px;border-radius:50%;border:none;background:${ACCENT};color:#fff;cursor:pointer;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .12s;}
  .eb-send:hover{opacity:.88;}
  .eb-send:disabled{opacity:.4;cursor:not-allowed;}

  .eb-summary{background:#fff;border:1px solid #ececf3;border-radius:14px;padding:14px;font-size:13px;color:#1f2233;}
  .eb-summary h4{margin:0 0 8px;font-size:13px;color:${ACCENT};text-transform:uppercase;letter-spacing:.04em;}
  .eb-summary .eb-row{display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px dashed #eee;}
  .eb-summary .eb-row:last-child{border-bottom:none;}
  .eb-summary .eb-k{color:#8a8a9a;}
  .eb-summary .eb-v{font-weight:600;text-align:right;}
  .eb-footer{text-align:center;font-size:11px;color:#b3b3c0;padding:6px 0 10px;background:#f7f7fb;}
  `;

  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---- DOM scaffold ---------------------------------------------------------
  const root = document.createElement("div");
  root.className = "eb-root";
  root.innerHTML = `
    <div class="eb-panel" role="dialog" aria-label="${cfg.salon} booking assistant">
      <div class="eb-header">
        <div class="eb-avatar">💇</div>
        <div class="eb-htext">
          <div class="eb-hname">${cfg.salon}</div>
          <div class="eb-hstatus"><span class="eb-dot"></span>Receptionist · online</div>
        </div>
        <button class="eb-close" aria-label="Close chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="eb-body" aria-live="polite"></div>
      <div class="eb-quick"></div>
      <div class="eb-inputbar">
        <input class="eb-input" type="text" placeholder="Type your message…" aria-label="Message" autocomplete="off">
        <button class="eb-send" aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
      <div class="eb-footer">powered by embedbot</div>
    </div>
    <button class="eb-launcher" aria-label="Open booking chat">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    </button>
  `;
  document.body.appendChild(root);

  const panel = root.querySelector(".eb-panel");
  const launcher = root.querySelector(".eb-launcher");
  const closeBtn = root.querySelector(".eb-close");
  const body = root.querySelector(".eb-body");
  const quick = root.querySelector(".eb-quick");
  const input = root.querySelector(".eb-input");
  const sendBtn = root.querySelector(".eb-send");

  // ---- Chat helpers ---------------------------------------------------------
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function addMessage(role, html) {
    const msg = document.createElement("div");
    msg.className = "eb-msg " + (role === "bot" ? "eb-bot" : "eb-user");
    const avatar = role === "bot" ? '<div class="eb-mav">💇</div>' : "";
    msg.innerHTML = `${avatar}<div class="eb-bubble">${html}</div>`;
    body.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function showTyping() {
    const t = document.createElement("div");
    t.className = "eb-msg eb-bot";
    t.innerHTML = '<div class="eb-mav">💇</div><div class="eb-typing"><span></span><span></span><span></span></div>';
    body.appendChild(t);
    scrollToBottom();
    return t;
  }

  // Bot speaks with a realistic typing delay, then optionally shows quick replies.
  function botSay(html, options) {
    return new Promise((resolve) => {
      const typing = showTyping();
      const delay = Math.min(400 + html.length * 12, 1100);
      setTimeout(() => {
        typing.remove();
        addMessage("bot", html);
        if (options) renderChips(options);
        resolve();
      }, delay);
    });
  }

  function clearChips() {
    quick.innerHTML = "";
  }

  function renderChips(options) {
    clearChips();
    options.forEach((opt) => {
      const chip = document.createElement("button");
      chip.className = "eb-chip";
      chip.textContent = opt;
      chip.addEventListener("click", () => handleUserInput(opt));
      quick.appendChild(chip);
    });
  }

  function setInputEnabled(enabled, placeholder) {
    input.disabled = !enabled;
    sendBtn.disabled = !enabled;
    if (placeholder) input.placeholder = placeholder;
    if (enabled) input.focus();
  }

  // ---- Booking flow (receptionist script) -----------------------------------
  const booking = {};
  let step = "service";
  let started = false;

  function nextDays(count) {
    const out = [];
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date();
    for (let i = 0; i < count; i++) {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${names[day.getDay()]} ${day.getDate()}`;
      out.push(label);
    }
    return out;
  }

  const TIME_SLOTS = ["9:30 am", "11:00 am", "1:00 pm", "3:30 pm", "5:00 pm"];

  function validPhone(text) {
    const digits = text.replace(/[^0-9]/g, "");
    return digits.length >= 7;
  }

  async function startConversation() {
    if (started) return;
    started = true;
    await botSay(
      `Hi there! 👋 Welcome to <strong>${escapeHtml(cfg.salon)}</strong>. I can help you book an appointment. What service would you like?`,
      cfg.services
    );
    setInputEnabled(true, "Choose or type a service…");
  }

  async function handleUserInput(rawText) {
    const text = String(rawText).trim();
    if (!text) return;

    addMessage("user", escapeHtml(text));
    input.value = "";
    clearChips();
    setInputEnabled(false);

    await route(text);
  }

  async function route(text) {
    switch (step) {
      case "service":
        booking.service = text;
        step = "stylist";
        await botSay(
          `Great choice — a <strong>${escapeHtml(text)}</strong>. Do you have a preferred stylist?`,
          cfg.stylists
        );
        setInputEnabled(true, "Pick a stylist…");
        break;

      case "stylist":
        booking.stylist = text;
        step = "date";
        await botSay("Perfect. Which day works best for you?", nextDays(6));
        setInputEnabled(true, "Choose a day…");
        break;

      case "date":
        booking.date = text;
        step = "time";
        await botSay(`And what time on <strong>${escapeHtml(text)}</strong>?`, TIME_SLOTS);
        setInputEnabled(true, "Choose a time…");
        break;

      case "time":
        booking.time = text;
        step = "name";
        await botSay("Almost done! Can I take your name for the booking?");
        setInputEnabled(true, "Your full name…");
        break;

      case "name":
        booking.name = text;
        step = "phone";
        await botSay(`Thanks, ${escapeHtml(text.split(" ")[0])}! What's the best phone number to reach you on?`);
        setInputEnabled(true, "Your phone number…");
        break;

      case "phone":
        if (!validPhone(text)) {
          await botSay("Hmm, that doesn't look like a valid number. Could you enter a phone number with at least 7 digits?");
          setInputEnabled(true, "Your phone number…");
          return;
        }
        booking.phone = text;
        step = "confirm";
        await botSay("Here's what I have for your appointment — does everything look right?");
        addMessage("bot", summaryHtml());
        renderChips(["Confirm booking", "Start over"]);
        setInputEnabled(true, 'Type "confirm" or "start over"…');
        break;

      case "confirm":
        if (/start over|restart|no|change/i.test(text)) {
          resetFlow();
          return;
        }
        step = "done";
        await finalizeBooking();
        break;

      case "done":
        await botSay("Your appointment is all set! Is there anything else I can help you with? You can type 'book' to start a new booking.");
        if (/book|new|another|yes/i.test(text)) resetFlow();
        else setInputEnabled(true, "Type your message…");
        break;

      default:
        setInputEnabled(true, "Type your message…");
    }
  }

  function summaryHtml() {
    return `
      <div class="eb-summary">
        <h4>Appointment summary</h4>
        <div class="eb-row"><span class="eb-k">Service</span><span class="eb-v">${escapeHtml(booking.service)}</span></div>
        <div class="eb-row"><span class="eb-k">Stylist</span><span class="eb-v">${escapeHtml(booking.stylist)}</span></div>
        <div class="eb-row"><span class="eb-k">Date</span><span class="eb-v">${escapeHtml(booking.date)}</span></div>
        <div class="eb-row"><span class="eb-k">Time</span><span class="eb-v">${escapeHtml(booking.time)}</span></div>
        <div class="eb-row"><span class="eb-k">Name</span><span class="eb-v">${escapeHtml(booking.name)}</span></div>
        <div class="eb-row"><span class="eb-k">Phone</span><span class="eb-v">${escapeHtml(booking.phone)}</span></div>
      </div>`;
  }

  async function finalizeBooking() {
    const ref = "SE-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    booking.reference = ref;

    if (cfg.webhook) {
      try {
        await fetch(cfg.webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.assign({ type: "salon-booking" }, booking)),
        });
      } catch (e) {
        /* Booking is confirmed client-side regardless of webhook delivery. */
      }
    }

    window.dispatchEvent(new CustomEvent("embedbot:booking", { detail: Object.assign({}, booking) }));

    await botSay(
      `You're all booked, ${escapeHtml(booking.name.split(" ")[0])}! 🎉<br><br>` +
        `Your <strong>${escapeHtml(booking.service)}</strong> with <strong>${escapeHtml(booking.stylist)}</strong> is confirmed for ` +
        `<strong>${escapeHtml(booking.date)} at ${escapeHtml(booking.time)}</strong>.<br><br>` +
        `Booking reference: <strong>${ref}</strong>. We'll send a reminder to ${escapeHtml(booking.phone)}. See you soon! 💜`
    );
    setInputEnabled(true, "Type 'book' for a new appointment…");
  }

  function resetFlow() {
    for (const k in booking) delete booking[k];
    step = "service";
    botSay("No problem — let's start fresh. What service would you like to book?", cfg.services).then(() => {
      setInputEnabled(true, "Choose or type a service…");
    });
  }

  // ---- Wiring ---------------------------------------------------------------
  function openPanel() {
    panel.classList.add("eb-open");
    launcher.classList.add("eb-hidden");
    startConversation();
  }

  function closePanel() {
    panel.classList.remove("eb-open");
    launcher.classList.remove("eb-hidden");
  }

  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  sendBtn.addEventListener("click", () => handleUserInput(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !input.disabled) {
      e.preventDefault();
      handleUserInput(input.value);
    }
  });

  // Public API for host pages.
  window.EmbedBot = {
    open: openPanel,
    close: closePanel,
    config: cfg,
  };
})();
