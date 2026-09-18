/**
 * filings4u shared inactivity/session security manager
 * - 10 minute inactivity timeout
 * - branded 60 second warning
 * - synchronized across same-browser tabs
 * - works for admin and client portals
 */
(function () {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
  const DEFAULT_WARNING_MS = 60 * 1000;
  const ACTIVITY_WRITE_THROTTLE_MS = 5000;
  const CHANNEL_NAME = 'filings4u-session-security';
  const KEY_PREFIX = 'f4u:session:last_activity:';

  const state = {
    started: false,
    expiring: false,
    warningOpen: false,
    db: null,
    userId: '',
    portal: '',
    loginPage: '',
    timeoutMs: DEFAULT_TIMEOUT_MS,
    warningMs: DEFAULT_WARNING_MS,
    lastActivity: 0,
    lastWrite: 0,
    interval: null,
    channel: null,
    listeners: []
  };

  const now = () => Date.now();
  const keyFor = (userId) => KEY_PREFIX + String(userId || 'anonymous');

  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) {}
  }

  function safeRemove(key) {
    try { window.localStorage.removeItem(key); } catch (_) {}
  }

  function getStoredActivity() {
    const value = Number(safeGet(keyFor(state.userId)) || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function loginUrl(reason) {
    const page = state.loginPage || (state.portal === 'admin' ? 'admin-login.html' : 'customer-login.html');
    const current = (location.pathname.split('/').pop() || '') + location.search + location.hash;
    const joiner = page.includes('?') ? '&' : '?';
    return page + joiner + 'reason=' + encodeURIComponent(reason || 'session_timeout') + '&returnTo=' + encodeURIComponent(current);
  }

  function ensureModal() {
    let root = document.getElementById('f4uSessionOverlay');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'f4uSessionOverlay';
    root.className = 'f4u-session-overlay';
    root.hidden = true;
    root.innerHTML = `
      <div class="f4u-session-card" role="dialog" aria-modal="true" aria-labelledby="f4uSessionTitle" aria-describedby="f4uSessionMessage">
        <div class="f4u-session-brand">
          <img src="images/logo.png" alt="filings4u">
          <span>Secure session</span>
        </div>
        <div class="f4u-session-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>
          </svg>
        </div>
        <h2 id="f4uSessionTitle">Your session will expire soon</h2>
        <p id="f4uSessionMessage">For your security, you will be signed out after 10 minutes of inactivity.</p>
        <div class="f4u-session-countdown" id="f4uSessionCountdown" aria-live="polite">60 seconds remaining</div>
        <div class="f4u-session-actions" id="f4uSessionActions">
          <button type="button" class="f4u-session-secondary" id="f4uSessionSignOut">Sign out now</button>
          <button type="button" class="f4u-session-primary" id="f4uSessionContinue">Stay signed in</button>
        </div>
        <div class="f4u-session-security-note">filings4u automatically protects unattended accounts.</div>
      </div>`;
    document.body.appendChild(root);

    document.getElementById('f4uSessionContinue')?.addEventListener('click', () => markActivity(true));
    document.getElementById('f4uSessionSignOut')?.addEventListener('click', () => expire('manual_signout', true));
    return root;
  }

  function showWarning(remainingMs) {
    if (state.expiring) return;
    const root = ensureModal();
    const title = document.getElementById('f4uSessionTitle');
    const message = document.getElementById('f4uSessionMessage');
    const actions = document.getElementById('f4uSessionActions');
    if (title) title.textContent = 'Your session will expire soon';
    if (message) message.textContent = 'For your security, you will be signed out after 10 minutes of inactivity.';
    if (actions) actions.hidden = false;
    root.classList.remove('is-expired');
    root.hidden = false;
    state.warningOpen = true;
    updateCountdown(remainingMs);
  }

  function hideWarning() {
    if (state.expiring) return;
    const root = document.getElementById('f4uSessionOverlay');
    if (root) root.hidden = true;
    state.warningOpen = false;
  }

  function updateCountdown(remainingMs) {
    const el = document.getElementById('f4uSessionCountdown');
    if (!el) return;
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    el.textContent = seconds === 1 ? '1 second remaining' : `${seconds} seconds remaining`;
  }

  function showExpired() {
    const root = ensureModal();
    const title = document.getElementById('f4uSessionTitle');
    const message = document.getElementById('f4uSessionMessage');
    const countdown = document.getElementById('f4uSessionCountdown');
    const actions = document.getElementById('f4uSessionActions');
    if (title) title.textContent = 'Your secure session has ended';
    if (message) message.textContent = 'You were automatically signed out after 10 minutes of inactivity. Sign in again to continue.';
    if (countdown) countdown.textContent = 'Redirecting to secure sign in…';
    if (actions) actions.hidden = true;
    root.classList.add('is-expired');
    root.hidden = false;
    state.warningOpen = false;
  }

  function broadcast(message) {
    try { state.channel?.postMessage({ ...message, userId: state.userId }); } catch (_) {}
  }

  function setActivityTimestamp(ts, doBroadcast) {
    state.lastActivity = ts;
    state.lastWrite = ts;
    safeSet(keyFor(state.userId), String(ts));
    if (doBroadcast) broadcast({ type: 'activity', ts });
  }

  function markActivity(force) {
    if (!state.started || state.expiring) return;

    const stored = Math.max(state.lastActivity || 0, getStoredActivity() || 0);
    const current = now();

    // Never allow a late click/focus to revive a session that has already timed out.
    if (stored && current - stored >= state.timeoutMs) {
      expire('session_timeout');
      return;
    }

    if (!force && current - state.lastWrite < ACTIVITY_WRITE_THROTTLE_MS) {
      state.lastActivity = current;
      if (state.warningOpen) hideWarning();
      return;
    }

    setActivityTimestamp(current, true);
    if (state.warningOpen) hideWarning();
  }

  function check() {
    if (!state.started || state.expiring) return;
    const current = now();
    const stored = getStoredActivity();
    if (stored > state.lastActivity) state.lastActivity = stored;

    const last = state.lastActivity || current;
    const elapsed = current - last;
    const remaining = state.timeoutMs - elapsed;

    if (remaining <= 0) {
      expire('session_timeout');
      return;
    }

    if (remaining <= state.warningMs) {
      showWarning(remaining);
    } else if (state.warningOpen) {
      hideWarning();
    }
  }

  async function performSignOut(reason) {
    try {
      if (state.db?.auth?.signOut) await state.db.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('[filings4u session] sign out returned an error', error);
    } finally {
      location.replace(loginUrl(reason === 'manual_signout' ? 'signed_out' : 'session_timeout'));
    }
  }

  function expire(reason, immediate) {
    if (state.expiring) return;
    state.expiring = true;
    showExpired();
    broadcast({ type: 'logout', reason: reason || 'session_timeout', ts: now() });
    const delay = immediate ? 350 : 1600;
    window.setTimeout(() => performSignOut(reason || 'session_timeout'), delay);
  }

  function bindActivity() {
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    events.forEach((name) => {
      const fn = () => markActivity(false);
      window.addEventListener(name, fn, { passive: true, capture: true });
      state.listeners.push([window, name, fn]);
    });

    const focusFn = () => markActivity(false);
    window.addEventListener('focus', focusFn, true);
    state.listeners.push([window, 'focus', focusFn]);

    const visibilityFn = () => {
      if (document.visibilityState === 'visible') {
        check();
        if (!state.expiring) markActivity(false);
      }
    };
    document.addEventListener('visibilitychange', visibilityFn, true);
    state.listeners.push([document, 'visibilitychange', visibilityFn]);

    const storageFn = (event) => {
      if (event.key !== keyFor(state.userId) || !event.newValue) return;
      const ts = Number(event.newValue || 0);
      if (Number.isFinite(ts) && ts > state.lastActivity) {
        state.lastActivity = ts;
        if (state.warningOpen) hideWarning();
      }
    };
    window.addEventListener('storage', storageFn);
    state.listeners.push([window, 'storage', storageFn]);

    if ('BroadcastChannel' in window) {
      try {
        state.channel = new BroadcastChannel(CHANNEL_NAME);
        state.channel.addEventListener('message', (event) => {
          const data = event.data || {};
          if (String(data.userId || '') !== state.userId) return;
          if (data.type === 'activity' && Number(data.ts) > state.lastActivity) {
            state.lastActivity = Number(data.ts);
            if (state.warningOpen) hideWarning();
          }
          if (data.type === 'logout') expire(data.reason || 'session_timeout');
        });
      } catch (_) {}
    }
  }

  function start(options) {
    options = options || {};
    const userId = String(options.user?.id || options.userId || '');
    if (!userId || !options.db) return false;

    if (state.started) {
      // Same authenticated identity: keep the existing security monitor.
      if (state.userId === userId) return true;
      stop();
    }

    state.started = true;
    state.expiring = false;
    state.db = options.db;
    state.userId = userId;
    state.portal = options.portal === 'admin' ? 'admin' : 'client';
    state.loginPage = options.loginPage || (state.portal === 'admin' ? 'admin-login.html' : 'customer-login.html');
    state.timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;
    state.warningMs = Number(options.warningMs) > 0 ? Number(options.warningMs) : DEFAULT_WARNING_MS;

    const stored = getStoredActivity();
    state.lastActivity = stored || now();
    state.lastWrite = stored || 0;
    if (!stored) setActivityTimestamp(state.lastActivity, false);

    const beginMonitoring = () => {
      if (!state.started || state.interval) return;
      bindActivity();
      state.interval = window.setInterval(check, 1000);
      check();
    };

    if (document.body) beginMonitoring();
    else document.addEventListener('DOMContentLoaded', beginMonitoring, { once: true });
    return true;
  }

  function stop() {
    if (state.interval) clearInterval(state.interval);
    state.listeners.forEach(([target, name, fn]) => {
      try { target.removeEventListener(name, fn, true); } catch (_) {
        try { target.removeEventListener(name, fn); } catch (_) {}
      }
    });
    state.listeners = [];
    try { state.channel?.close(); } catch (_) {}
    Object.assign(state, {
      started: false,
      expiring: false,
      warningOpen: false,
      db: null,
      userId: '',
      portal: '',
      loginPage: '',
      lastActivity: 0,
      lastWrite: 0,
      interval: null,
      channel: null
    });
  }

  function resetForUser(userId) {
    if (!userId) return;
    safeSet(keyFor(userId), String(now()));
  }

  function clearForUser(userId) {
    if (!userId) return;
    safeRemove(keyFor(userId));
  }

  window.filings4uSessionSecurity = {
    start,
    stop,
    markActivity: () => markActivity(true),
    resetForUser,
    clearForUser,
    expire: () => expire('session_timeout'),
    get timeoutMinutes() { return DEFAULT_TIMEOUT_MS / 60000; }
  };
})();
