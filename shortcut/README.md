# SnapDev Capture shortcut

SnapDev uses an iOS Shortcut rather than a native app for the MVP.

1. Start SnapDev on the computer and open the dashboard.
2. In Shortcuts on the iPhone, create a shortcut named **SnapDev Capture**.
3. Add **Take Screenshot**.
4. Add **Get Contents of URL** and use the upload URL shown in the dashboard. Replace `localhost` with the computer's LAN IP address (for example, `http://192.168.1.23:4177/api/capture`).
5. Set the method to `POST`, request body to **File**, and select the screenshot output.
6. Add headers:
   - `Authorization`: `Bearer <token shown in the dashboard>`
   - `Content-Type`: `image/png`
   - `X-SnapDev-Device`: a useful label such as `iPhone 16`
7. Run the shortcut from the Action Button or Back Tap while the app under test is visible.

The phone and computer must be on the same Wi-Fi. The upload token is intentionally renewed whenever a new browser session is created. Screenshot bytes are relayed in memory and are never written to disk.
