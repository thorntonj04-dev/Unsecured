import { useState } from "react";
import { saveAuditResult } from "./firebase";
import { LOCAL_ESSAYS } from "./essays";

// ─── DESIGN TOKENS (mirrors App.jsx) ─────────────────────────────────────────
const C = {
  navy: "#0d1720", navyMid: "#162030", navyLight: "#1e2f42",
  cream: "#f4efe6", creamDark: "#ece5d8",
  gold: "#b8943f", goldLight: "#d4a84b",
  g100: "#f7f5f2", g200: "#e5e0d8", g400: "#9e9489",
  g600: "#68605a", g800: "#2a2420",
};

const TC = {
  Pressure: "#8b6e52", Urgency: "#4e6878",
  "Internal Rules": "#5f7050", Reconfiguration: "#7a6b52",
};

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  // Pressure
  { theme: "Pressure", text: "When you're tired at the end of a hard stretch, what does that tiredness mean to you?", answers: [
    { text: "It means I'm doing something right — I earned it.", score: 1 },
    { text: "It's just how things are. I don't read much into it.", score: 2 },
    { text: "It means something probably needs adjusting.", score: 3 },
    { text: "It's a signal I take seriously and respond to.", score: 4 },
  ]},
  { theme: "Pressure", text: "When pressure increases, your first move is usually to:", answers: [
    { text: "Push harder — add more effort until it stabilizes.", score: 1 },
    { text: "Keep going and hope it levels out.", score: 2 },
    { text: "Try to understand what's driving it before responding.", score: 3 },
    { text: "Evaluate what's legitimate and what can be removed.", score: 4 },
  ]},
  { theme: "Pressure", text: "How does your body register pressure?", answers: [
    { text: "I don't notice much until I crash.", score: 1 },
    { text: "I notice the signs — tension, fatigue — but push through.", score: 2 },
    { text: "I've learned to read those signals and slow down.", score: 3 },
    { text: "I catch it early and adjust before it builds.", score: 4 },
  ]},
  // Urgency
  { theme: "Urgency", text: "A message arrives at 9pm. What actually happens?", answers: [
    { text: "I respond — faster is better.", score: 1 },
    { text: "I feel anxious until I respond, even if I wait.", score: 2 },
    { text: "I decide based on actual importance, not timing.", score: 3 },
    { text: "It waits until morning unless it's a real emergency.", score: 4 },
  ]},
  { theme: "Urgency", text: "In how you actually operate day-to-day, speed and importance are:", answers: [
    { text: "Basically the same thing — fast means it matters.", score: 1 },
    { text: "Different in theory, but hard to separate in practice.", score: 2 },
    { text: "I can usually tell the difference, even when urgency blurs it.", score: 3 },
    { text: "Clearly distinct — I evaluate both before responding.", score: 4 },
  ]},
  { theme: "Urgency", text: "The relief you feel after finishing something urgent is:", answers: [
    { text: "Proof that acting quickly was the right call.", score: 1 },
    { text: "Temporary — something else is usually already waiting.", score: 2 },
    { text: "Just the system settling. Not necessarily proof of correctness.", score: 3 },
    { text: "Something I've learned not to confuse with actual resolution.", score: 4 },
  ]},
  // Internal Rules
  { theme: "Internal Rules", text: "The rules that shape how you work were mostly:", answers: [
    { text: "Absorbed from environments I was in — I didn't consciously choose them.", score: 1 },
    { text: "A mix. Some chosen, some just happened.", score: 2 },
    { text: "I've identified a few key ones and am examining them.", score: 3 },
    { text: "Largely examined — I know which ones I've kept and which I've released.", score: 4 },
  ]},
  { theme: "Internal Rules", text: "When you fall short of your own standard, it feels like:", answers: [
    { text: "Evidence of something about who I am.", score: 1 },
    { text: "It lingers longer than it probably should.", score: 2 },
    { text: "A problem to understand and solve.", score: 3 },
    { text: "Data — something to learn from without a lot of charge attached.", score: 4 },
  ]},
  { theme: "Internal Rules", text: "Being available when people need you means:", answers: [
    { text: "You're responsible and reliable — it's who you are.", score: 1 },
    { text: "It matters to you even when it costs more than it should.", score: 2 },
    { text: "Something you value but actively set limits around.", score: 3 },
    { text: "One part of reliability — not the whole definition of it.", score: 4 },
  ]},
  // Reconfiguration
  { theme: "Reconfiguration", text: "Your current level of alertness and readiness feels:", answers: [
    { text: "This is just how I am — I'm not sure it's something to change.", score: 1 },
    { text: "Higher than it needs to be, but I haven't figured out how to bring it down.", score: 2 },
    { text: "Something I'm actively working on — I can see movement.", score: 3 },
    { text: "Largely calibrated to what's actually in front of me.", score: 4 },
  ]},
  { theme: "Reconfiguration", text: "When you try to rest or fully disconnect, you:", answers: [
    { text: "Can't really — the thinking doesn't stop.", score: 1 },
    { text: "Manage it sometimes, but feel guilty or anxious.", score: 2 },
    { text: "Have gotten better at it, though it still takes intention.", score: 3 },
    { text: "Can do it without much internal resistance.", score: 4 },
  ]},
  { theme: "Reconfiguration", text: "The gap between where you are and where you want to be is mostly:", answers: [
    { text: "I haven't mapped it clearly — I'm not sure what's running.", score: 1 },
    { text: "Visible, but I don't know how to close it.", score: 2 },
    { text: "I have a sense of what needs to happen and I'm moving toward it.", score: 3 },
    { text: "Smaller than it used to be — I'm on the other side of the hardest part.", score: 4 },
  ]},
];

// ─── PROFILES ─────────────────────────────────────────────────────────────────
const PROFILES = {
  Pressure: {
    name: "The Endurance System",
    tagline: "You've built a life around what you can carry.",
    color: "#8b6e52",
    body: [
      "Your system reads pressure as a test — and tests are meant to be passed. So you endure. You've gotten very good at carrying things, functioning under weight, and continuing when others would stop. That capability is real.",
      "What isn't being asked often enough: whether the conditions generating the pressure are ones worth continuing. Endurance keeps you inside situations that may not deserve to continue. It's a response, not a strategy.",
      "The signal underneath the exhaustion isn't asking you to become stronger. It's asking you to become clearer — about what this pressure means, and whether it's coming through pathways that were ever meant to handle this volume.",
    ],
    insight: "Pressure is a signal, not a test. Tests are meant to be passed. Signals are meant to be read.",
    essayIds: [1, 2, 11, 12],
  },
  Urgency: {
    name: "The High-Frequency System",
    tagline: "Urgency has become the default, not the exception.",
    color: "#4e6878",
    body: [
      "At some point, urgency stopped being a mode you entered and became the frequency you operate at. The fire drill isn't the exception — it's the schedule. And because everything arrives with pressure, everything feels equally critical.",
      "The urgency-action-relief loop has been running long enough that the relief feels like confirmation. It isn't. It's just the nervous system returning to baseline because a rule was satisfied. The quiet that follows action isn't proof of correctness — it's proof of compliance.",
      "The cost isn't just exhaustion. It's discernment. When urgency is the default, you stop choosing what matters and start obeying whatever arrives first.",
    ],
    insight: "Urgency is not truth. It is enforcement. And what it enforces most reliably is compliance — not correctness.",
    essayIds: [3, 4, 15, 16],
  },
  "Internal Rules": {
    name: "The Open Port System",
    tagline: "Some of your most powerful operating instructions were never consciously approved.",
    color: "#5f7050",
    body: [
      "Rules don't announce themselves. They form quietly — in environments where certain behaviors were rewarded, in seasons where particular responses kept you safe. By the time you're an adult, most of the rules are already running. You just don't know it.",
      "The cybersecurity parallel is precise: an open port was created because something once needed access. The access made sense in context. The problem is when no one tracks whether that access is still warranted — when the original use case expired but the port remains open, granting entry automatically.",
      "You're not choosing all of your responses right now. Some of them are being chosen by configurations you didn't consciously adopt and may not have examined.",
    ],
    insight: "You cannot choose whether to keep a rule you cannot see. Visibility isn't action — but nothing changes without it.",
    essayIds: [5, 6, 18, 20],
  },
  Reconfiguration: {
    name: "The Drifted System",
    tagline: "Your baseline shifted while you were surviving something.",
    color: "#7a6b52",
    body: [
      "Baselines don't collapse. They drift. Not dramatically, not with announcement. What once felt unsustainable becomes manageable. What once registered as strain becomes background noise. The reference point for what's actually wrong quietly moves.",
      "You probably can't remember choosing this baseline. You remember surviving something — a hard season, a period where this level of alertness was genuinely necessary. Those settings worked. That's why they stayed.",
      "What the system doesn't do automatically is update when the emergency ends. The conditions that required that posture expired. The posture remains. And the gap between those two facts is where the exhaustion lives.",
    ],
    insight: "Resilience without review eventually becomes entrapment. The system keeps running — just a little less well than before.",
    essayIds: [8, 9, 23, 24],
  },
};

// ─── SCORING ──────────────────────────────────────────────────────────────────
function computeScores(answers) {
  const scores = { Pressure: 0, Urgency: 0, "Internal Rules": 0, Reconfiguration: 0 };
  answers.forEach(({ theme, score }) => { scores[theme] += score; });
  return scores;
}

function computeProfile(scores) {
  const order = ["Pressure", "Urgency", "Internal Rules", "Reconfiguration"];
  let lowestTheme = order[0];
  let lowestScore = scores[order[0]];
  for (const theme of order) {
    if (scores[theme] < lowestScore) {
      lowestScore = scores[theme];
      lowestTheme = theme;
    }
  }
  return lowestTheme;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function SystemAuditPage({ mobile, px }) {
  const [step, setStep] = useState("intro"); // 'intro' | 'quiz' | 'email' | 'results'
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState(null);
  const [fade, setFade] = useState(true);

  const totalQ = QUESTIONS.length;
  const progress = (qIndex / totalQ) * 100;

  function handleAnswer(score) {
    const q = QUESTIONS[qIndex];
    const newAnswers = [...answers, { theme: q.theme, score }];
    setAnswers(newAnswers);

    if (qIndex < totalQ - 1) {
      setFade(false);
      setTimeout(() => {
        setQIndex(qIndex + 1);
        setFade(true);
      }, 200);
    } else {
      // All questions done
      const computed = computeScores(newAnswers);
      const primaryProfile = computeProfile(computed);
      setScores(computed);
      setProfile(primaryProfile);
      setStep("email");
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      await saveAuditResult({ email: email.trim(), name: name.trim(), scores, profile });
    } catch (err) {
      // Don't block the user from seeing results if save fails
      console.warn("saveAuditResult failed:", err.message);
    } finally {
      setSubmitting(false);
      setStep("results");
    }
  }

  function restart() {
    setStep("intro");
    setQIndex(0);
    setAnswers([]);
    setName("");
    setEmail("");
    setError("");
    setProfile(null);
    setScores(null);
    setFade(true);
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div>
        {/* Navy hero */}
        <div style={{ background: C.navy, padding: mobile ? `72px ${px}` : `96px ${px}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 30% 50%, ${C.navyLight} 0%, transparent 65%)`, opacity: 0.8 }} />
          <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ width: 36, height: 2, background: C.gold, marginBottom: 20 }} />
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, marginBottom: 18 }}>
              System Diagnostic
            </p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(32px,9vw,52px)" : "clamp(36px,5vw,60px)", fontWeight: 900, color: C.cream, lineHeight: 1.08, marginBottom: 24, letterSpacing: "-.02em" }}>
              Scan Your System
            </h1>
            <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 16 : 18, lineHeight: 1.78, color: "rgba(244,239,230,.72)", marginBottom: 20, fontStyle: "italic" }}>
              Twelve questions. Four frameworks. One honest look at what's actually running.
            </p>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 15 : 16, lineHeight: 1.88, color: "rgba(244,239,230,.55)", marginBottom: 40, maxWidth: 580 }}>
              This audit is built around the four frameworks in <em style={{ color: "rgba(244,239,230,.75)" }}>Unsecured</em> — Pressure, Urgency, Internal Rules, and Reconfiguration. Answer honestly, not aspirationally. The result isn't a score. It's a profile — a picture of where your system is operating and what it may need next.
            </p>
            <button
              onClick={() => setStep("quiz")}
              style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "16px 36px", background: C.gold, color: C.navy, border: "none", cursor: "pointer", transition: "all .22s", minHeight: 52 }}
              onMouseOver={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = "none"; }}
            >
              Begin the Audit
            </button>
          </div>
        </div>

        {/* What to expect */}
        <div style={{ background: C.creamDark, borderBottom: `1px solid ${C.g200}`, padding: mobile ? `48px ${px}` : `64px ${px}` }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: mobile ? 28 : 40 }}>
              {[
                { n: "12", label: "Questions", sub: "Three per framework, each designed to surface how you actually operate." },
                { n: "4", label: "Frameworks", sub: "Pressure, Urgency, Internal Rules, and Reconfiguration." },
                { n: "1", label: "Profile", sub: "Based on your lowest-scoring framework — where the most opportunity lives." },
              ].map(({ n, label, sub }) => (
                <div key={label} style={{ textAlign: mobile ? "left" : "center" }}>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? 36 : 40, fontWeight: 900, color: C.navy, lineHeight: 1, marginBottom: 6 }}>{n}</p>
                  <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>{label}</p>
                  <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, lineHeight: 1.75, color: C.g600 }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (step === "quiz") {
    const q = QUESTIONS[qIndex];
    const qNum = String(qIndex + 1).padStart(2, "0");
    const totalNum = String(totalQ).padStart(2, "0");

    return (
      <div style={{ minHeight: "80vh", background: C.g100 }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: C.g200, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ height: "100%", background: C.gold, width: `${progress}%`, transition: "width .4s ease" }} />
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: mobile ? `48px ${px}` : `72px ${px}` }}>
          {/* Question number */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
            <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 28 : 36, fontWeight: 700, color: C.gold, letterSpacing: "-.01em", lineHeight: 1 }}>
              {qNum}
            </span>
            <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g400, letterSpacing: ".06em" }}>
              / {totalNum}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "4px 10px", background: `${TC[q.theme]}16`, color: TC[q.theme], border: `1px solid ${TC[q.theme]}30` }}>
              {q.theme}
            </span>
          </div>

          {/* Question text — fade transition */}
          <div
            key={qIndex}
            style={{ opacity: fade ? 1 : 0, transition: "opacity .2s ease" }}
          >
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(20px,5vw,28px)" : "clamp(22px,3.5vw,32px)", fontWeight: 700, color: C.navy, lineHeight: 1.35, marginBottom: 36, letterSpacing: "-.01em" }}>
              {q.text}
            </h2>

            {/* Answer options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.answers.map((ans, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(ans.score)}
                  style={{ width: "100%", textAlign: "left", padding: mobile ? "18px 20px" : "20px 28px", background: "white", border: `1.5px solid ${C.g200}`, cursor: "pointer", transition: "all .2s", fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 15 : 16, color: C.g800, lineHeight: 1.55, display: "flex", alignItems: "center", gap: 16 }}
                  onMouseOver={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.paddingLeft = mobile ? "26px" : "34px"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = C.g800; e.currentTarget.style.borderColor = C.g200; e.currentTarget.style.paddingLeft = mobile ? "20px" : "28px"; }}
                >
                  <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, color: C.gold, flexShrink: 0, letterSpacing: ".06em" }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {ans.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EMAIL GATE ─────────────────────────────────────────────────────────────
  if (step === "email") {
    return (
      <div style={{ minHeight: "80vh", background: C.navy, display: "flex", alignItems: "center", padding: mobile ? `64px ${px}` : `96px ${px}` }}>
        <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
          <div style={{ width: 36, height: 2, background: C.gold, marginBottom: 24 }} />
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(26px,7vw,40px)" : "clamp(28px,4vw,44px)", fontWeight: 900, color: C.cream, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.02em" }}>
            Your results are ready.
          </h1>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 15 : 16, lineHeight: 1.8, color: "rgba(244,239,230,.6)", marginBottom: 36 }}>
            Enter your email to receive your system profile.
          </p>

          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.g400, marginBottom: 8 }}>
                First Name <span style={{ color: C.g400, fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={{ width: "100%", padding: "14px 16px", border: `1.5px solid ${C.navyLight}`, background: C.navyMid, color: C.cream, fontFamily: "'Source Sans 3',sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box", borderRadius: 0, transition: "border-color .2s" }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.navyLight}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.g400, marginBottom: 8 }}>
                Email <span style={{ color: "#c0392b" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ width: "100%", padding: "14px 16px", border: `1.5px solid ${C.navyLight}`, background: C.navyMid, color: C.cream, fontFamily: "'Source Sans 3',sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box", borderRadius: 0, transition: "border-color .2s" }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.navyLight}
              />
            </div>
            {error && (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: "#e74c3c", marginBottom: 16 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{ width: "100%", fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "16px 28px", background: submitting ? C.navyLight : C.gold, color: C.navy, border: "none", cursor: submitting ? "not-allowed" : "pointer", transition: "all .22s", minHeight: 52, opacity: submitting ? 0.7 : 1 }}
              onMouseOver={e => { if (!submitting) { e.currentTarget.style.background = C.goldLight; } }}
              onMouseOut={e => { if (!submitting) { e.currentTarget.style.background = C.gold; } }}
            >
              {submitting ? "Saving…" : "Get My Results"}
            </button>
          </form>

          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: "rgba(244,239,230,.3)", marginTop: 18, lineHeight: 1.6 }}>
            Your email is used to send your profile. No spam, ever.
          </p>
        </div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (step === "results" && profile && scores) {
    const p = PROFILES[profile];
    const relatedEssays = p.essayIds.map(id => LOCAL_ESSAYS.find(e => e.id === id)).filter(Boolean);

    return (
      <div>
        {/* Results hero */}
        <div style={{ background: C.navy, padding: mobile ? `72px ${px}` : `96px ${px}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 20% 50%, ${C.navyLight} 0%, transparent 60%)`, opacity: 0.9 }} />
          <div style={{ maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ width: 36, height: 2, background: p.color, marginBottom: 20 }} />
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: p.color, marginBottom: 14 }}>
              Your System Profile
            </p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(28px,8vw,48px)" : "clamp(32px,5vw,56px)", fontWeight: 900, color: C.cream, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.02em" }}>
              {p.name}
            </h1>
            <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 17 : 20, fontStyle: "italic", color: "rgba(244,239,230,.65)", marginBottom: 0, lineHeight: 1.55 }}>
              {p.tagline}
            </p>
          </div>
        </div>

        {/* Score summary */}
        <div style={{ background: C.creamDark, borderBottom: `1px solid ${C.g200}`, padding: mobile ? `32px ${px}` : `40px ${px}` }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.g400, marginBottom: 18 }}>
              Score by Framework
            </p>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: mobile ? 12 : 16 }}>
              {Object.entries(scores).map(([theme, score]) => {
                const isLowest = theme === profile;
                return (
                  <div key={theme} style={{ padding: "16px 18px", background: isLowest ? `${TC[theme]}18` : "white", border: `1.5px solid ${isLowest ? TC[theme] : C.g200}`, position: "relative" }}>
                    {isLowest && (
                      <span style={{ position: "absolute", top: -10, right: 10, fontFamily: "'Source Sans 3',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", background: TC[theme], color: "white", padding: "2px 8px" }}>
                        Primary
                      </span>
                    )}
                    <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: TC[theme], marginBottom: 6 }}>{theme}</p>
                    <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: C.navy, lineHeight: 1, marginBottom: 4 }}>{score}</p>
                    <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, color: C.g400 }}>out of 12</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Profile body */}
        <div style={{ maxWidth: 760, margin: "0 auto", padding: mobile ? `48px ${px}` : `72px ${px}` }}>
          {p.body.map((para, i) => (
            <p key={i} style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 16 : 17, lineHeight: 1.94, color: C.g800, marginBottom: "1.75em" }}>
              {para}
            </p>
          ))}

          {/* Insight blockquote */}
          <div style={{ margin: "48px 0", padding: mobile ? "24px 24px" : "32px 40px", border: `2px solid ${C.gold}`, borderLeft: `4px solid ${C.gold}`, background: "#fdfbf7" }}>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(17px,4.5vw,22px)" : "clamp(18px,2.5vw,24px)", fontStyle: "italic", color: C.navy, lineHeight: 1.55, margin: 0 }}>
              "{p.insight}"
            </p>
          </div>

          {/* Start Here — essay cards */}
          <div style={{ marginTop: 56 }}>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>
              Start Here
            </p>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600, marginBottom: 28, lineHeight: 1.75 }}>
              These pieces connect directly to where your system is right now.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              {relatedEssays.map(essay => (
                <a
                  key={essay.id}
                  href="#"
                  onClick={e => e.preventDefault()}
                  style={{ display: "block", background: "white", border: `1px solid ${C.g200}`, padding: mobile ? "22px 20px" : "28px 26px", textDecoration: "none", transition: "all .26s", cursor: "default" }}
                  onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.08)"; e.currentTarget.style.borderColor = C.g400; }}
                  onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.g200; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 10px", background: `${TC[essay.theme]}16`, color: TC[essay.theme], border: `1px solid ${TC[essay.theme]}30` }}>
                      {essay.theme}
                    </span>
                    <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400 }}>{essay.readTime}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? 17 : 19, fontWeight: 700, color: C.navy, lineHeight: 1.3, marginBottom: 10 }}>
                    {essay.title}
                  </h3>
                  <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, lineHeight: 1.75, color: C.g600, margin: 0 }}>
                    {essay.hook}
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Book CTA */}
          <div style={{ marginTop: 64, background: C.navy, padding: mobile ? "32px 28px" : "48px 52px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 80% 50%, ${C.navyLight} 0%, transparent 60%)`, opacity: 0.7 }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 12 }}>
                The Full Picture
              </p>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(20px,5vw,28px)" : "clamp(22px,3vw,32px)", fontWeight: 900, color: C.cream, marginBottom: 16, lineHeight: 1.2, letterSpacing: "-.01em" }}>
                Unsecured: Why Pressure Isn't the Problem
              </h3>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 14 : 15, lineHeight: 1.85, color: "rgba(244,239,230,.6)", marginBottom: 28, maxWidth: 520 }}>
                This audit surfaces one pattern. The book maps the full terrain — where these configurations come from, why they persist, and what it actually takes to change them.
              </p>
              <a
                href="https://a.co/d/0dpaVYPc"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "15px 28px", background: C.gold, color: C.navy, border: "none", cursor: "pointer", textDecoration: "none", display: "inline-block", transition: "all .22s", minHeight: 48 }}
                onMouseOver={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseOut={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = "none"; }}
              >
                Get the Book
              </a>
              <button
                onClick={restart}
                style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "14px 28px", background: "transparent", color: "rgba(244,239,230,.5)", border: "1.5px solid rgba(244,239,230,.2)", cursor: "pointer", marginLeft: 12, transition: "all .22s", minHeight: 48 }}
                onMouseOver={e => { e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = "rgba(244,239,230,.5)"; }}
                onMouseOut={e => { e.currentTarget.style.color = "rgba(244,239,230,.5)"; e.currentTarget.style.borderColor = "rgba(244,239,230,.2)"; }}
              >
                Retake Audit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
