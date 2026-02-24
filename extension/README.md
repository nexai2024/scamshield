# ScamShield Browser Extension

"Scan this" from any webpage. Select text and click the extension to open ScamShield with that text pre-filled.

## Setup

1. **Icons**: Add `icon16.png` and `icon48.png` to this folder, or remove the `icons` and `action.default_icon` keys from `manifest.json` to use the browser default.
2. **App URL**: In `popup.js`, set `APP_ORIGIN` to your ScamShield app URL (e.g. `https://yourapp.com` for production).
3. In Chrome: open `chrome://extensions`, enable Developer mode, click "Load unpacked", and select this `extension` folder.

## Usage

- Select text on any page, then click the ScamShield extension. A new tab opens with the app and the selected text in the scanner (or the first 5000 characters of the page if nothing is selected).
