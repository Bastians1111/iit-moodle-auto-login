(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     PORTAL DETECTION
     Figures out which login system we're on so we use the right
     field IDs and submit strategy.
  ═══════════════════════════════════════════════════════════════ */
  const PORTAL = (() => {
    const h = window.location.hostname;
    const p = window.location.pathname;

    if (document.getElementById('rcmloginuser') ||
        document.getElementById('rcmloginpwd') ||
        document.querySelector('.rcmail-login-form') ||
        p.includes('/roundcube')) return 'roundcube';

    if (document.getElementById('username') && document.getElementById('password') &&
        (h.includes('iitkgpmail') || h.includes('zimbra') ||
         document.querySelector('.ZLoginButton') ||
         document.querySelector('#loginButton'))) return 'zimbra';

    if (document.getElementById('loginbtn') ||
        p.includes('/login/index.php')) return 'moodle';

    return 'unknown';
  })();

  /* ═══════════════════════════════════════════════════════════════
     STORAGE  (chrome.storage.local — stays on your device only)
  ═══════════════════════════════════════════════════════════════ */
  const storage = {
    save:  (u, p) => chrome.storage.local.set({ ml_user: u, ml_pass: p }),
    clear: ()     => chrome.storage.local.remove(['ml_user', 'ml_pass']),
    load:  (cb)   => chrome.storage.local.get(['ml_user', 'ml_pass'],
                       r => cb(r.ml_user || null, r.ml_pass || null))
  };

  /* ═══════════════════════════════════════════════════════════════
     CSS  (shared across all portals)
  ═══════════════════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('ml-style')) return;
    const s = document.createElement('style');
    s.id = 'ml-style';
    s.textContent = `
      #ml-overlay {
        position:fixed;inset:0;z-index:2147483647;
        background:rgba(5,10,20,0.9);backdrop-filter:blur(10px);
        display:flex;align-items:center;justify-content:center;
        font-family:'Segoe UI',system-ui,sans-serif;
      }
      #ml-box {
        background:#0c1524;border:1px solid #1e3a5f;border-radius:18px;
        padding:40px 36px 32px;width:360px;
        box-shadow:0 32px 80px rgba(0,0,0,.75),0 0 0 1px #1e3a5f;
        color:#e2e8f0;
      }
      #ml-box .ml-badge {
        display:inline-block;font-size:.65rem;font-weight:700;
        text-transform:uppercase;letter-spacing:.1em;
        background:#0ea5e920;color:#38bdf8;border:1px solid #0ea5e940;
        border-radius:20px;padding:3px 10px;margin-bottom:14px;
      }
      #ml-box h2 {
        margin:0 0 5px;font-size:1.25rem;font-weight:800;
        color:#f1f5f9;letter-spacing:-.025em;
      }
      #ml-box p {
        margin:0 0 24px;font-size:.78rem;color:#64748b;line-height:1.55;
      }
      #ml-box label {
        display:block;font-size:.68rem;font-weight:700;text-transform:uppercase;
        letter-spacing:.1em;color:#475569;margin-bottom:6px;
      }
      #ml-box input[type=text], #ml-box input[type=password] {
        width:100%;box-sizing:border-box;background:#111f33;
        border:1.5px solid #1e3a5f;border-radius:9px;padding:11px 14px;
        color:#f1f5f9;font-size:.92rem;margin-bottom:14px;
        outline:none;transition:border-color .2s,box-shadow .2s;
      }
      #ml-box input:focus {
        border-color:#38bdf8;box-shadow:0 0 0 3px #38bdf820;
      }
      #ml-btn-save {
        width:100%;background:linear-gradient(135deg,#0ea5e9,#2563eb);
        color:#fff;border:none;border-radius:9px;padding:12px;
        font-size:.95rem;font-weight:700;cursor:pointer;
        transition:opacity .18s,transform .1s;margin-top:4px;
        letter-spacing:.01em;
      }
      #ml-btn-save:hover  { opacity:.88; }
      #ml-btn-save:active { transform:scale(.98); }
      #ml-note {
        margin-top:14px;font-size:.78rem;text-align:center;
        color:#4ade80;min-height:18px;transition:color .2s;
      }
      #ml-btn-clear {
        display:block;margin:12px auto 0;background:none;border:none;
        color:#334155;font-size:.72rem;cursor:pointer;
        text-decoration:underline;text-underline-offset:2px;
      }
      #ml-btn-clear:hover { color:#f87171; }

      /* ── Toast ── */
      #ml-toast {
        position:fixed;bottom:24px;right:24px;
        background:#0c1524;border:1px solid #1e3a5f;
        color:#7dd3fc;padding:10px 18px;border-radius:10px;
        font-family:'Segoe UI',system-ui,sans-serif;font-size:.82rem;
        z-index:2147483646;box-shadow:0 8px 24px rgba(0,0,0,.55);
        animation:ml-in .25s ease;display:flex;align-items:center;gap:8px;
      }
      #ml-toast .ml-dot {
        width:7px;height:7px;border-radius:50%;
        background:#38bdf8;flex-shrink:0;
        animation:ml-pulse 1.2s ease infinite;
      }
      @keyframes ml-in    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      @keyframes ml-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════════════════
     TOAST
  ═══════════════════════════════════════════════════════════════ */
  function toast(msg, ms = 3000) {
    const old = document.getElementById('ml-toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'ml-toast';
    el.innerHTML = `<span class="ml-dot"></span>${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el?.remove(), ms);
  }

  /* ═══════════════════════════════════════════════════════════════
     MATH CAPTCHA SOLVER  (Moodle only — webmail has no CAPTCHA)
     IITD Moodle uses a plain-text arithmetic captcha in the DOM.
     Input id starts with "valuepkg". Question is in sibling/label.
  ═══════════════════════════════════════════════════════════════ */
  function solveMoodleCaptcha() {
    const inp = document.querySelector('input[id^="valuepkg"]');
    if (!inp) {
      // Fallback — generic captcha/answer field
      const fb = document.querySelector('input[name="answer"],input[name="captcha"],input[id*="captcha"]');
      if (fb) {
        const box  = fb.closest('.form-group,.fitem,td,div') || fb.parentElement;
        const nums = ((box?.textContent || '').match(/\d+/g) || []).map(Number);
        if (nums.length >= 2) {
          fb.value = nums[0] + nums[1];
          fb.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }
      return false;
    }

    // Get question text
    let q = '';
    const lbl = document.querySelector(`label[for="${inp.id}"]`);
    if (lbl) {
      q = lbl.textContent;
    } else {
      let node = inp.previousSibling;
      while (node) {
        const t = (node.textContent || '').trim();
        if (t) { q = t; break; }
        node = node.previousSibling;
      }
      if (!q) q = inp.parentElement?.textContent || '';
    }

    const ql   = q.toLowerCase();
    const nums = (ql.match(/\d+/g) || []).map(Number);
    if (!nums.length) return false;

    let ans = null;
    if      (ql.includes('first')    && !ql.includes('second')) ans = nums[0];
    else if (ql.includes('second')   && !ql.includes('first'))  ans = nums[1] ?? nums[0];
    else if (ql.includes('add')      || ql.includes('sum')  || ql.includes('plus'))  ans = nums[0] + nums[1];
    else if (ql.includes('subtract') || ql.includes('minus'))   ans = nums[0] - nums[1];
    else if (ql.includes('multipl')  || ql.includes('times'))   ans = nums[0] * nums[1];
    else if (ql.includes('divid'))                               ans = Math.round(nums[0] / nums[1]);
    else {
      const m = ql.match(/(\d+)\s*([+\-x×*\/÷])\s*(\d+)/);
      if (m) {
        const A = +m[1], op = m[2], B = +m[3];
        if      (op==='+')                        ans = A + B;
        else if (op==='-')                        ans = A - B;
        else if (op==='*'||op==='x'||op==='×')   ans = A * B;
        else if (op==='/'||op==='÷')              ans = Math.round(A / B);
      } else {
        ans = nums.length >= 2 ? nums[0] + nums[1] : nums[0];
      }
    }

    if (ans !== null) {
      inp.value = ans;
      inp.dispatchEvent(new Event('input',  { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`[AutoLogin] CAPTCHA: "${q.trim()}" → ${ans}`);
      return true;
    }
    return false;
  }

  /* ═══════════════════════════════════════════════════════════════
     NATIVE INPUT SETTER  (works with React/Vue/Angular-style pages)
  ═══════════════════════════════════════════════════════════════ */
  function setVal(el, val) {
    if (!el) return;
    const nset = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    nset.call(el, val);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ═══════════════════════════════════════════════════════════════
     LOGIN HANDLERS — one per portal type
  ═══════════════════════════════════════════════════════════════ */

  // ── Moodle ──────────────────────────────────────────────────
  function loginMoodle(u, p) {
    const userEl  = document.getElementById('username');
    const passEl  = document.getElementById('password');
    const loginEl = document.getElementById('loginbtn');
    if (!userEl || !passEl || !loginEl) return;

    setVal(userEl, u);
    setVal(passEl, p);

    const captchaSolved = solveMoodleCaptcha();
    toast(captchaSolved
      ? '🔑 Moodle — credentials + CAPTCHA filled'
      : '🔑 Moodle — logging in…');
    setTimeout(() => loginEl.click(), 500);
  }

  // ── Roundcube Webmail ────────────────────────────────────────
  // Field IDs:  #rcmloginuser  #rcmloginpwd
  // Submit btn: #rcmloginsubmit  (or first submit input)
  function loginRoundcube(u, p) {
    const userEl = document.getElementById('rcmloginuser');
    const passEl = document.getElementById('rcmloginpwd');
    const btnEl  = document.getElementById('rcmloginsubmit')
                || document.querySelector('input[type="submit"]')
                || document.querySelector('button[type="submit"]');

    if (!userEl || !passEl) {
      // Sometimes Roundcube loads the form after a short delay
      setTimeout(() => loginRoundcube(u, p), 800);
      return;
    }

    setVal(userEl, u);
    setVal(passEl, p);
    toast('📧 Webmail — logging in…');
    setTimeout(() => btnEl?.click(), 400);
  }

  // ── Zimbra Webmail ───────────────────────────────────────────
  // Field IDs:  #username  #password
  // Submit btn: #loginButton  or  .ZLoginButton
  function loginZimbra(u, p) {
    const userEl = document.getElementById('username')
                || document.querySelector('input[name="username"]');
    const passEl = document.getElementById('password')
                || document.querySelector('input[name="password"]');
    const btnEl  = document.getElementById('loginButton')
                || document.querySelector('.ZLoginButton')
                || document.querySelector('input[type="submit"]')
                || document.querySelector('button[type="submit"]');

    if (!userEl || !passEl) {
      setTimeout(() => loginZimbra(u, p), 800);
      return;
    }

    setVal(userEl, u);
    setVal(passEl, p);
    toast('📧 Zimbra Webmail — logging in…');
    setTimeout(() => btnEl?.click(), 400);
  }

  /* ═══════════════════════════════════════════════════════════════
     DISPATCH — route to the right handler
  ═══════════════════════════════════════════════════════════════ */
  function doLogin(u, p) {
    switch (PORTAL) {
      case 'moodle':     loginMoodle(u, p);     break;
      case 'roundcube':  loginRoundcube(u, p);  break;
      case 'zimbra':     loginZimbra(u, p);     break;
      default:
        // Unknown portal — try Moodle fields, then Roundcube fields
        if (document.getElementById('username'))       loginMoodle(u, p);
        else if (document.getElementById('rcmloginuser')) loginRoundcube(u, p);
        break;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     PORTAL LABEL  (shown in the popup badge)
  ═══════════════════════════════════════════════════════════════ */
  function portalLabel() {
    switch (PORTAL) {
      case 'moodle':    return '📚 Moodle';
      case 'roundcube': return '📧 Roundcube Webmail';
      case 'zimbra':    return '📧 Zimbra Webmail';
      default:          return '🔐 Auto Login';
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     FIRST-TIME POPUP
  ═══════════════════════════════════════════════════════════════ */
  function showPopup(onSave) {
    injectCSS();
    const overlay = document.createElement('div');
    overlay.id = 'ml-overlay';
    overlay.innerHTML = `
      <div id="ml-box">
        <div class="ml-badge">${portalLabel()}</div>
        <h2>Auto Login Setup</h2>
        <p>Enter your college credentials once. They're saved locally and used to log you into <strong>Moodle</strong> and <strong>Webmail</strong> automatically — no CAPTCHA hassle, every time.</p>
        <label>College / Kerberos ID</label>
        <input id="ml-u" type="text" placeholder="e.g. cs1234567" autocomplete="username" />
        <label>Password</label>
        <input id="ml-p" type="password" placeholder="Your college password" autocomplete="current-password" />
        <button id="ml-btn-save">Save &amp; Login →</button>
        <div id="ml-note"></div>
        <button id="ml-btn-clear">Clear saved credentials</button>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('ml-u')?.focus(), 80);

    document.getElementById('ml-btn-save').addEventListener('click', () => {
      const u    = (document.getElementById('ml-u').value || '').trim();
      const p    = document.getElementById('ml-p').value || '';
      const note = document.getElementById('ml-note');
      if (!u || !p) {
        note.style.color = '#fbbf24';
        note.textContent = '⚠ Please fill both fields.';
        return;
      }
      storage.save(u, p);
      note.style.color = '#4ade80';
      note.textContent = '✓ Saved! Logging in…';
      setTimeout(() => { overlay.remove(); onSave(u, p); }, 650);
    });

    document.getElementById('ml-btn-clear').addEventListener('click', () => {
      storage.clear();
      document.getElementById('ml-note').style.color = '#f87171';
      document.getElementById('ml-note').textContent = '🗑 Credentials cleared.';
    });

    overlay.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('ml-btn-save').click();
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     IS THIS A LOGIN PAGE?
  ═══════════════════════════════════════════════════════════════ */
  function isLoginPage() {
    const p = window.location.pathname;
    // Moodle
    if (p.includes('/login/index.php') || document.getElementById('loginbtn')) return true;
    // Roundcube — URL has ?_task=login or it's the root with the login form
    if (document.getElementById('rcmloginuser')) return true;
    // Zimbra — has login form
    if (document.getElementById('loginButton') || document.querySelector('.ZLoginButton')) return true;
    // Generic webmail — root URL with a form
    if ((p === '/' || p === '') && document.querySelector('form input[type="password"]')) return true;
    return false;
  }

  /* ═══════════════════════════════════════════════════════════════
     ENTRY POINT
  ═══════════════════════════════════════════════════════════════ */
  function run() {
    if (!isLoginPage()) return;

    storage.load((u, p) => {
      if (u && p) doLogin(u, p);
      else        showPopup(doLogin);
    });
  }

  // Some webmail pages (Roundcube) inject the form after DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 300));
  } else {
    setTimeout(run, 300);
  }

})();


/* ═══════════════════════════════════════════════════════════════
   PATCH v4.1 — Dynamic detection + Fail-limit system
   Appended to existing v3 code. All original logic unchanged.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Guard — don't double-run ── */
  if (window.__alPatchLoaded) return;
  window.__alPatchLoaded = true;

  const DOMAIN = location.hostname;

  /* ── Re-use the storage already set up in main IIFE ── */
  const st = {
    load: (cb) => chrome.storage.local.get(['ml_user','ml_pass'],
                    r => cb(r.ml_user || null, r.ml_pass || null)),
    save: (u,p) => chrome.storage.local.set({ ml_user: u, ml_pass: p }),
  };

  /* ── Per-domain dynamic list ── */
  const DYN_KEY = 'ml_dynamic_domains';
  const dynSt = {
    getAll: (cb) => chrome.storage.local.get(DYN_KEY, r => cb(r[DYN_KEY] || [])),
    add:    (d, cb) => dynSt.getAll(list => {
      if (!list.includes(d)) list.push(d);
      chrome.storage.local.set({ [DYN_KEY]: list }, cb);
    }),
  };

  /* ─────────────────────────────────────────────────────────────
     FAIL-LIMIT SYSTEM
     Detects image CAPTCHAs and repeated login failures.
     After MAX_FAILS attempts → fill credentials only, skip submit.
     User sees amber banner: "Solve CAPTCHA manually / Try Again"
  ───────────────────────────────────────────────────────────── */
  const MAX_FAILS = 3;

  const ERR_PATTERNS = [
    /invalid captcha/i, /wrong captcha/i, /captcha (is )?incorrect/i,
    /invalid (user|password|credential)/i, /incorrect password/i,
    /login (failed|error|invalid)/i, /authentication failed/i,
    /invalid (username|userid)/i,
  ];

  const hasLoginError = () =>
    ERR_PATTERNS.some(re => re.test(document.body?.innerText || ''));

  const hasImageCaptcha = () => !!(
    document.querySelector('form img[src*="captcha" i]') ||
    document.querySelector('form img[alt*="captcha" i]') ||
    document.querySelector('input[name*="captcha" i][type="text"]') ||
    document.querySelector('.captcha, #captcha, [id*="captcha"]') ||
    // Heuristic: form has an <img> + text input beside a password field
    (document.querySelector('form img') &&
     document.querySelector('form input[type="text"]') &&
     document.querySelector('form input[type="password"]'))
  );

  const failKey    = d => 'ml_f_' + d;
  const attemptKey = d => 'ml_a_' + d;
  const getFailCount  = d => parseInt(sessionStorage.getItem(failKey(d)) || '0', 10);
  const bumpFail      = d => sessionStorage.setItem(failKey(d), getFailCount(d) + 1);
  const resetFails    = d => { sessionStorage.removeItem(failKey(d)); sessionStorage.removeItem(attemptKey(d)); };
  const markAttempted = d => sessionStorage.setItem(attemptKey(d), '1');
  const wasAttempted  = d => sessionStorage.getItem(attemptKey(d)) === '1';

  /* Amber fill-only banner */
  function showFillOnlyBanner(domain, onReset) {
    document.getElementById('ml-fill-banner')?.remove();
    const bar = document.createElement('div');
    bar.id = 'ml-fill-banner';
    Object.assign(bar.style, {
      position: 'fixed', bottom: '0', left: '0', right: '0',
      zIndex: '2147483647', background: '#1c1008',
      borderTop: '2px solid #f59e0b', padding: '11px 20px',
      display: 'flex', alignItems: 'center', gap: '12px',
      fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: '13px',
      color: '#fcd34d', boxShadow: '0 -4px 24px rgba(0,0,0,.5)',
    });
    bar.innerHTML = `
      <span style="font-size:20px;flex-shrink:0">⚠️</span>
      <span style="flex:1;line-height:1.45">
        <strong style="color:#fbbf24;display:block;margin-bottom:2px">
          Image CAPTCHA detected — ${domain}
        </strong>
        <span style="color:#a16207;font-size:11px">
          Credentials auto-filled. Solve the CAPTCHA above, then click Login.
          Auto-submit paused after ${MAX_FAILS} failed attempts.
        </span>
      </span>
      <button id="ml-fill-reset" style="
        padding:6px 14px;border-radius:7px;border:1px solid #f59e0b;
        background:transparent;color:#fbbf24;font-size:12px;font-weight:700;
        cursor:pointer;white-space:nowrap;">↺ Try Auto-Submit</button>
      <button id="ml-fill-close" style="
        background:none;border:none;color:#78350f;font-size:20px;
        cursor:pointer;line-height:1;padding:0 4px">✕</button>
    `;
    document.body.appendChild(bar);

    document.getElementById('ml-fill-reset').addEventListener('click', () => {
      resetFails(domain);
      bar.remove();
      onReset();
    });
    document.getElementById('ml-fill-close').addEventListener('click', () => bar.remove());
  }

  /* ── Smart field detector ── */
  function detectFields() {
    const passEl = [...document.querySelectorAll('input[type="password"]')]
      .find(el => el.offsetParent !== null && !el.disabled);
    if (!passEl) return null;

    const form = passEl.closest('form');
    const scope = form || document;

    const USER_SELS = [
      'input[type="email"]',
      'input[id*="user" i]','input[name*="user" i]',
      'input[id*="login" i]','input[name*="login" i]',
      'input[id*="email" i]','input[name*="email" i]',
      'input[placeholder*="user" i]','input[placeholder*="email" i]',
      'input[placeholder*="id" i]','input[autocomplete="username"]',
      'input[name="_user"]','input[id="rcmloginuser"]','input[id="username"]',
    ];
    let userEl = null;
    for (const sel of USER_SELS) {
      const el = scope.querySelector(sel);
      if (el && el.offsetParent !== null && !el.disabled) { userEl = el; break; }
    }
    if (!userEl) {
      userEl = [...document.querySelectorAll(
        'input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"])'
      )].find(el => el.offsetParent !== null && !el.disabled);
    }
    if (!userEl) return null;

    const SUBMIT_SELS = [
      'button[type="submit"]','input[type="submit"]',
      '#rcmloginsubmit','#loginbtn','#loginButton','#submitButton',
      'button.mainaction','button[class*="submit" i]','button[class*="login" i]',
      'button:not([type])',
    ];
    let submitEl = null;
    for (const sel of SUBMIT_SELS) {
      const el = scope.querySelector(sel);
      if (el && el.offsetParent !== null) { submitEl = el; break; }
    }

    return { userEl, passEl, submitEl };
  }

  function nativeSet(el, val) {
    if (!el) return;
    try {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, val);
    } catch (_) { el.value = val; }
    ['input','change','blur'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
  }

  function showToast(msg, ms = 2800) {
    document.getElementById('ml-dyn-toast')?.remove();
    const el = document.createElement('div');
    el.id = 'ml-dyn-toast';
    Object.assign(el.style, {
      position: 'fixed', bottom: '24px', right: '20px', zIndex: '2147483646',
      background: '#0f172a', border: '1px solid #1e3a5f', color: '#7dd3fc',
      padding: '10px 16px', borderRadius: '10px',
      fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: '13px',
      boxShadow: '0 8px 24px rgba(0,0,0,.5)', maxWidth: '320px',
    });
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el?.remove(), ms);
  }

  /* ── Main auto-login with fail-limit ── */
  function autoLoginDynamic(u, p) {
    const fields = detectFields();
    if (!fields) { showToast('⚠ Could not find login fields'); return; }

    // Detect failure from previous page load
    if (wasAttempted(DOMAIN) && hasLoginError()) {
      bumpFail(DOMAIN);
      sessionStorage.removeItem(attemptKey(DOMAIN));
    }

    const fails  = getFailCount(DOMAIN);
    const imgCap = hasImageCaptcha();

    const doFillOnly = () => {
      nativeSet(fields.userEl, u);
      nativeSet(fields.passEl, p);
      showFillOnlyBanner(DOMAIN, () => {
        resetFails(DOMAIN);
        st.load((u2, p2) => { if (u2 && p2) autoLoginDynamic(u2, p2); });
      });
    };

    // Image CAPTCHA on first visit → fill only immediately
    if (imgCap && fails === 0) {
      nativeSet(fields.userEl, u);
      nativeSet(fields.passEl, p);
      showToast('✏️ Image CAPTCHA — credentials filled, submit manually');
      showFillOnlyBanner(DOMAIN, () => {
        resetFails(DOMAIN);
        st.load((u2, p2) => { if (u2 && p2) autoLoginDynamic(u2, p2); });
      });
      return;
    }

    // Exceeded fail limit → fill only
    if (fails >= MAX_FAILS) { doFillOnly(); return; }

    // Normal: fill + submit
    nativeSet(fields.userEl, u);
    nativeSet(fields.passEl, p);

    // Try to solve Moodle math captcha if present
    const captchaInput = document.querySelector('input[id^="valuepkg"]');
    if (captchaInput) {
      const lbl = document.querySelector(`label[for="${captchaInput.id}"]`);
      const q = (lbl?.textContent || captchaInput.parentElement?.textContent || '').toLowerCase();
      const nums = (q.match(/\d+/g) || []).map(Number);
      if (nums.length >= 2) {
        let ans = null;
        if (q.includes('add') || q.includes('sum') || q.includes('plus')) ans = nums[0] + nums[1];
        else if (q.includes('subtract') || q.includes('minus')) ans = nums[0] - nums[1];
        else if (q.includes('first')) ans = nums[0];
        else if (q.includes('second')) ans = nums[1];
        else ans = nums[0] + nums[1];
        if (ans !== null) { captchaInput.value = ans; captchaInput.dispatchEvent(new Event('input', { bubbles: true })); }
      }
    }

    markAttempted(DOMAIN);
    const attempt = fails + 1;
    showToast(`🔑 ${DOMAIN} — attempt ${attempt}/${MAX_FAILS}`);
    setTimeout(() => fields.submitEl?.click(), 500);
  }

  /* ── CSS for the dynamic "Add this site?" pill ── */
  function injectPillCSS() {
    if (document.getElementById('ml-pill-css')) return;
    const s = document.createElement('style');
    s.id = 'ml-pill-css';
    s.textContent = `
      #ml-dyn-pill {
        position:fixed; bottom:28px; right:22px; z-index:2147483647;
        display:flex; align-items:flex-start; gap:11px;
        background:#0f1e35; border:1px solid #1e3a5f; border-radius:14px;
        padding:14px 16px; width:290px;
        box-shadow:0 12px 40px rgba(0,0,0,.6),0 0 0 1px #1e3a5f80;
        font-family:'Segoe UI',system-ui,sans-serif;
        color:#cbd5e1; animation:ml-pill-in .28s cubic-bezier(.16,1,.3,1);
      }
      @keyframes ml-pill-in {
        from{opacity:0;transform:translateY(18px) scale(.96)} to{opacity:1;transform:none}
      }
      #ml-dyn-pill .picon { font-size:22px; flex-shrink:0; margin-top:1px; }
      #ml-dyn-pill .pbody { flex:1; min-width:0; }
      #ml-dyn-pill .ptitle {
        font-size:.82rem; font-weight:700; color:#f1f5f9;
        margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      #ml-dyn-pill .psub { font-size:.71rem; color:#64748b; margin-bottom:10px; line-height:1.4; }
      #ml-dyn-pill .psub b { color:#94a3b8; }
      #ml-dyn-pill .pbtns { display:flex; gap:7px; }
      #ml-dyn-pill .pbtn {
        flex:1; padding:6px 0; border-radius:7px; border:none;
        font-size:.76rem; font-weight:700; cursor:pointer;
        transition:opacity .15s,transform .1s;
      }
      #ml-dyn-pill .pbtn:active { transform:scale(.97); }
      #ml-dyn-pill .pbtn.yes { background:#0ea5e9; color:#fff; }
      #ml-dyn-pill .pbtn.yes:hover { background:#38bdf8; }
      #ml-dyn-pill .pbtn.no { background:transparent; color:#475569; border:1px solid #1e3a5f; }
      #ml-dyn-pill .pbtn.no:hover { color:#f87171; border-color:#f87171; }
      #ml-dyn-pill .px { flex-shrink:0; background:none; border:none; color:#334155; font-size:15px; cursor:pointer; line-height:1; }
      #ml-dyn-pill .px:hover { color:#94a3b8; }
    `;
    document.head.appendChild(s);
  }

  /* ── "Add auto-login to this site?" pill ── */
  function showDynamicPrompt(domain, savedUser) {
    injectPillCSS();
    document.getElementById('ml-dyn-pill')?.remove();

    const pill = document.createElement('div');
    pill.id = 'ml-dyn-pill';
    pill.innerHTML = `
      <div class="picon">🔐</div>
      <div class="pbody">
        <div class="ptitle">Add auto-login here?</div>
        <div class="psub">
          <b>${domain}</b><br>
          ${savedUser ? `Will use saved ID <b>${savedUser}</b>` : `You'll enter credentials once`}
        </div>
        <div class="pbtns">
          <button class="pbtn yes" id="ml-dyn-yes">✓ Add this site</button>
          <button class="pbtn no"  id="ml-dyn-no">Not now</button>
        </div>
      </div>
      <button class="px" id="ml-dyn-close">✕</button>
    `;
    document.body.appendChild(pill);

    const timer = setTimeout(() => pill?.remove(), 15000);

    document.getElementById('ml-dyn-yes').addEventListener('click', () => {
      clearTimeout(timer); pill.remove();
      dynSt.add(domain, () => {
        st.load((u, p) => {
          if (u && p) autoLoginDynamic(u, p);
          else {
            // showPopup is defined in the main IIFE — call it via a custom event
            window.dispatchEvent(new CustomEvent('ml-show-popup', { detail: { cb: 'dynLogin' } }));
            // Fallback: inline mini-prompt
            const ep = document.createElement('div');
            ep.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(5,10,20,.9);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,system-ui,sans-serif';
            ep.innerHTML = `<div style="background:#0c1524;border:1px solid #1e3a5f;border-radius:16px;padding:36px 32px;width:340px;color:#e2e8f0">
              <h2 style="margin:0 0 6px;font-size:1.1rem;color:#7dd3fc">🔐 Enter credentials</h2>
              <p style="margin:0 0 18px;font-size:.78rem;color:#64748b">These will be saved and used on all approved sites.</p>
              <label style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;display:block;margin-bottom:5px">Kerberos / College ID</label>
              <input id="ml-ep-u" type="text" placeholder="e.g. cs1234567" style="width:100%;box-sizing:border-box;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 13px;color:#f1f5f9;font-size:.92rem;margin-bottom:12px;outline:none">
              <label style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;display:block;margin-bottom:5px">Password</label>
              <input id="ml-ep-p" type="password" placeholder="Your password" style="width:100%;box-sizing:border-box;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 13px;color:#f1f5f9;font-size:.92rem;margin-bottom:16px;outline:none">
              <button id="ml-ep-save" style="width:100%;background:#0ea5e9;color:#fff;border:none;border-radius:8px;padding:11px;font-size:.95rem;font-weight:700;cursor:pointer">Save & Login →</button>
              <div id="ml-ep-note" style="text-align:center;font-size:.78rem;min-height:18px;margin-top:10px;color:#4ade80"></div>
            </div>`;
            document.body.appendChild(ep);
            setTimeout(() => document.getElementById('ml-ep-u')?.focus(), 80);
            document.getElementById('ml-ep-save').addEventListener('click', () => {
              const u2 = (document.getElementById('ml-ep-u').value || '').trim();
              const p2 = document.getElementById('ml-ep-p').value || '';
              if (!u2 || !p2) { document.getElementById('ml-ep-note').textContent = '⚠ Fill both fields'; return; }
              st.save(u2, p2);
              document.getElementById('ml-ep-note').textContent = '✓ Saved! Logging in…';
              setTimeout(() => { ep.remove(); autoLoginDynamic(u2, p2); }, 650);
            });
            ep.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('ml-ep-save').click(); });
          }
        });
      });
    });

    document.getElementById('ml-dyn-no').addEventListener('click', () => { clearTimeout(timer); pill.remove(); });
    document.getElementById('ml-dyn-close').addEventListener('click', () => { clearTimeout(timer); pill.remove(); });
  }

  /* ── Known hardcoded domains — skip prompt for these ── */
  const KNOWN = new Set([
    'moodle.iitd.ac.in','moodlenew.iitd.ac.in','moodle.iitb.ac.in',
    'courses.iitm.ac.in','kgpmoodle.iitkgp.ac.in','moodlecse.iitkgp.ac.in',
    'moodle.cse.iitk.ac.in','lms.iitmandi.ac.in','lms.iitjammu.ac.in',
    'ais.iitp.ac.in','moodle.iitpkd.ac.in','moodle.iith.ac.in',
    'lms.iitbhilai.ac.in','moodle.nitc.ac.in','newmoodle.nitrkl.ac.in',
    'lms.nitt.edu','moodle.nits.ac.in','moodle.mnit.ac.in',
    'elearn.nitp.ac.in','lms.nitu.ac.in',
    'webmail.iitd.ac.in','webmail.iitd.ernet.in','webmail.iitk.ac.in',
    'roundcube.cse.iitk.ac.in','webmail.iitmandi.ac.in','webmail.iitjammu.ac.in',
    'webmail.iitp.ac.in','webmail.iitpkd.ac.in','webmail.iith.ac.in',
    'webmail.iitbhilai.ac.in','webmail.nitc.ac.in','webmail.nitrkl.ac.in',
    'webmail.nitt.edu','webmail.nits.ac.in','webmail.mnit.ac.in',
    'webmail.nitp.ac.in','iitkgpmail.iitkgp.ac.in','mail.iitr.ac.in','zimbra.iitr.ac.in',
  ]);

  /* ── Dynamic runner ── */
  function runDynamic() {
    if (KNOWN.has(DOMAIN)) return; // handled by main IIFE
    if (!document.querySelector('input[type="password"]')) return;

    dynSt.getAll(savedList => {
      if (savedList.includes(DOMAIN)) {
        st.load((u, p) => {
          if (u && p) autoLoginDynamic(u, p);
          else showDynamicPrompt(DOMAIN, null);
        });
      } else {
        st.load(u => showDynamicPrompt(DOMAIN, u));
      }
    });
  }

  /* ── Boot ── */
  function tryRun(n) {
    if (document.querySelector('input[type="password"]') || n > 10) runDynamic();
    else setTimeout(() => tryRun(n + 1), 300);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => tryRun(0), 300));
  else
    setTimeout(() => tryRun(0), 300);

})();
