<div align="center">

# 🔐 India College Auto Login

### Stop typing your password every single day.

**Auto-login for Moodle + Webmail at every IIT, NIT & Indian college.**
Smart CAPTCHA solving. Works on any `*.ac.in` login page. No Tampermonkey. No setup hassle.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)]()
[![Works On](https://img.shields.io/badge/Works%20On-Brave%20%7C%20Chrome%20%7C%20Edge%20%7C%20Firefox-orange.svg)]()
[![Made for](https://img.shields.io/badge/Made%20for-Indian%20Students-red.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

</div>

---

## The Problem

You open Moodle. Type Kerberos ID. Type password. Solve math CAPTCHA. Done.  
You open Webmail. Type Kerberos ID. Type password. Done.  
**Every. Single. Day.**

## The Fix

Install this extension once. Enter credentials once. **Never again.**

```
Visit Moodle       →  logged in automatically (< 1 second)
Visit Webmail      →  logged in automatically (< 1 second)
Math CAPTCHA?      →  solved automatically
Image CAPTCHA?     →  credentials filled, you solve it once
New login page?    →  "Add auto-login here?" pill — click Yes
3 failed attempts? →  fill-only mode, amber banner guides you
```

---

## Install in 30 Seconds

### Brave / Chrome / Edge / Arc

1. Download this repo → **Code → Download ZIP → Extract**
2. Go to `brave://extensions` (or `chrome://extensions`)
3. Enable **Developer Mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the extracted folder

Done. Visit Moodle — one-time popup asks for your ID + password. Fill it. That's it forever.

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from the extracted folder

---

## How It Works

### Known portals — instant auto-login

Detects the login form, fills credentials, solves math CAPTCHA, clicks Login. Done before you blink.

### Any other `*.ac.in` page — smart prompt

A pill notification appears bottom-right of screen:

```
🔐 Add auto-login here?
   attendance.iitd.ac.in — Will use saved ID mt6240344
   [✓ Add this site]  [Not now]
```

Click **Add this site** → auto-login activates from the next visit onward.

### Image CAPTCHA — fail-limit system

For pages like the Attendance Portal that use image CAPTCHAs the extension cannot solve:

```
Visit 1  →  fill credentials + try auto-submit
Visit 2  →  fail detected → try again (attempt 2/3)
Visit 3  →  fail detected → try again (attempt 3/3)
Visit 4  →  FILL-ONLY MODE:
             credentials auto-filled ✓
             amber banner: "Solve CAPTCHA manually"
             [↺ Try Auto-Submit] button to reset anytime
```

No infinite loops. No account lockouts. Just smart graceful degradation.

---

## Supported Portals

### Moodle (LMS)

| College | URL | CAPTCHA |
|---|---|---|
| IIT Delhi | moodle.iitd.ac.in | Math — auto-solved |
| IIT Delhi New | moodlenew.iitd.ac.in | Math — auto-solved |
| IIT Bombay | moodle.iitb.ac.in | None |
| IIT Madras | courses.iitm.ac.in | None |
| IIT Kharagpur | kgpmoodle.iitkgp.ac.in/moodle | None |
| IIT Kharagpur CSE | moodlecse.iitkgp.ac.in/moodle | None |
| IIT Kanpur CSE | moodle.cse.iitk.ac.in | None |
| IIT Mandi | lms.iitmandi.ac.in | None |
| IIT Jammu | lms.iitjammu.ac.in | None |
| IIT Patna | ais.iitp.ac.in/moodle | None |
| IIT Palakkad | moodle.iitpkd.ac.in | None |
| IIT Hyderabad | moodle.iith.ac.in | None |
| IIT Bhilai | lms.iitbhilai.ac.in | None |
| NIT Calicut | moodle.nitc.ac.in | None |
| NIT Rourkela | newmoodle.nitrkl.ac.in | None |
| NIT Trichy | lms.nitt.edu | None |
| NIT Silchar | moodle.nits.ac.in | None |
| MNIT Jaipur | moodle.mnit.ac.in | None |
| NIT Patna | elearn.nitp.ac.in | None |
| NIT Uttarakhand | lms.nitu.ac.in | None |

### Webmail — Roundcube

| College | URL |
|---|---|
| IIT Delhi | webmail.iitd.ac.in |
| IIT Delhi (alt) | webmail.iitd.ernet.in/roundcube |
| IIT Kanpur | webmail.iitk.ac.in |
| IIT Kanpur CSE | roundcube.cse.iitk.ac.in |
| IIT Mandi | webmail.iitmandi.ac.in |
| IIT Jammu | webmail.iitjammu.ac.in |
| IIT Patna | webmail.iitp.ac.in |
| IIT Palakkad | webmail.iitpkd.ac.in |
| IIT Hyderabad | webmail.iith.ac.in |
| IIT Bhilai | webmail.iitbhilai.ac.in |
| NIT Calicut | webmail.nitc.ac.in |
| NIT Rourkela | webmail.nitrkl.ac.in |
| NIT Trichy | webmail.nitt.edu |
| NIT Silchar | webmail.nits.ac.in |
| MNIT Jaipur | webmail.mnit.ac.in |
| NIT Patna | webmail.nitp.ac.in |

### Webmail — Zimbra

| College | URL |
|---|---|
| IIT Kharagpur | iitkgpmail.iitkgp.ac.in |
| IIT Roorkee | mail.iitr.ac.in |

### Not Supported (SSO / OAuth)

These redirect to Google or Microsoft — no browser extension can inject there:

| College | System |
|---|---|
| IIT Guwahati | Microsoft 365 |
| IIT Bombay webmail | Institutional SSO |
| IIT Madras email | Google Workspace |
| IIT Kharagpur post-2020 | Google Workspace |

---

## Math CAPTCHA — How It's Solved

IITD Moodle uses plain-text arithmetic CAPTCHAs in the HTML:

```
"What is 4 added to 7?"            →  11
"What is the first number of 9?"   →  9
"Write the answer to 6 − 2 = ?"   →  4
```

The extension reads the question, parses numbers and the operation keyword, evaluates it, fills the answer — all client-side, zero API calls.

| Keyword | Operation |
|---|---|
| `first` | First number |
| `second` | Second number |
| `add`, `sum`, `plus` | Addition |
| `subtract`, `minus` | Subtraction |
| `multiply`, `times` | Multiplication |
| `divide` | Division |

---

## Security & Privacy

**Your password never leaves your device. Ever.**

| Property | Detail |
|---|---|
| Storage | `chrome.storage.local` — browser-managed, encrypted at rest |
| Network requests | Zero — no fetch(), no XHR, no external calls |
| Code | ~800 lines, zero obfuscation — read it yourself |
| Telemetry | None |
| Third-party dependencies | None |
| Scope | Only runs on `*.ac.in` pages |

> Do not use on shared or public computers.

---

## Add Your College

The extension already dynamically detects any `*.ac.in` login page. To add it permanently to the list for all users:

**1. Add your URL to `manifest.json`:**
```json
"https://moodle.yourcollege.ac.in/*",
"https://webmail.yourcollege.ac.in/*"
```

**2. Open a Pull Request** with college name, URLs, and CAPTCHA type.

---

## Contributing

| | |
|---|---|
| Bug | Open an issue |
| Add a college | PR with URL in manifest.json |
| Different CAPTCHA format | Open an issue with the HTML |
| Feature request | Open a discussion |

---

## Known Limitations

- **Image / reCAPTCHA** — credentials auto-filled, submit paused after 3 failures, amber banner guides manual completion
- **SSO / OAuth** — cannot inject into Google or Microsoft login flows
- **2FA** — not supported
- **VPN-gated portals** — network restrictions are out of scope

---

## File Structure

```
india-college-autologin/
├── manifest.json   — Extension config + URL patterns
├── content.js      — All logic in ~800 lines of readable JS
├── README.md       — This file
└── LICENSE         — MIT
```

---

## Built On

- [abdur75648/moodle-auto-login](https://github.com/abdur75648/moodle-auto-login) — original IITD CAPTCHA idea
- [4rshdeep's gist](https://gist.github.com/4rshdeep/b1a9d071c47520395d6c9ae9b054b4f0) — IITD CAPTCHA DOM analysis
- [kwikadi/IITD-QOL](https://github.com/kwikadi/IITD-QOL) — IITD quality-of-life scripts

---

## License

MIT — free to use, fork, redistribute, and improve.

---

<div align="center">

Made with ☕ by a student, for every student in India.

**If this saves you 30 seconds a day — that's 3 hours a year back in your life.**

⭐ Star this repo so your batchmates can find it.

</div>
