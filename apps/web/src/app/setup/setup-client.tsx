"use client";

import { useState } from "react";
import { copyTextToClipboard } from "@/lib/clipboard";

type SetupClientProps = {
  connection: string;
  session: string;
};

export function SetupClient({ connection, session }: SetupClientProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const copyConnection = async () => {
    try {
      await copyTextToClipboard(connection);
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <main className="mobile-setup">
      <header><p className="eyebrow">SNAPDEV PHONE SETUP</p><h1>Connect your <span>capture shortcut</span></h1><p>This private connection sends screenshots directly to the open SnapDev browser session. SnapDev does not store them on the server.</p></header>

      <section className="connection-card">
        <div><p className="section-label">YOUR CONNECTION STRING</p><code>{connection || "Connection link is missing. Scan the QR code again."}</code></div>
        <button type="button" disabled={!connection} className={copied ? "confirmed" : ""} onClick={() => void copyConnection()}>{copied ? "✓ Copied" : "Copy connection string"}</button>
        {copyError && <p className="copy-error">Copy is unavailable. Press and hold the connection string above, then choose Copy.</p>}
        {session && <p className="session-note">This connects to session <b>{session}</b>. It identifies this active browser session, not your personal identity.</p>}
      </section>

      <section className="mobile-instructions">
        <p className="section-label">CREATE THE IPHONE SHORTCUT</p>
        <ol>
          <li><span>1</span><div><strong>Open Shortcuts</strong><p>Tap <b>+</b> to create a shortcut, then add <b>Take Screenshot</b>.</p></div></li>
          <li><span>2</span><div><strong>Add Get Contents of URL</strong><p>Paste the copied connection string into the URL field.</p></div></li>
          <li><span>3</span><div><strong>Configure the request</strong><p>Set Method to <b>POST</b>, Request Body to <b>File</b>, and choose the Screenshot output. No headers are needed.</p></div></li>
          <li><span>4</span><div><strong>Name and test it</strong><p>Name it <b>SnapDev Capture</b>, tap Done, then run it once and allow requested permissions.</p></div></li>
        </ol>
      </section>

      <section className="back-tap">
        <p className="section-label">OPTIONAL · TRIPLE BACK TAP</p>
        <h2>Run it by tapping the back of your iPhone</h2>
        <p>Open <b>Settings → Accessibility → Touch → Back Tap → Triple Tap</b>, then select <b>SnapDev Capture</b>.</p>
        <p className="fine-print">Back Tap is an iPhone accessibility feature. Android setup and automation vary by phone manufacturer and are not configured by this iOS Shortcut.</p>
      </section>
    </main>
  );
}
