(() => {
  'use strict';

  const API_URL = '/api/chat';
  const ROOT_ID = 'blackstone-ai-root';

  // Remove any older Blackstone widget versions so desktop and mobile use one design.
  [
    '#blackstone-ai-widget',
    '#blackstone-ai-chat',
    '.blackstone-ai-widget',
    '.blackstone-ai-chat',
    '.bs-ai-widget',
    '.ai-chat-widget'
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (node.id !== ROOT_ID) node.remove();
    });
  });

  if (document.getElementById(ROOT_ID)) return;

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <button class="bsai-launcher" type="button" aria-label="Open Blackstone AI">
      <span class="bsai-spark">✦</span> Ask Blackstone AI
    </button>
    <section class="bsai-panel" aria-label="Blackstone AI Concierge" aria-hidden="true">
      <header class="bsai-header">
        <img src="assets/logo.png" alt="Blackstone logo" class="bsai-logo">
        <div>
          <strong>BLACKSTONE</strong>
          <span>AI Concierge · Online 24/7</span>
        </div>
        <button class="bsai-close" type="button" aria-label="Close">×</button>
      </header>
      <div class="bsai-messages" aria-live="polite">
        <div class="bsai-message assistant">Hi! I’m the Blackstone AI Concierge. Ask about buying, selling, mortgage payments, investing, rentals, or property management.</div>
      </div>
      <div class="bsai-actions">
        <a href="search.html">⌕ <span>Search for Homes</span></a>
        <a href="home-value.html">$ <span>What’s My Home Worth?</span></a>
        <a href="sellers.html">◆ <span>I Want to Sell My Home</span></a>
        <a class="featured" href="property-management.html">▦ <span>Property Management</span></a>
        <a href="contact.html">▣ <span>Schedule a Showing</span></a>
        <a href="properties.html">↗ <span>Investment Property Analysis</span></a>
      </div>
      <form class="bsai-form">
        <label class="bsai-mic" aria-hidden="true">🎤</label>
        <input class="bsai-input" type="text" autocomplete="off" placeholder="Type a message…" aria-label="Message">
        <button class="bsai-send" type="submit" aria-label="Send">➤</button>
      </form>
      <p class="bsai-disclaimer">General information only. Contact Sal for advice specific to your situation.</p>
    </section>`;

  document.body.appendChild(root);

  const launcher = root.querySelector('.bsai-launcher');
  const panel = root.querySelector('.bsai-panel');
  const close = root.querySelector('.bsai-close');
  const form = root.querySelector('.bsai-form');
  const input = root.querySelector('.bsai-input');
  const messages = root.querySelector('.bsai-messages');
  const history = [];

  function setOpen(open) {
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (open) setTimeout(() => input.focus(), 50);
  }

  const APPROVED_LINK_HOSTS = new Set([
    'blackstonesignatureproperty.com',
    'www.blackstonesignatureproperty.com',
    'zillow.com',
    'www.zillow.com',
    'realtor.com',
    'www.realtor.com',
    'redfin.com',
    'www.redfin.com',
    'maps.google.com',
    'www.google.com'
  ]);

  function linkifyApprovedUrls(container, text) {
    const urlPattern = /(https:\/\/[^\s<>"']+)/gi;
    let lastIndex = 0;
    let match;

    while ((match = urlPattern.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) container.appendChild(document.createTextNode(before));

      let urlText = match[1];
      const trailing = urlText.match(/[),.!?;:]+$/)?.[0] || '';
      if (trailing) urlText = urlText.slice(0, -trailing.length);

      try {
        const url = new URL(urlText);
        if (APPROVED_LINK_HOSTS.has(url.hostname.toLowerCase())) {
          const link = document.createElement('a');
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = url.hostname.replace(/^www\./, '');
          link.className = 'bsai-inline-link';
          container.appendChild(link);
        } else {
          container.appendChild(document.createTextNode(urlText));
        }
      } catch {
        container.appendChild(document.createTextNode(urlText));
      }

      if (trailing) container.appendChild(document.createTextNode(trailing));
      lastIndex = match.index + match[1].length;
    }

    const rest = text.slice(lastIndex);
    if (rest) container.appendChild(document.createTextNode(rest));
  }

  function addMessage(text, role) {
    const item = document.createElement('div');
    item.className = `bsai-message ${role}`;

    if (role === 'assistant') {
      linkifyApprovedUrls(item, text);
    } else {
      item.textContent = text;
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  launcher.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';
    input.disabled = true;

    const loading = addMessage('Thinking…', 'assistant loading');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });

      let data = {};
      try { data = await response.json(); } catch {}

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const reply = data.reply || 'I’m sorry, I could not create a response.';
      loading.textContent = '';
      linkifyApprovedUrls(loading, reply);
      loading.classList.remove('loading');

      history.push({ role: 'user', text: message });
      history.push({ role: 'assistant', text: reply });
      if (history.length > 12) history.splice(0, history.length - 12);
    } catch (error) {
      loading.textContent = `The AI connection failed: ${error.message}`;
      loading.classList.remove('loading');
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
})();
