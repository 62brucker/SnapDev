"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CaptureMetadata, Session } from "@snapdev/protocol";
import QRCode from "qrcode";
import { LocalWebSocketTransport } from "@/transport/local-websocket-transport";
import { copyTextToClipboard } from "@/lib/clipboard";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:4177";
const DEBUG_PROMPT = `Please inspect this mobile app screenshot.\n\nIdentify visual/layout problems and tell me exactly what should be changed in the implementation.\n\nDo not change existing functionality unless necessary.`;

type BrowserCapture = CaptureMetadata & { url: string; blob: Blob; renderedAt: number };

export function Dashboard() {
  const [session, setSession] = useState<Session>();
  const [captures, setCaptures] = useState<BrowserCapture[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>();
  const [mobileSetupUrl, setMobileSetupUrl] = useState<string>();
  const [qrCode, setQrCode] = useState<string>();
  const [feedback, setFeedback] = useState<"image" | "prompt" | "url" | "save" | "clear">();
  const capturesRef = useRef<BrowserCapture[]>([]);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const current = captures[0];

  useEffect(() => { capturesRef.current = captures; }, [captures]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${AGENT_URL}/api/sessions`, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) throw new Error("The local agent did not create a session.");
        return response.json() as Promise<Session>;
      })
      .then((created) => { if (!cancelled) setSession(created); })
      .catch(() => { if (!cancelled) setError("SnapDev cannot reach the local agent. Start it and refresh this page."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!session) return;
    const wsBase = AGENT_URL.replace(/^http/, "ws");
    const transport = new LocalWebSocketTransport(`${wsBase}/ws?sessionId=${encodeURIComponent(session.sessionId)}`);
    const offConnection = transport.onConnectionChange(setConnected);
    const offCapture = transport.onCapture((metadata, bytes) => {
      const blob = new Blob([bytes], { type: metadata.contentType });
      const capture = { ...metadata, blob, url: URL.createObjectURL(blob), renderedAt: Date.now() };
      setCaptures((previous) => {
        const next = [capture, ...previous].slice(0, 10);
        previous.slice(9).forEach((removed) => URL.revokeObjectURL(removed.url));
        return next;
      });
    });
    void transport.connect().catch(() => setError("The browser could not open the live connection."));
    return () => { offCapture(); offConnection(); transport.disconnect(); };
  }, [session]);

  useEffect(() => () => capturesRef.current.forEach((capture) => URL.revokeObjectURL(capture.url)), []);

  const uploadUrl = `${AGENT_URL}/api/capture`;
  const signedUploadUrl = session ? `${uploadUrl}?token=${encodeURIComponent(session.uploadToken)}` : "Creating shortcut URL…";
  const latency = current ? Math.max(0, current.renderedAt - current.serverReceivedAt) : undefined;
  const relativeTime = useMemo(() => current ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(Math.min(0, Math.round((current.timestamp - Date.now()) / 1000)), "second") : "", [current]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const createSetupLink = async () => {
      let phoneHost = window.location.hostname;
      if (phoneHost === "localhost" || phoneHost === "127.0.0.1") {
        const response = await fetch("/api/network");
        if (response.ok) phoneHost = ((await response.json()) as { host: string }).host;
      }

      const mobileConnection = new URL(signedUploadUrl);
      if (mobileConnection.hostname === "localhost" || mobileConnection.hostname === "127.0.0.1") {
        mobileConnection.hostname = phoneHost;
      }
      const setup = new URL("/setup", `${window.location.protocol}//${phoneHost}:${window.location.port}`);
      setup.searchParams.set("connection", mobileConnection.toString());
      setup.searchParams.set("session", session.sessionId);
      const setupLink = setup.toString();
      const image = await QRCode.toDataURL(setupLink, { width: 260, margin: 1, color: { dark: "#172033", light: "#ffffff" } });
      if (!cancelled) {
        setMobileSetupUrl(setupLink);
        setQrCode(image);
      }
    };

    void createSetupLink().catch(() => setError("SnapDev could not create the phone setup QR code."));
    return () => { cancelled = true; };
  }, [session, signedUploadUrl]);

  const showFeedback = useCallback((value: "image" | "prompt" | "url" | "save" | "clear") => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(value);
    feedbackTimer.current = setTimeout(() => setFeedback(undefined), 1600);
  }, []);

  const clear = useCallback(() => {
    setCaptures((previous) => { previous.forEach((capture) => URL.revokeObjectURL(capture.url)); return []; });
    showFeedback("clear");
  }, [showFeedback]);

  const copyImage = useCallback(async () => {
    if (!current) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [current.blob.type]: current.blob })]);
      showFeedback("image");
    } catch { setError("Your browser did not allow image clipboard access."); }
  }, [current, showFeedback]);

  const saveImage = useCallback(() => {
    if (!current) return;

    const extension = current.blob.type === "image/jpeg" ? "jpg" : "png";
    const timestamp = new Date(current.timestamp).toISOString().replace(/[:.]/g, "-");
    const anchor = document.createElement("a");
    anchor.href = current.url;
    anchor.download = `snapdev-${timestamp}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    showFeedback("save");
  }, [current, showFeedback]);

  const copyPrompt = useCallback(async () => {
    try { await copyTextToClipboard(DEBUG_PROMPT); showFeedback("prompt"); }
    catch { setError("Your browser did not allow clipboard access."); }
  }, [showFeedback]);

  const copyShortcutUrl = useCallback(async () => {
    if (!session) return;
    try { await copyTextToClipboard(signedUploadUrl); showFeedback("url"); }
    catch { setError("Your browser did not allow clipboard access."); }
  }, [session, showFeedback, signedUploadUrl]);

  return (
    <main className="shell">
      <header className="topbar">
        <div><p className="eyebrow">LOCAL SCREENSHOT RELAY</p><h1>SNAP<span>DEV</span></h1></div>
        <div className="status"><i className={connected ? "online" : "offline"} />{connected ? "Connected — waiting for screenshot" : "Connecting to agent…"}</div>
      </header>

      {error && <div className="error" role="alert">{error}<button onClick={() => setError(undefined)}>Dismiss</button></div>}

      <section className="pairing">
        <div><p className="section-label">SHORTCUT URL</p><strong>{signedUploadUrl}</strong></div>
        <div><span>Temporary local token</span><code>{session?.uploadToken ?? "Creating session…"}</code></div>
        <button className={`copy-url ${feedback === "url" ? "confirmed" : ""}`} disabled={!session} onClick={copyShortcutUrl}>{feedback === "url" ? "✓ URL copied" : "Copy Shortcut URL"}</button>
      </section>

      <section className="setup-guide" aria-labelledby="setup-title">
        <div className="setup-intro"><p className="section-label">PHONE SETUP</p><h2 id="setup-title">Scan to connect</h2><p>Open your normal Camera app and scan this code. The mobile page contains your connection string and complete iPhone Shortcut instructions.</p>{qrCode ? <a className="qr-link" href={mobileSetupUrl} target="_blank" rel="noreferrer"><img src={qrCode} alt="QR code for SnapDev phone setup" /><span>Scan with Camera</span></a> : <div className="qr-placeholder">Creating QR code…</div>}</div>
        <ol className="setup-steps">
          <li><span>1</span><div><strong>Add “Take Screenshot”</strong><p>Tap Add Action and search for <b>Take Screenshot</b>.</p></div></li>
          <li><span>2</span><div><strong>Add “Get Contents of URL”</strong><p>Paste the Shortcut URL shown above into its URL field.</p></div></li>
          <li><span>3</span><div><strong>Configure the request</strong><dl><div><dt>Method</dt><dd>POST</dd></div><div><dt>Request Body</dt><dd>File</dd></div><div><dt>File</dt><dd>Screenshot</dd></div><div><dt>Headers</dt><dd>None</dd></div></dl></div></li>
          <li><span>4</span><div><strong>Name, save, and run</strong><p>Name it <b>SnapDev Capture</b>, tap Done, then run it whenever you want to send a screenshot.</p></div></li>
        </ol>
      </section>

      <section className="viewer">
        <div className="section-heading"><div><p className="section-label">CURRENT SCREENSHOT</p>{current && <p>{current.deviceName ?? "Mobile device"} · {relativeTime} · {latency} ms relay</p>}</div><div className="actions" aria-live="polite"><button className={feedback === "image" ? "confirmed" : ""} disabled={!current} onClick={copyImage}>{feedback === "image" ? "✓ Image copied" : "Copy image"}</button><button className={feedback === "save" ? "confirmed" : ""} disabled={!current} onClick={saveImage}>{feedback === "save" ? "✓ Download started" : "Download"}</button><button className={feedback === "prompt" ? "confirmed" : ""} onClick={copyPrompt}>{feedback === "prompt" ? "✓ Prompt copied" : "Copy with prompt"}</button><button className={feedback === "clear" ? "confirmed" : ""} disabled={!current} onClick={clear}>{feedback === "clear" ? "✓ Cleared" : "Clear"}</button></div></div>
        <div className={`stage ${current ? "has-image" : ""}`}>
          {current ? <img src={current.url} alt={`Latest screenshot from ${current.deviceName ?? "mobile device"}`} onLoad={() => setCaptures((items) => items.map((item, index) => index === 0 ? { ...item, renderedAt: Date.now() } : item))} /> : <div className="empty"><div className="phone-icon" /><h2>Ready for your next capture</h2><p>Run “SnapDev Capture” on your iPhone. The screenshot will appear here without a refresh.</p></div>}
        </div>
      </section>

      <section className="recent"><p className="section-label">RECENT · BROWSER MEMORY ONLY · NEVER STORED ON SERVER</p><div className="filmstrip">{captures.length ? captures.map((capture) => <button key={capture.id} onClick={() => setCaptures((items) => [capture, ...items.filter((item) => item.id !== capture.id)])}><img src={capture.url} alt="Recent capture thumbnail" /></button>) : <p>No captures yet. Up to 10 will be kept until this tab reloads or closes.</p>}</div></section>
    </main>
  );
}
