const EARLY_ACCESS_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc6Nxveur3rgN8zR-FUWtITYFJeSlQOCXA8OMCt3THAFsSing/viewform?usp=publish-editor";

export function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing-nav" aria-label="Primary navigation">
        <a className="landing-logo" href="#top" aria-label="SnapDev home">SNAP<span>DEV</span></a>
        <div className="landing-nav-links"><a href="#how-it-works">How it works</a><a href="#privacy">Privacy</a><a href="#pricing">Pricing</a></div>
        <a className="nav-cta" href={EARLY_ACCESS_URL} target="_blank" rel="noreferrer">Join early access <span>↗</span></a>
      </nav>

      <section className="landing-hero" id="top">
        <div className="hero-copy">
          <p className="hero-kicker"><i /> Private beta · Built for real devices</p>
          <h1>Triple-tap your phone.<br /><span>Show your AI coder.</span></h1>
          <p className="hero-lead">Send the screen you are testing from a real iPhone directly to your development browser—without AirDrop, Photos, or manual uploads.</p>
          <div className="hero-actions">
            <a className="landing-primary" href={EARLY_ACCESS_URL} target="_blank" rel="noreferrer">Join the private beta <span>↗</span></a>
            <a className="landing-secondary" href="#how-it-works"><span className="play">▶</span> See how it works</a>
          </div>
          <div className="hero-notes"><span>✓ No mobile SDK</span><span>✓ No screenshot storage</span><span>✓ iPhone today</span></div>
        </div>

        <div className="relay-demo" aria-label="SnapDev product workflow preview">
          <div className="demo-toolbar"><div><i /><i /><i /></div><span>app.snapdev.dev</span><b>Live</b></div>
          <div className="demo-body">
            <div className="demo-side"><strong>S<span>D</span></strong><i /><i /><i /></div>
            <div className="demo-main">
              <div className="demo-heading"><div><small>LIVE CAPTURE</small><strong>Checkout screen</strong></div><span><i /> Connected</span></div>
              <div className="demo-canvas">
                <div className="demo-phone"><div className="phone-status"><b>9:41</b><span>● ◔ ▰</span></div><div className="phone-content"><small>CHECKOUT</small><h3>Your order</h3><div className="order-row"><i /><span><b>Everyday sneakers</b><small>Cloud white · 42</small></span><b>$89</b></div><div className="broken-card"><span>Card details</span><b>Layout overflow →</b></div><button>Complete order</button></div></div>
                <div className="capture-pulse"><span>✓</span><b>Captured from iPhone</b><small>Just now · 684 ms</small></div>
              </div>
              <div className="demo-actions"><button>Copy image</button><button>Copy with prompt</button><button>Download</button></div>
            </div>
          </div>
        </div>
      </section>

      <section className="pain-strip" aria-label="Current workflow compared with SnapDev">
        <p>Take screenshot</p><span>→</span><p>Open Photos</p><span>→</span><p>Share to Mac</p><span>→</span><p>Find the file</p><span>→</span><p>Upload to AI</p><b>Five steps become one gesture.</b>
      </section>

      <section className="landing-section how-section" id="how-it-works">
        <div className="section-copy"><p className="landing-eyebrow">THE FASTEST PATH FROM DEVICE TO DEBUGGER</p><h2>Stay in the flow.<br />Keep testing on the real thing.</h2><p>SnapDev removes the handoff between seeing a visual bug on your phone and showing it to the coding assistant already helping you fix it.</p></div>
        <div className="workflow-grid">
          <article><span>01</span><div className="step-icon phone-step">▯</div><h3>See the problem</h3><p>Test your app normally on a physical iPhone—not a simulator or mirrored approximation.</p></article>
          <article><span>02</span><div className="step-icon tap-step">•••</div><h3>Triple-tap</h3><p>An iPhone Shortcut captures the current screen and sends it through your private session.</p></article>
          <article><span>03</span><div className="step-icon prompt-step">⌁</div><h3>Show your AI coder</h3><p>The image appears live in your browser, ready to copy with a focused debugging prompt.</p></article>
        </div>
      </section>

      <section className="privacy-section" id="privacy">
        <div className="privacy-visual">
          <div className="privacy-ring outer"><div className="privacy-ring middle"><div className="privacy-core"><span>⌁</span><b>Live relay</b><small>Encrypted in transit</small></div></div></div>
          <span className="privacy-label label-phone">Your phone</span><span className="privacy-label label-browser">Your browser</span>
        </div>
        <div className="privacy-copy"><p className="landing-eyebrow">PRIVATE BY DEFAULT</p><h2>Your screenshots are not our product.</h2><p>SnapDev is designed as a live relay, not a screenshot library. A capture passes through the connection to your active browser and is discarded by the server after delivery.</p><ul><li><i>✓</i><span><b>No cloud screenshot history</b><small>Recent captures remain only in browser memory.</small></span></li><li><i>✓</i><span><b>Save only when you choose</b><small>Download directly to your own computer.</small></span></li><li><i>✓</i><span><b>Revocable device connections</b><small>Every hosted pairing will use an expiring private token.</small></span></li></ul></div>
      </section>

      <section className="audience-section">
        <p className="landing-eyebrow">MADE FOR MOBILE BUILDERS</p>
        <h2>One tiny tool for the part of AI coding that still feels manual.</h2>
        <div className="audience-grid"><article><span>RN</span><h3>React Native</h3><p>Capture real-device UI issues that do not reproduce cleanly in a simulator.</p></article><article><span>FL</span><h3>Flutter</h3><p>Move visual context from physical hardware into your coding loop instantly.</p></article><article><span>AI</span><h3>AI-first developers</h3><p>Give Codex, Cursor, Claude Code and other assistants the screen you are discussing.</p></article></div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="pricing-copy"><p className="landing-eyebrow">FOUNDING ACCESS</p><h2>Help shape the product before launch.</h2><p>We are inviting a small group of mobile developers to test SnapDev and tell us where the real friction lives.</p><div className="founder-quote"><span>“</span><p>If this removes five interruptions from every debugging session, it has done its job.</p></div></div>
        <div className="price-card"><p>EARLY ACCESS PLAN</p><div><b>$9</b><span>/ month<br /><small>proposed price</small></span></div><ul><li>✓ Unlimited live captures</li><li>✓ Multiple paired devices</li><li>✓ AI-ready copy workflow</li><li>✓ No server-side screenshot history</li></ul><a href={EARLY_ACCESS_URL} target="_blank" rel="noreferrer">Request early access <span>↗</span></a><small>No charge today. We want your feedback first.</small></div>
      </section>

      <section className="faq-section">
        <div><p className="landing-eyebrow">QUESTIONS, ANSWERED</p><h2>Before you tap.</h2></div>
        <div className="faq-list"><details open><summary>Do I need to install an iPhone app?<span>+</span></summary><p>No. The current prototype uses Apple Shortcuts and Back Tap. Scan a setup code once, then use the shortcut whenever you need it.</p></details><details><summary>Does SnapDev save my screenshots?<span>+</span></summary><p>No. The core product relays captures to your active browser and discards the server copy immediately. Browser-memory captures disappear when the tab closes.</p></details><details><summary>Does it work with Android?<span>+</span></summary><p>Android support is planned. The first beta focuses on making the iPhone workflow dependable before expanding device automation.</p></details><details><summary>Can the AI change my code automatically?<span>+</span></summary><p>Not yet. The beta gets the image and a debugging prompt into your existing AI coder quickly. Deeper agent integrations are the next step.</p></details></div>
      </section>

      <section className="closing-cta"><p className="landing-eyebrow">BUILD WITH US</p><h2>Your next mobile bug<br />could take one tap to explain.</h2><p>Join the private beta and help turn a working prototype into the missing bridge between real devices and AI coders.</p><a href={EARLY_ACCESS_URL} target="_blank" rel="noreferrer">Join the private beta <span>↗</span></a></section>

      <footer className="landing-footer"><a className="landing-logo" href="#top">SNAP<span>DEV</span></a><p>Real-device context for AI-assisted development.</p><div><a href="https://github.com/62brucker/SnapDev" target="_blank" rel="noreferrer">GitHub ↗</a><a href="#privacy">Privacy</a><a href="#top">Back to top ↑</a></div></footer>
    </main>
  );
}
