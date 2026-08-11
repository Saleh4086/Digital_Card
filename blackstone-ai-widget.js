(function () {
  'use strict';

  const CONFIG = {
    agentName: 'Blackstone AI Concierge',
    phone: '(925) 917-5595',
    email: 'gharibyar61@gmail.com',
    bookingUrl: 'contact.html',
    searchUrl: 'search.html',
    homeValueUrl: 'home-value.html',
    propertyManagementUrl: 'property-management.html',
    sellerUrl: 'sellers.html',
    investmentUrl: 'ai-tools.html',
    apiEndpoint: '/api/chat'
  };

  const history = [];
  const root = document.createElement('div');

  root.innerHTML = `
    <button id="bs-ai-launcher" aria-label="Open Blackstone AI Concierge">
      <img src="assets/blackstone-logo.jpg" alt="Blackstone logo" onerror="this.src='assets/logo.png'">
      <span class="bs-badge">✦</span>
    </button>

    <section id="bs-ai-window" aria-label="Blackstone AI Concierge">
      <header class="bs-ai-header">
        <img class="bs-ai-logo" src="assets/blackstone-logo.jpg" alt="Blackstone Signature Properties" onerror="this.src='assets/logo.png'">
        <div class="bs-ai-title">
          <strong>BLACKSTONE AI CONCIERGE</strong>
          <span><i class="bs-online-dot"></i> Online 24/7</span>
        </div>
        <button class="bs-ai-close" aria-label="Close concierge">×</button>
      </header>

      <main class="bs-ai-body" id="bs-ai-body">
        <div class="bs-message bot">
          Hi, I’m the Blackstone AI Concierge. I can answer general questions about buying, selling, rentals, property management, mortgages, and investment properties.
        </div>

        <div class="bs-quick-actions">
          <button data-action="search">⌕ &nbsp; Search for Homes</button>
          <button data-action="value">$ &nbsp; What’s My Home Worth?</button>
          <button data-action="sell">◆ &nbsp; I Want to Sell My Home</button>
          <button data-action="management">▣ &nbsp; Property Management</button>
          <button data-action="showing">▣ &nbsp; Schedule a Showing</button>
          <button data-action="investment">↗ &nbsp; Investment Property Analysis</button>
        </div>
      </main>

      <footer class="bs-ai-footer">
        <form class="bs-ai-form" id="bs-ai-form">
          <button class="bs-ai-mic" type="button" aria-label="Voice input">🎤</button>
          <input class="bs-ai-input" id="bs-ai-input" type="text" maxlength="1000" placeholder="Type a message..." autocomplete="off">
          <button class="bs-ai-send" id="bs-ai-send" type="submit" aria-label="Send">➤</button>
        </form>
        <div class="bs-ai-note">General information only. Contact Sal for advice specific to your situation.</div>
      </footer>
    </section>`;

  document.body.appendChild(root);

  const launcher = root.querySelector('#bs-ai-launcher');
  const win = root.querySelector('#bs-ai-window');
  const close = root.querySelector('.bs-ai-close');
  const form = root.querySelector('#bs-ai-form');
  const input = root.querySelector('#bs-ai-input');
  const send = root.querySelector('#bs-ai-send');
  const body = root.querySelector('#bs-ai-body');

  function openWidget() {
    win.classList.add('open');
    launcher.classList.add('open');
    setTimeout(() => input.focus(), 50);
  }

  function closeWidget() {
    win.classList.remove('open');
    launcher.classList.remove('open');
  }

  function addMessage(text, who) {
    const el = document.createElement('div');
    el.className = `bs-message ${who}`;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function setBusy(busy) {
    input.disabled = busy;
    send.disabled = busy;
    send.textContent = busy ? '…' : '➤';
  }

  async function askAI(message) {
    addMessage(message, 'user');
    history.push({ role: 'user', text: message });
    setBusy(true);
    const thinking = addMessage('Thinking…', 'bot');

    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message,
          history: history.slice(-10)
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        throw new Error(`The server returned an unreadable response (${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
      }

      const reply = typeof data.reply === 'string' ? data.reply.trim() : '';
      if (!reply) throw new Error('The AI returned an empty response.');

      thinking.textContent = reply;
      history.push({ role: 'model', text: reply });
    } catch (error) {
      console.error('Blackstone AI error:', error);
      thinking.textContent = `I’m having trouble reaching the AI service right now. ${error.message}`;
    } finally {
      setBusy(false);
      input.focus();
      body.scrollTop = body.scrollHeight;
    }
  }

  launcher.addEventListener('click', openWidget);
  close.addEventListener('click', closeWidget);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    askAI(message);
  });

  root.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const urls = {
        search: CONFIG.searchUrl,
        value: CONFIG.homeValueUrl,
        sell: CONFIG.sellerUrl,
        management: CONFIG.propertyManagementUrl,
        showing: CONFIG.bookingUrl,
        investment: CONFIG.investmentUrl
      };
      if (urls[action]) window.location.href = urls[action];
    });
  });

  // Enter submits naturally through the form. Shift+Enter is not needed for this single-line input.
})();
