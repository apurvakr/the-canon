/* global React */
/* =========================================================================
   LANDING — the front door. A full-bleed entrance with the wordmark, a
   one-line description, and a registration form posted to Formspree.
   ========================================================================= */
const { useState: useStateL } = React;

/* Formspree endpoint — submissions from the landing form are sent here. */
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgdylkg";

function LandingPage({ clusters, onEnter }) {
  const [status, setStatus] = useStateL("idle");   // idle | sending | done | error
  const colors = Object.keys(clusters).map(k => clusters[k].color);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });
      if (res.ok) { setStatus("done"); form.reset(); }
      else setStatus("error");
    } catch (err) { setStatus("error"); }
  }

  return (
    <div className="landing grain">
      <div className="landing-inner">
        <span className="landing-eyebrow">115 papers · 9 themes · one library</span>
        <h1 className="landing-word">The Canon</h1>
        <div className="landing-dots">
          {colors.map((c, i) => <i key={i} style={{ background: c }} />)}
        </div>
        <p className="landing-line">The papers that most shaped how we understand economics &amp; political philosophy — summarised, rated, and connected.</p>

        {status !== "done" ? (
          <form className="landing-form" onSubmit={onSubmit}>
            <div className="landing-fields">
              <input className="landing-input" name="name" type="text" placeholder="Your name" required autoComplete="name" />
              <input className="landing-input" name="email" type="email" placeholder="Email address" required autoComplete="email" />
            </div>
            <button className="landing-btn" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Joining…" : "Request access"}
            </button>
            {status === "error" && <p className="landing-err">Something went wrong — please try again.</p>}
          </form>
        ) : (
          <div className="landing-done">
            <p className="landing-done-h">You're on the list.</p>
            <p className="landing-done-p">Welcome to The Canon.</p>
          </div>
        )}

        <button className="landing-skip" onClick={onEnter}>
          {status === "done" ? "Enter The Canon →" : "Explore without registering →"}
        </button>
      </div>
    </div>
  );
}

window.LandingPage = LandingPage;
