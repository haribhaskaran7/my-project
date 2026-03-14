import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

function ParticleBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const particles = [];
    const count = 80;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: rand(0, window.innerWidth),
          y: rand(0, window.innerHeight),
          r: rand(0.6, 2.4),
          vx: rand(-0.15, 0.15),
          vy: rand(-0.1, 0.1),
          alpha: rand(0.1, 0.55),
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(10, 19, 32, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(31, 197, 123, ${p.alpha})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: -1 }} />;
}

/* ─── THEME ──────────────────────────────────────────────────────────────── */
const T = {
  bg:"#0b1320", surface:"#0f172a", card:"#0f192e",
  green:"#22c55e", greenD:"#16a34a", greenL:"#4ade80",
  greenPale:"#0d1f2a", greenMid:"#1e3a4d",
  amber:"#f59e0b", amberL:"#fef3c7",
  red:"#f87171", redL:"#fef2f2",
  blue:"#38bdf8", blueL:"#e0f2fe",
  purple:"#a78bfa",
  text:"#e2e8f0", sub:"#94a3b8", muted:"#64748b",
  border:"#1e293b", borderG:"#334155",
  shadow:"0 1px 12px rgba(0,0,0,0.35)",
  shadowMd:"0 8px 34px rgba(0,0,0,0.40)",
};

/* ─── DB ─────────────────────────────────────────────────────────────────── */
const DB = {
  // User storage is now multi-account aware. We keep a list of users and the current active user email.
  async getUsers() {
    const r = localStorage.getItem("iq:users");
    return r ? JSON.parse(r) : [];
  },

  async setUsers(users) {
    localStorage.setItem("iq:users", JSON.stringify(users));
  },

  async getCurrentUserEmail() {
    const email = localStorage.getItem("iq:currentUser");
    if (email) return email;
    // legacy fallback: legacy single-user storage
    const legacy = localStorage.getItem("iq:user");
    if (legacy) {
      const u = JSON.parse(legacy);
      if (u?.email) {
        await this._migrateUser(u);
        return u.email;
      }
    }
    return null;
  },

  async setCurrentUserEmail(email) {
    if (!email) {
      localStorage.removeItem("iq:currentUser");
      return;
    }
    localStorage.setItem("iq:currentUser", email);
  },

  async _migrateUser(u) {
    const users = await this.getUsers();
    const exists = users.find(x => x.email === u.email);
    if (!exists) users.push(u);
    await this.setUsers(users);
    await this.setCurrentUserEmail(u.email);
    localStorage.removeItem("iq:user");
  },

  async getUser() {
    const email = await this.getCurrentUserEmail();
    if (!email) return null;
    const users = await this.getUsers();
    return users.find(u => u.email === email) || null;
  },

  async setUser(u) {
    if (!u) {
      await this.setCurrentUserEmail(null);
      return;
    }
    const users = await this.getUsers();
    const idx = users.findIndex(x => x.email === u.email);
    if (idx >= 0) users[idx] = u;
    else users.push(u);
    await this.setUsers(users);
    await this.setCurrentUserEmail(u.email);
  },

  _historyKey(email) { return `iq:history:${email}`; },
  _profileKey(email) { return `iq:profile:${email}`; },

  async getHistory() {
    const user = await this.getUser();
    if (!user) {
      const r = localStorage.getItem("iq:history");
      return r ? JSON.parse(r) : [];
    }
    const r = localStorage.getItem(this._historyKey(user.email));
    return r ? JSON.parse(r) : [];
  },

  async addHistory(h) {
    const user = await this.getUser();
    const key = user ? this._historyKey(user.email) : "iq:history";
    const arr = await this.getHistory();
    arr.unshift({ ...h, id: Date.now(), ts: new Date().toLocaleString("en-IN") });
    localStorage.setItem(key, JSON.stringify(arr));
    return arr;
  },

  async clearHistory() {
    const user = await this.getUser();
    const key = user ? this._historyKey(user.email) : "iq:history";
    localStorage.removeItem(key);
  },

  async getProfile() {
    const user = await this.getUser();
    if (!user) {
      const r = localStorage.getItem("iq:profile");
      return r ? JSON.parse(r) : null;
    }
    const r = localStorage.getItem(this._profileKey(user.email));
    return r ? JSON.parse(r) : null;
  },

  async setProfile(p) {
    const user = await this.getUser();
    if (!user) {
      localStorage.setItem("iq:profile", JSON.stringify(p));
      return;
    }
    localStorage.setItem(this._profileKey(user.email), JSON.stringify(p));
  }
};

/* ─── UTILS ──────────────────────────────────────────────────────────────── */
// FIX: safe formatter – never crashes on null/NaN/Infinity
const fmt = (n) => {
  if (n == null || !isFinite(n)) return "—";
  n = Math.round(Number(n));
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};
const pct = (n) => `${Number(n).toFixed(1)}%`;
const yrs = (n) => `${n} yr${n === 1 ? "" : "s"}`;
// FIX: safe number parser
const pn = (v) => { const n = parseFloat(String(v).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; };

// FIX: safe SIP formula – handles rate=0 case
const sipFV = (monthly, ratePerMonth, months) => {
  if (monthly <= 0) return 0;
  if (ratePerMonth === 0) return monthly * months;
  return monthly * ((Math.pow(1 + ratePerMonth, months) - 1) / ratePerMonth) * (1 + ratePerMonth);
};

// FIX: safe EMI formula – handles rate=0 case
const calcEMI = (principal, ratePerMonth, months) => {
  if (principal <= 0) return 0;
  if (ratePerMonth === 0) return principal / months;
  return principal * (ratePerMonth * Math.pow(1 + ratePerMonth, months)) / (Math.pow(1 + ratePerMonth, months) - 1);
};

/* ─── SHARED UI ──────────────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return <div style={{ background: T.card, border: `1px solid ${T.borderG}`, borderRadius: 14, padding: "20px 22px", boxShadow: T.shadow, ...style }}>{children}</div>;
}

function Chip({ children, color = T.green, bg }) {
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg || `${color}18` }}>{children}</span>;
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 17 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: T.text }}>{title}</span>
      </div>
      {sub && <div style={{ color: T.muted, fontSize: 11, marginTop: 3, marginLeft: 25 }}>{sub}</div>}
    </div>
  );
}

function InputField({ label, value, onChange, prefix = "₹", suffix, placeholder, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${focused ? T.green : T.borderG}`, borderRadius: 9, overflow: "hidden", background: focused ? T.greenPale : T.surface, transition: "all 0.15s", boxShadow: focused ? `0 0 0 3px ${T.green}18` : "none" }}>
        {prefix && <span style={{ padding: "0 10px", color: T.green, fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono',monospace", background: focused ? "#dcfce7" : T.greenPale, borderRight: `1px solid ${T.borderG}`, display: "flex", alignItems: "center", minHeight: 38 }}>{prefix}</span>}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "0"}
          style={{ flex: 1, border: "none", outline: "none", padding: "9px 10px", fontSize: 14, color: T.text, background: "transparent", fontFamily: "'Space Mono',monospace", fontWeight: 700 }}
        />
        {suffix && <span style={{ padding: "0 10px", color: T.muted, fontSize: 12 }}>{suffix}</span>}
      </div>
      {hint && <div style={{ color: T.muted, fontSize: 10, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 5, fontFamily: "'DM Sans',sans-serif" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", paddingRight: 28, borderRadius: 9, border: `1.5px solid ${T.borderG}`, fontSize: 13, color: T.text, background: T.surface, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", outline: "none", WebkitAppearance: "none" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, format, color = T.green }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: T.sub, fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>{format ? format(value) : value}</span>
      </div>
      <div style={{ position: "relative", height: 5, borderRadius: 3, background: T.greenMid }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${fill}%`, borderRadius: 3, background: color, transition: "width 0.1s" }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", margin: 0, height: "100%" }} />
      </div>
    </div>
  );
}

function StatBadge({ label, value, color = T.green, icon, bg, sub }) {
  return (
    <div style={{ background: bg || T.greenPale, border: `1px solid ${T.greenMid}`, borderRadius: 11, padding: "12px 14px", flex: 1, minWidth: 110, borderTop: `3px solid ${color}` }}>
      <div style={{ color: T.muted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: 0.8 }}>{icon} {label}</div>
      <div style={{ color, fontSize: 17, fontWeight: 800, fontFamily: "'Space Mono',monospace", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ color: T.muted, fontSize: 10, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// FIX: RiskMeter clamps score to [1, 98] so needle never overflows
function RiskMeter({ score }) {
  const clamped = Math.min(98, Math.max(1, score));
  const color = score < 35 ? T.green : score < 65 ? T.amber : T.red;
  const label = score < 35 ? "Low Risk" : score < 65 ? "Moderate Risk" : "High Risk";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>Risk Score</span>
        <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'Space Mono',monospace" }}>{Math.round(score)}/100 — {label}</span>
      </div>
      <div style={{ height: 10, background: `linear-gradient(90deg,${T.green},${T.amber},${T.red})`, borderRadius: 5, position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${clamped}% - 7px)`, width: 14, height: 14, borderRadius: "50%", background: color, border: "2.5px solid #fff", boxShadow: `0 0 0 2px ${color}`, transition: "left 0.4s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 10, color: T.green }}>Conservative</span>
        <span style={{ fontSize: 10, color: T.amber }}>Moderate</span>
        <span style={{ fontSize: 10, color: T.red }}>Aggressive</span>
      </div>
    </div>
  );
}

// FIX: CTip safely handles non-numeric values
function CTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.borderG}`, borderRadius: 10, padding: "10px 14px", boxShadow: T.shadowMd, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ color: T.muted, marginBottom: 5 }}>Year {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <strong>{fmt(p.value)}</strong></div>
      ))}
    </div>
  );
}

function SaveBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ marginTop: 14, padding: "9px 20px", borderRadius: 8, border: "none", background: T.green, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 2px 8px ${T.green}40` }}>
      💾 Save to History
    </button>
  );
}

/* ─── ASSET TYPES ────────────────────────────────────────────────────────── */
const ASSETS = [
  { value:"equity_mf",    label:"📊 Equity Mutual Fund",       ret:14,  risk:68, tax:10, lock:0  },
  { value:"elss",         label:"🧾 ELSS (Tax Saving MF)",     ret:13,  risk:65, tax:10, lock:3  },
  { value:"index_fund",   label:"📈 Index Fund (Nifty/Sensex)", ret:12,  risk:55, tax:10, lock:0  },
  { value:"fd",           label:"🏦 Fixed Deposit",            ret:7,   risk:10, tax:30, lock:1  },
  { value:"ppf",          label:"🪙 PPF",                      ret:7.1, risk:5,  tax:0,  lock:15 },
  { value:"nps",          label:"🏛️ NPS (Pension)",            ret:10,  risk:40, tax:0,  lock:20 },
  { value:"gold",         label:"🥇 Gold / Sovereign Bond",    ret:8,   risk:38, tax:20, lock:0  },
  { value:"real_estate",  label:"🏠 Real Estate",              ret:9,   risk:45, tax:20, lock:5  },
  { value:"stocks",       label:"📉 Direct Stocks",            ret:15,  risk:80, tax:10, lock:0  },
  { value:"crypto",       label:"₿ Crypto",                   ret:20,  risk:95, tax:30, lock:0  },
  { value:"debt_fund",    label:"🔒 Debt / Liquid Fund",       ret:7.5, risk:18, tax:30, lock:0  },
  { value:"rd",           label:"💳 Recurring Deposit",        ret:6.5, risk:8,  tax:30, lock:1  },
];

/* ─── INVESTMENT ANALYSER ────────────────────────────────────────────────── */
function InvestmentAnalyser({ onSave }) {
  const [assetType,   setAssetType]   = useState("equity_mf");
  const [amount,      setAmount]      = useState("50000");
  const [monthly,     setMonthly]     = useState("5000");
  const [mode,        setMode]        = useState("lumpsum");
  const [years,       setYears]       = useState(10);
  const [customRate,  setCustomRate]  = useState("");
  const [inflation,   setInflation]   = useState(6);
  const [riskTol,     setRiskTol]     = useState("moderate");
  const [result,      setResult]      = useState(null);

  const asset = ASSETS.find(a => a.value === assetType) || ASSETS[0];
  const rate  = customRate !== "" ? Math.max(0, pn(customRate)) : asset.ret;

  const analyse = () => {
    console.log("Analyse function running");
  
    const lumpAmt = pn(amount);
    const sipAmt  = pn(monthly);
    const r       = rate / 100;
    const rM      = rate / 100 / 12;
    const months  = years * 12;

    // FIX: use safe helpers
    const lumpFV_val = lumpAmt * Math.pow(1 + r, years);
    const sipFV_val  = sipFV(sipAmt, rM, months);

    const totalInv =
      mode === "lumpsum" ? lumpAmt :
      mode === "sip"     ? sipAmt * months :
                           lumpAmt + sipAmt * months;

    const rawFV =
      mode === "lumpsum" ? lumpFV_val :
      mode === "sip"     ? sipFV_val :
                           lumpFV_val + sipFV_val;

    const gains     = Math.max(0, rawFV - totalInv);
    // FIX: LTCG only on gains above ₹1L, only if positive
    const ltcgTax   = gains > 100000 ? (gains - 100000) * (asset.tax / 100) : 0;
    const postTaxFV = rawFV - ltcgTax;
    const realFV    = postTaxFV / Math.pow(1 + inflation / 100, years);
    // FIX: guard against totalInv=0 or rawFV≤0 before log
    const cagr = totalInv > 0 && rawFV > 0
      ? (Math.pow(rawFV / totalInv, 1 / years) - 1) * 100
      : 0;

    const tolMod    = riskTol === "conservative" ? -12 : riskTol === "aggressive" ? +12 : 0;
    const riskScore = Math.min(100, Math.max(0, asset.risk + tolMod));

    const chartData = Array.from({ length: years }, (_, i) => {
      const y   = i + 1;
      const lF  = lumpAmt * Math.pow(1 + r, y);
      const sF  = sipFV(sipAmt, rM, y * 12);
      const inv = mode === "lumpsum" ? lumpAmt : mode === "sip" ? sipAmt * y * 12 : lumpAmt + sipAmt * y * 12;
      const val = mode === "lumpsum" ? lF : mode === "sip" ? sF : lF + sF;
      return {
        year: y,
        "Invested":              Math.round(inv),
        "Portfolio Value":       Math.round(val),
        "Real (Inflation Adj.)": Math.round(val / Math.pow(1 + inflation / 100, y)),
      };
    });

    // FIX: comparison uses same totalInv (not rawFV) as base for fair comparison
    const alts = [
      { name: "FD (7%)",    val: totalInv * Math.pow(1.07,  years), color: T.blue   },
      { name: "PPF (7.1%)", val: totalInv * Math.pow(1.071, years), color: T.purple },
      { name: "Gold (8%)",  val: totalInv * Math.pow(1.08,  years), color: T.amber  },
      { name: asset.label.replace(/^\S+\s/, ""), val: rawFV,        color: T.green  },
    ].sort((a, b) => a.val - b.val);

    const radarData = [
      { metric: "Returns",       value: Math.min(100, (rate / 20) * 100) },
      { metric: "Safety",        value: 100 - asset.risk },
      { metric: "Liquidity",     value: asset.lock === 0 ? 90 : asset.lock <= 3 ? 60 : 30 },
      { metric: "Tax Eff.",      value: asset.tax === 0 ? 100 : asset.tax <= 10 ? 75 : 40 },
      { metric: "Inflation Beat",value: rate > inflation ? Math.min(100, ((rate - inflation) / 10) * 100) : 20 },
    ];

    setResult({ rawFV, totalInv, gains, postTaxFV, realFV, ltcgTax, cagr, riskScore, chartData, alts, radarData, rate });
  };

  return (
    <div>
      {/* INPUT PANELS */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: result ? 22 : 0 }}>

        {/* Investment Details Card */}
        <Card style={{ flex: "1 1 270px" }}>
          <SectionTitle icon="💰" title="Investment Details" sub="Enter your investment parameters below" />
          <SelectField label="Investment Type / Asset Class"
            value={assetType} onChange={setAssetType}
            options={ASSETS.map(a => ({ value: a.value, label: a.label }))} />

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>Investment Mode</label>
            <div style={{ display: "flex", background: T.greenPale, borderRadius: 9, padding: 3, border: `1px solid ${T.greenMid}` }}>
              {[["lumpsum","One-time"], ["sip","Monthly SIP"], ["both","Both"]].map(([v, l]) => (
                <button key={v} onClick={() => setMode(v)}
                  style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: "none", background: mode === v ? T.green : "transparent", color: mode === v ? "#fff" : T.muted, fontSize: 11, fontWeight: mode === v ? 700 : 400, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {(mode === "lumpsum" || mode === "both") && (
            <InputField label="Lumpsum Amount (One-time)" value={amount} onChange={setAmount} placeholder="50,000" hint="One-time investment amount" />
          )}
          {(mode === "sip" || mode === "both") && (
            <InputField label="Monthly SIP Amount" value={monthly} onChange={setMonthly} placeholder="5,000" hint="Amount invested every month" />
          )}

          <Slider label="Investment Period" value={years} min={1} max={40} onChange={setYears} format={yrs} />
          <InputField label="Custom Return Rate (optional)" value={customRate} onChange={setCustomRate}
            prefix="%" placeholder={`Default: ${asset.ret}%`} hint={`Asset avg: ${asset.ret}% p.a. — leave blank to use default`} />
        </Card>

        {/* Risk & Context Card */}
        <Card style={{ flex: "1 1 250px" }}>
          <SectionTitle icon="⚙️" title="Risk & Context" sub="Personalise your analysis" />

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>Your Risk Tolerance</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[["conservative","🛡️ Safe"], ["moderate","⚖️ Balanced"], ["aggressive","🚀 Bold"]].map(([v, l]) => (
                <button key={v} onClick={() => setRiskTol(v)}
                  style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${riskTol === v ? T.green : T.borderG}`, background: riskTol === v ? T.greenPale : T.surface, color: riskTol === v ? T.green : T.muted, fontSize: 11, fontWeight: riskTol === v ? 700 : 400, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <Slider label="Expected Inflation Rate (India ~6%)" value={inflation} min={2} max={12} step={0.5} onChange={setInflation} format={pct} color={T.amber} />

          {/* Asset info */}
          <div style={{ background: T.greenPale, border: `1px solid ${T.greenMid}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: T.green, marginBottom: 10, fontSize: 13 }}>{asset.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
              {[
                ["Avg. Return", `${asset.ret}% p.a.`],
                ["Risk Level",  asset.risk < 30 ? "Low" : asset.risk < 60 ? "Medium" : "High"],
                ["Capital Gains Tax", `${asset.tax}%`],
                ["Lock-in",     asset.lock === 0 ? "None" : `${asset.lock} yrs`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: T.muted, fontSize: 10 }}>{k}</div>
                  <div style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={analyse}
            style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.green},${T.greenD})`, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 16px ${T.green}50`, letterSpacing: 0.2 }}>
            🔍 Analyse Investment →
          </button>
        </Card>
      </div>

      {/* RESULTS – FIX: <style> moved outside animated div */}
      {result && (
        <div style={{ animation: "iqFadeIn 0.35s ease" }}>
          {/* Summary */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <StatBadge label="Total Invested"      value={fmt(result.totalInv)}  color={T.blue}   icon="💰" />
            <StatBadge label="Gross Returns"       value={fmt(result.rawFV)}     color={T.green}  icon="📈" sub={`CAGR ${pct(result.cagr)}`} />
            <StatBadge label="Gains Earned"        value={fmt(result.gains)}     color={T.greenL} icon="✨" sub={`+${pct(result.totalInv > 0 ? (result.gains / result.totalInv) * 100 : 0)}`} />
            <StatBadge label="Tax (LTCG)"          value={fmt(result.ltcgTax)}   color={T.amber}  icon="🧾" bg={T.amberL} />
            <StatBadge label="Post-Tax Value"      value={fmt(result.postTaxFV)} color={T.greenD} icon="💼" />
            <StatBadge label="Real Value (Adj.)"   value={fmt(result.realFV)}    color={T.muted}  icon="🔍" sub={`After ${pct(inflation)} inflation`} />
          </div>

          {/* Risk */}
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle icon="⚠️" title="Risk Assessment" sub="Based on asset class + your risk tolerance" />
            <RiskMeter score={result.riskScore} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, marginTop: 12 }}>
              {[
                ["Volatility",      result.riskScore < 35 ? "Low — stable returns" : result.riskScore < 65 ? "Medium — some swings" : "High — significant swings", result.riskScore < 35 ? T.green : result.riskScore < 65 ? T.amber : T.red],
                ["Inflation Beat",  result.rate > inflation ? `✓ Beats by ${pct(result.rate - inflation)}` : `✗ Under by ${pct(inflation - result.rate)}`, result.rate > inflation ? T.green : T.red],
                ["Lock-in",         asset.lock === 0 ? "None — fully liquid" : `${asset.lock} yr lock-in`, asset.lock === 0 ? T.green : T.amber],
                ["Tax Efficiency",  asset.tax === 0 ? "Tax-free ✓" : `${asset.tax}% capital gains`, asset.tax === 0 ? T.green : T.amber],
              ].map(([k, v, c]) => (
                <div key={k} style={{ background: T.greenPale, border: `1px solid ${T.greenMid}`, borderRadius: 9, padding: "10px 12px" }}>
                  <div style={{ color: T.muted, fontSize: 10, marginBottom: 3 }}>{k}</div>
                  <div style={{ color: c, fontSize: 12, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Charts row */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <Card style={{ flex: "2 1 300px" }}>
              <SectionTitle icon="📊" title="Portfolio Growth Projection" sub="Nominal vs inflation-adjusted value" />
              {/* FIX: unique gradient IDs prefixed with "ia_" */}
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.chartData}>
                  <defs>
                    <linearGradient id="ia_g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.green} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ia_g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.blue}  stopOpacity={0.13} />
                      <stop offset="95%" stopColor={T.blue}  stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ia_g3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.amber} stopOpacity={0.13} />
                      <stop offset="95%" stopColor={T.amber} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderG} />
                  <XAxis dataKey="year" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
                  <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} tickFormatter={fmt} width={72} />
                  <Tooltip content={<CTip />} />
                  <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
                  <Area type="monotone" dataKey="Invested"              stroke={T.blue}  fill="url(#ia_g2)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="Portfolio Value"        stroke={T.green} fill="url(#ia_g1)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Real (Inflation Adj.)" stroke={T.amber} fill="url(#ia_g3)" strokeWidth={1.5} strokeDasharray="5 4" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ flex: "1 1 200px" }}>
              <SectionTitle icon="🕸️" title="Asset Score" sub="Multi-factor quality" />
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={result.radarData}>
                  <PolarGrid stroke={T.borderG} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: T.sub, fontSize: 10 }} />
                  <Radar dataKey="value" stroke={T.green} fill={T.green} fillOpacity={0.22} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.borderG}`, borderRadius: 8, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Comparison */}
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle icon="🏁" title="vs. Alternative Investments" sub="Same amount, same period" />
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={result.alts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderG} />
                <XAxis type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} tickFormatter={fmt} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: T.sub, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.borderG}`, borderRadius: 8, fontSize: 12 }} formatter={fmt} />
                <Bar dataKey="val" radius={[0, 6, 6, 0]}>
                  {result.alts.map((a, i) => <Cell key={i} fill={a.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Recommendations */}
          <Card style={{ marginBottom: 16, borderLeft: `4px solid ${T.green}` }}>
            <SectionTitle icon="💡" title="InvestQuest Recommendations" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10, fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
              {[
                result.rate > inflation
                  ? `✅ Beats inflation by ${pct(result.rate - inflation)}. Real wealth grows.`
                  : `⚠️ Returns (${pct(result.rate)}) < inflation (${pct(inflation)}). Consider equity.`,
                asset.tax === 0
                  ? `✅ Tax-free returns — no LTCG applicable.`
                  : `🧾 ${asset.tax}% LTCG tax applies. Post-tax value: ${fmt(result.postTaxFV)}.`,
                result.riskScore < 35
                  ? `🛡️ Low-risk. Good for capital preservation goals.`
                  : result.riskScore < 65
                    ? `⚖️ Moderate risk. Ideal for 5–10 yr goals.`
                    : `🚀 High risk. Best for 10+ yr horizon with stable income.`,
                asset.lock > 0
                  ? `🔒 ${yrs(asset.lock)} lock-in. Ensure you don't need this money until ${new Date().getFullYear() + asset.lock}.`
                  : `💧 No lock-in — stay invested voluntarily for best results.`,
              ].map((tip, i) => (
                <div key={i} style={{ background: T.greenPale, borderRadius: 9, padding: "10px 12px" }}>{tip}</div>
              ))}
            </div>
          </Card>

          <SaveBtn onClick={() => onSave({
            tool: "Investment Analyser",
            inputs: { asset: asset.label, mode, amount: mode !== "sip" ? fmt(pn(amount)) : "—", sip: mode !== "lumpsum" ? fmt(pn(monthly)) : "—", period: yrs(years), rate: pct(result.rate) },
            result: { maturity: fmt(result.postTaxFV), gains: fmt(result.gains), cagr: pct(result.cagr), risk: `${Math.round(result.riskScore)}/100` },
          })} />
        </div>
      )}
    </div>
  );
}

/* ─── SIP CALCULATOR ─────────────────────────────────────────────────────── */
function SIPCalc({ onSave }) {
  const [mInp, setMInp] = useState("5000");
  const [r,    setR]    = useState(12);
  const [y,    setY]    = useState(10);

  const m      = Math.max(1, pn(mInp));
  const rM     = r / 100 / 12;
  const months = y * 12;
  // FIX: use safe sipFV helper
  const maturity  = sipFV(m, rM, months);
  const invested  = m * months;
  const gains     = maturity - invested;

  const data = Array.from({ length: y }, (_, i) => {
    const mo = (i + 1) * 12;
    return { year: i + 1, "Invested": m * mo, "Portfolio": Math.round(sipFV(m, rM, mo)) };
  });

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 260px" }}>
        <InputField label="Monthly SIP Amount" value={mInp} onChange={setMInp} placeholder="5,000" hint="Min ₹500 recommended" />
        <Slider label="Expected Annual Return" value={r} min={1} max={30} step={0.5} onChange={setR} format={pct} color={T.amber} />
        <Slider label="Investment Period"      value={y} min={1} max={40}           onChange={setY} format={yrs} color={T.blue} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <StatBadge label="Invested" value={fmt(invested)} color={T.blue}  icon="💰" />
          <StatBadge label="Gains"    value={fmt(gains)}    color={T.amber} icon="📈" />
          <StatBadge label="Maturity" value={fmt(maturity)} color={T.green} icon="🎯" />
        </div>
        <div style={{ marginTop: 10, background: T.greenPale, borderRadius: 9, padding: "9px 12px", fontSize: 12, color: T.sub }}>
          💡 ELSS gives ₹1.5L deduction under 80C with only 3-yr lock-in.
        </div>
        <SaveBtn onClick={() => onSave({ tool: "SIP Calculator", inputs: { monthly: fmt(m), rate: pct(r), period: yrs(y) }, result: { invested: fmt(invested), gains: fmt(gains), maturity: fmt(maturity) } })} />
      </div>
      <div style={{ flex: "1 1 300px" }}>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Portfolio Growth Over Time</div>
        {/* FIX: unique gradient IDs prefixed with "sip_" */}
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sip_g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.green} stopOpacity={0.2} />
                <stop offset="95%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sip_g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.blue}  stopOpacity={0.15} />
                <stop offset="95%" stopColor={T.blue}  stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderG} />
            <XAxis dataKey="year" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} tickFormatter={fmt} width={72} />
            <Tooltip content={<CTip />} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
            <Area type="monotone" dataKey="Invested"  stroke={T.blue}  fill="url(#sip_g2)" strokeWidth={2} />
            <Area type="monotone" dataKey="Portfolio" stroke={T.green} fill="url(#sip_g1)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── GOAL PLANNER ───────────────────────────────────────────────────────── */
const GOAL_PRESETS = {
  "Child Education": 2500000, "Home Down Payment": 1500000,
  "Retirement": 10000000, "Marriage": 2000000, "Car": 1000000,
};

function GoalCalc({ onSave }) {
  const [goalInp,  setGoalInp]  = useState("2500000");
  const [y,        setY]        = useState(10);
  const [r,        setR]        = useState(12);
  const [lsInp,    setLsInp]    = useState("0");
  const [goalType, setGoalType] = useState("Custom");

  // FIX: derive actualGoal cleanly without dynamic key re-eval inside GMAP
  const actualGoal = goalType === "Custom" ? Math.max(1, pn(goalInp)) : (GOAL_PRESETS[goalType] || 1);
  const rM         = r / 100 / 12;
  const months     = y * 12;
  const lsFV       = pn(lsInp) * Math.pow(1 + r / 100, y);
  const remaining  = Math.max(0, actualGoal - lsFV);
  // FIX: use safe sipFV inverted formula with guard
  const sipNeeded  = remaining > 0 && rM > 0
    ? remaining * rM / ((Math.pow(1 + rM, months) - 1) * (1 + rM))
    : remaining > 0 ? remaining / months : 0;

  const pie = [
    { name: "Lumpsum", value: Math.round(Math.min(lsFV, actualGoal)) },
    { name: "Via SIP", value: Math.round(Math.max(0, actualGoal - lsFV)) },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
        {["Custom", ...Object.keys(GOAL_PRESETS)].map(g => (
          <button key={g} onClick={() => setGoalType(g)}
            style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: `1.5px solid ${goalType === g ? T.green : T.borderG}`, background: goalType === g ? T.green : "transparent", color: goalType === g ? "#fff" : T.muted, fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
            {g}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px" }}>
          {goalType === "Custom"
            ? <InputField label="Target Goal Amount" value={goalInp} onChange={setGoalInp} placeholder="25,00,000" />
            : <div style={{ background: T.greenPale, borderRadius: 9, padding: "10px 13px", marginBottom: 12, fontSize: 13, color: T.green, fontWeight: 700 }}>Goal: {fmt(actualGoal)}</div>}
          <Slider label="Time Horizon"      value={y} min={1} max={30}            onChange={setY} format={yrs} color={T.blue} />
          <Slider label="Expected Return"   value={r} min={1} max={30} step={0.5} onChange={setR} format={pct} color={T.amber} />
          <InputField label="Lumpsum Already Invested" value={lsInp} onChange={setLsInp} placeholder="0" hint="Grows to partially fund your goal" />
          <div style={{ background: T.greenPale, border: `1.5px solid ${T.green}`, borderRadius: 11, padding: "14px 16px", marginTop: 6 }}>
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Monthly SIP Required</div>
            <div style={{ color: T.green, fontSize: 28, fontWeight: 900, fontFamily: "'Space Mono',monospace" }}>{fmt(sipNeeded)}</div>
            <div style={{ color: T.muted, fontSize: 11, marginTop: 3 }}>to reach <strong style={{ color: T.text }}>{fmt(actualGoal)}</strong> in {yrs(y)}</div>
          </div>
          <SaveBtn onClick={() => onSave({ tool: "Goal Planner", inputs: { goal: fmt(actualGoal), years: yrs(y), rate: pct(r) }, result: { sipRequired: fmt(sipNeeded) } })} />
        </div>
        <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Funding Split</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                <Cell fill={T.blue} /><Cell fill={T.green} />
              </Pie>
              <Tooltip formatter={fmt} contentStyle={{ background: T.surface, border: `1px solid ${T.borderG}`, borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ─── INFLATION CALCULATOR ───────────────────────────────────────────────── */
function InflationCalc({ onSave }) {
  const [amtInp, setAmtInp] = useState("100000");
  const [inf,    setInf]    = useState(6);
  const [y,      setY]      = useState(20);

  const a      = Math.max(1, pn(amtInp));
  const real   = a / Math.pow(1 + inf / 100, y);
  const needed = a * Math.pow(1 + inf / 100, y);
  const data   = Array.from({ length: y + 1 }, (_, i) => ({
    year: i,
    "Purchasing Power":     Math.round(a / Math.pow(1 + inf / 100, i)),
    "To Maintain Lifestyle": Math.round(a * Math.pow(1 + inf / 100, i)),
  }));

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 260px" }}>
        <InputField label="Current Amount / Monthly Expense" value={amtInp} onChange={setAmtInp} placeholder="1,00,000" />
        <Slider label="Inflation Rate (India avg ~6%)" value={inf} min={2} max={15} step={0.5} onChange={setInf} format={pct} color={T.red} />
        <Slider label="Years Ahead"                    value={y}   min={1} max={40}           onChange={setY}   format={yrs} color={T.blue} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <StatBadge label="Today's Value"   value={fmt(a)}    color={T.blue} icon="💵" />
          <StatBadge label={`After ${yrs(y)}`} value={fmt(real)} color={T.red} icon="📉" sub={`-${pct(((a - real) / a) * 100)} power`} />
        </div>
        <div style={{ marginTop: 10, background: T.redL, border: "1px solid #fecaca", borderRadius: 9, padding: "9px 12px", fontSize: 12, color: "#7f1d1d" }}>
          🔥 You'll need <strong>{fmt(needed)}</strong> after {yrs(y)} to maintain today's lifestyle.
        </div>
        <SaveBtn onClick={() => onSave({ tool: "Inflation Calc", inputs: { amount: fmt(a), inflation: pct(inf), years: yrs(y) }, result: { realValue: fmt(real), futureNeed: fmt(needed) } })} />
      </div>
      <div style={{ flex: "1 1 300px" }}>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Purchasing Power Erosion</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderG} />
            <XAxis dataKey="year" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} tickFormatter={fmt} width={72} />
            <Tooltip content={<CTip />} />
            <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
            <Line type="monotone" dataKey="Purchasing Power"      stroke={T.red}   strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="To Maintain Lifestyle" stroke={T.green} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── RISK PROFILER ──────────────────────────────────────────────────────── */
const QS = [
  { q:"If your portfolio dropped 25% in 3 months, you would:", opts:["Sell everything","Sell some & wait","Hold steady","Buy more"], sc:[1,2,3,4] },
  { q:"Your primary investment objective:",                    opts:["Protect capital","Steady income","Balanced growth","Maximum growth"], sc:[1,2,3,4] },
  { q:"How long can your money stay invested?",               opts:["< 1 year","1–3 years","3–7 years","7+ years"], sc:[1,2,3,4] },
  { q:"% of monthly income you can invest:",                  opts:["< 5%","5–10%","10–20%","20%+"], sc:[1,2,3,4] },
  { q:"Your investment experience:",                          opts:["Never invested","FD/RD only","Some MF/stocks","Active investor"], sc:[1,2,3,4] },
];
const RISK_PROFILES = [
  { label:"Conservative", color:T.blue,  icon:"🛡️", desc:"Capital safety first. Suitable: PPF, FD, NSC, Debt Funds.", alloc:[{name:"Debt/FD",v:65},{name:"Equity",v:20},{name:"Gold",v:15}] },
  { label:"Moderate",     color:T.amber, icon:"⚖️", desc:"Balanced. Suitable: Hybrid Funds, Index Funds, Blue-chips.", alloc:[{name:"Debt/FD",v:40},{name:"Equity",v:45},{name:"Gold",v:15}] },
  { label:"Aggressive",   color:T.green, icon:"🚀", desc:"Growth first. Suitable: Equity MF, Small/Mid-cap, REITs.",  alloc:[{name:"Debt/FD",v:15},{name:"Equity",v:70},{name:"Gold",v:15}] },
];
const PCOLS = [T.blue, T.green, T.amber];

function RiskProfiler({ onSave }) {
  const [ans, setAns] = useState({});
  const total = Object.values(ans).reduce((a, b) => a + b, 0);
  const done  = Object.keys(ans).length;
  const profile = total <= 8 ? RISK_PROFILES[0] : total <= 14 ? RISK_PROFILES[1] : RISK_PROFILES[2];

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 300px" }}>
        {QS.map((item, qi) => (
          <div key={qi} style={{ marginBottom: 14 }}>
            <div style={{ color: T.text, fontSize: 13, marginBottom: 7, fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ color: T.green, fontWeight: 700, marginRight: 6 }}>Q{qi + 1}.</span>{item.q}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {item.opts.map((opt, oi) => {
                const sel = ans[qi] === item.sc[oi];
                return (
                  <button key={oi} onClick={() => setAns({ ...ans, [qi]: item.sc[oi] })}
                    style={{ padding: "7px 12px", borderRadius: 7, border: `1.5px solid ${sel ? T.green : T.borderG}`, background: sel ? T.greenPale : "transparent", color: sel ? T.green : T.sub, fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
                    {sel ? "✓ " : ""}{opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: "1 1 220px" }}>
        {done === QS.length ? (
          <div style={{ background: T.greenPale, border: `2px solid ${profile.color}`, borderRadius: 14, padding: "20px 18px" }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 36 }}>{profile.icon}</div>
              <div style={{ color: profile.color, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>{profile.label}</div>
              <div style={{ color: T.sub, fontSize: 12, marginTop: 6 }}>{profile.desc}</div>
            </div>
            {/* FIX: unique gradient IDs prefixed with "rp_" */}
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={profile.alloc} cx="50%" cy="50%" outerRadius={65} dataKey="v">
                  {profile.alloc.map((_, i) => <Cell key={i} fill={PCOLS[i]} />)}
                </Pie>
                <Tooltip formatter={v => `${v}%`} contentStyle={{ background: T.surface, border: `1px solid ${T.borderG}`, borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ color: T.muted, fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <SaveBtn onClick={() => onSave({ tool: "Risk Profiler", inputs: { score: total, questions: `${done} answered` }, result: { profile: profile.label } })} />
          </div>
        ) : (
          <div style={{ background: T.greenPale, border: `1px solid ${T.borderG}`, borderRadius: 14, padding: "20px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            <div style={{ color: T.sub, fontSize: 13 }}>Answer all {QS.length} questions</div>
            <div style={{ marginTop: 12, background: T.borderG, borderRadius: 30, overflow: "hidden", height: 7 }}>
              <div style={{ height: "100%", width: `${(done / QS.length) * 100}%`, background: T.green, transition: "width 0.3s", borderRadius: 30 }} />
            </div>
            <div style={{ color: T.green, fontSize: 12, marginTop: 6 }}>{done}/{QS.length} answered</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── COMPOUND / EMI ─────────────────────────────────────────────────────── */
function CompoundEMI({ onSave }) {
  const [tab,   setTab]   = useState("compound");
  const [pInp,  setPInp]  = useState("100000");
  const [r,     setR]     = useState(10);
  const [y,     setY]     = useState(15);
  const [freq,  setFreq]  = useState(12);
  const [lInp,  setLInp]  = useState("500000");
  const [lr,    setLr]    = useState(8.5);
  const [lt,    setLt]    = useState(20);

  const pv = Math.max(1, pn(pInp));
  // FIX: guard freq=0
  const safeFreq = freq || 1;
  const final = pv * Math.pow(1 + r / 100 / safeFreq, safeFreq * y);
  const si    = pv + (pv * r * y / 100);

  const lv    = Math.max(1, pn(lInp));
  const emiR  = lr / 100 / 12;
  const emiM  = lt * 12;
  // FIX: use safe calcEMI helper
  const emi      = calcEMI(lv, emiR, emiM);
  const totalPay = emi * emiM;
  const interest = Math.max(0, totalPay - lv);

  const compData = Array.from({ length: y + 1 }, (_, i) => ({
    year: i,
    "Simple":   Math.round(pv + (pv * r * i / 100)),
    "Compound": Math.round(pv * Math.pow(1 + r / 100 / safeFreq, safeFreq * i)),
  }));

  const emiData = Array.from({ length: lt }, (_, i) => {
    const paidSoFar     = (i + 1) * 12 * emi;
    // FIX: guard division by 0 in principal-paid formula
    const principalPaid = emiR > 0
      ? lv * (1 - Math.pow(1 + emiR, -(emiM - (i + 1) * 12)))
      : lv * ((i + 1) * 12 / emiM);
    return {
      year: i + 1,
      "Principal": Math.round(Math.min(principalPaid, lv)),
      "Interest":  Math.round(Math.max(0, Math.min(paidSoFar, totalPay) - Math.min(principalPaid, lv))),
    };
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["compound", "⚡ Compound Interest"], ["emi", "🏠 EMI / Loan"]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "7px 18px", borderRadius: 20, border: `1.5px solid ${tab === t ? T.green : T.borderG}`, background: tab === t ? T.green : "transparent", color: tab === t ? "#fff" : T.muted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: tab === t ? 700 : 400 }}>
            {l}
          </button>
        ))}
      </div>

      {tab === "compound" ? (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <InputField label="Principal Amount" value={pInp} onChange={setPInp} placeholder="1,00,000" />
            <Slider label="Annual Rate (%)" value={r} min={1} max={30} step={0.5} onChange={setR} format={pct} color={T.amber} />
            <Slider label="Years"           value={y} min={1} max={40}           onChange={setY} format={yrs} color={T.blue} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 6 }}>Compounding Frequency</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[[1,"Yearly"],[4,"Quarterly"],[12,"Monthly"],[365,"Daily"]].map(([f, label]) => (
                  <button key={f} onClick={() => setFreq(f)}
                    style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, cursor: "pointer", border: `1.5px solid ${freq === f ? T.green : T.borderG}`, background: freq === f ? T.greenPale : "transparent", color: freq === f ? T.green : T.muted, fontFamily: "'DM Sans',sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatBadge label="Compound Total" value={fmt(final)} color={T.green} icon="⚡" />
              <StatBadge label="Simple Total"   value={fmt(si)}    color={T.blue}  icon="📐" sub={`Extra: ${fmt(final - si)}`} />
            </div>
            <SaveBtn onClick={() => onSave({ tool: "Compound Interest", inputs: { principal: fmt(pv), rate: pct(r), years: yrs(y) }, result: { compound: fmt(final), simple: fmt(si), extra: fmt(final - si) } })} />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Compound vs Simple Growth</div>
            {/* FIX: unique gradient IDs prefixed with "ci_" */}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={compData.filter((_, i) => i % Math.max(1, Math.floor(y / 8)) === 0 || i === y)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderG} />
                <XAxis dataKey="year" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
                <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} tickFormatter={fmt} width={72} />
                <Tooltip content={<CTip />} />
                <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
                <Bar dataKey="Simple"   fill={T.blue}  fillOpacity={0.7}  radius={[4,4,0,0]} />
                <Bar dataKey="Compound" fill={T.green} fillOpacity={0.85} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <InputField label="Loan Amount"          value={lInp} onChange={setLInp} placeholder="5,00,000" />
            <Slider label="Interest Rate (p.a.)" value={lr} min={1} max={20} step={0.25} onChange={setLr} format={pct} color={T.red} />
            <Slider label="Loan Tenure"          value={lt} min={1} max={30}           onChange={setLt} format={yrs} color={T.blue} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <StatBadge label="Monthly EMI"    value={fmt(emi)}      color={T.green} icon="📅" />
              <StatBadge label="Total Interest" value={fmt(interest)} color={T.red}   icon="💸" sub={`${pct((interest / lv) * 100)} of loan`} />
            </div>
            <div style={{ marginTop: 10, background: T.redL, border: "1px solid #fecaca", borderRadius: 9, padding: "9px 12px", fontSize: 12, color: "#7f1d1d" }}>
              🏦 Total repayment: <strong>{fmt(totalPay)}</strong>
            </div>
            <SaveBtn onClick={() => onSave({ tool: "EMI Calculator", inputs: { loan: fmt(lv), rate: pct(lr), tenure: yrs(lt) }, result: { emi: fmt(emi), totalInterest: fmt(interest), totalPayment: fmt(totalPay) } })} />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Loan Repayment Breakdown</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={emiData.filter((_, i) => i % Math.max(1, Math.floor(lt / 8)) === 0 || i === lt - 1)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderG} />
                <XAxis dataKey="year" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
                <YAxis stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} tickFormatter={fmt} width={72} />
                <Tooltip content={<CTip />} />
                <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
                <Bar dataKey="Principal" stackId="a" fill={T.green} fillOpacity={0.8} />
                <Bar dataKey="Interest"  stackId="a" fill={T.red}   fillOpacity={0.6} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PROFILE PAGE ───────────────────────────────────────────────────────── */
function ProfilePage({ user, profile, history, onUpdateProfile, onClearHistory, onBack }) {
  // FIX: safely initialise form — profile may be null on first render
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name:   profile?.name   || user?.name  || "",
    age:    profile?.age    || "",
    income: profile?.income || "",
    goal:   profile?.goal   || "",
    city:   profile?.city   || "",
  });

  const toolCount = {};
  history.forEach(h => { toolCount[h.tool] = (toolCount[h.tool] || 0) + 1; });
  const topTool = Object.entries(toolCount).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${T.borderG}`, borderRadius: 8, padding: "6px 12px", color: T.muted, fontSize: 12, cursor: "pointer" }}>← Back</button>
        <h2 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", color: T.text, fontSize: 18 }}>My Profile & Calculation History</h2>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <Card style={{ flex: "1 1 240px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${T.green},${T.greenL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff", fontWeight: 700 }}>
              {(form.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Outfit',sans-serif" }}>{form.name || user?.name}</div>
              <Chip color={T.green}>{form.city || "India"}</Chip>
            </div>
          </div>

          {!edit ? (
            <>
              {[["Age", form.age, "yrs"], ["Income", form.income && fmt(Number(form.income)), ""], ["Goal", form.goal, ""], ["City", form.city, ""]].map(([k, v]) => v ? (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.borderG}`, fontSize: 13 }}>
                  <span style={{ color: T.muted }}>{k}</span>
                  <span style={{ color: T.text, fontWeight: 700 }}>{v}</span>
                </div>
              ) : null)}
              <button onClick={() => setEdit(true)} style={{ marginTop: 12, width: "100%", padding: "8px", borderRadius: 8, border: `1.5px solid ${T.green}`, background: "transparent", color: T.green, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✏️ Edit Profile</button>
            </>
          ) : (
            <>
              {[["Full Name","name","text"],["Age","age","number"],["Monthly Income (₹)","income","number"],["Primary Goal","goal","text"],["City","city","text"]].map(([label, key, type]) => (
                <div key={key} style={{ marginBottom: 9 }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{label}</div>
                  <input type={type} value={form[key] || ""} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.borderG}`, fontSize: 13, color: T.text, background: T.bg, outline: "none" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => { onUpdateProfile(form); setEdit(false); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: T.green, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEdit(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${T.borderG}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </>
          )}
        </Card>

        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatBadge label="Calculations" value={history.length}                           color={T.green} icon="🔢" />
            <StatBadge label="Tools Used"   value={Object.keys(toolCount).length}            color={T.blue}  icon="🛠️" />
            <StatBadge label="Fav Tool"     value={topTool ? topTool[0].split(" ")[0] : "—"} color={T.amber} icon="⭐" />
          </div>
          {Object.keys(toolCount).length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, fontFamily: "'Outfit',sans-serif" }}>📊 Tool Usage</div>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={Object.entries(toolCount).map(([name, count]) => ({ name: name.split(" ")[0], count }))} layout="vertical">
                  <XAxis type="number" stroke={T.muted} tick={{ fill: T.muted, fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: T.sub, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.borderG}`, borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill={T.green} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>

      <Card style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Outfit',sans-serif" }}>📁 Calculation History</div>
          {history.length > 0 && (
            <button onClick={onClearHistory} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.red}`, background: "transparent", color: T.red, fontSize: 11, cursor: "pointer" }}>🗑️ Clear All</button>
          )}
        </div>
        {history.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "28px 0" }}>No saved calculations yet. Use any calculator and hit "Save to History".</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {history.slice(0, 25).map(h => (
              <div key={h.id} style={{ background: T.greenPale, border: `1px solid ${T.greenMid}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ flex: "1 1 130px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text, fontFamily: "'Outfit',sans-serif" }}>{h.tool}</div>
                  <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{h.ts}</div>
                </div>
                <div style={{ flex: "2 1 180px", display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {Object.entries(h.inputs || {}).map(([k, v]) => v && v !== "—" ? (
                    <span key={k} style={{ fontSize: 10, color: T.sub, background: T.surface, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.borderG}` }}>{k}: {v}</span>
                  ) : null)}
                </div>
                <div style={{ flex: "1 1 110px", display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {Object.entries(h.result || {}).map(([k, v]) => (
                    <span key={k} style={{ fontSize: 10, fontWeight: 700, color: T.green, background: T.surface, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.greenMid}` }}>→ {v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─── AUTH MODAL ─────────────────────────────────────────────────────────── */
function AuthModal({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err,  setErr]  = useState("");

  const handle = async () => {
    if (!form.email || !form.password) return setErr("Email and password are required.");
    if (mode === "signup" && !form.name) return setErr("Please enter your name.");
    setErr("");

    const email = form.email.toLowerCase().trim();
    const password = form.password.trim();

    if (mode === "login") {
      const existingUser = (await DB.getUsers()).find(u => u.email === email);
      if (!existingUser) {
        return setErr("No account found with this email. Please sign up first.");
      }
      // Migrate legacy users who previously didn't store passwords
      if (!existingUser.password) {
        existingUser.password = password;
        await DB.setUser(existingUser);
      }
      if (existingUser.password !== password) {
        return setErr("Incorrect password. Please try again.");
      }
      await DB.setUser(existingUser);
      onAuth(existingUser);
    } else {
      const existingUser = (await DB.getUsers()).find(u => u.email === email);
      if (existingUser) {
        return setErr("An account with this email already exists. Please login instead.");
      }
      const user = { name: form.name || form.email.split("@")[0], email, password, joined: new Date().toLocaleDateString("en-IN") };
      await DB.setUser(user);
      onAuth(user);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,20,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }}>
      <div style={{ background: T.surface, borderRadius: 18, padding: "34px 30px", width: 360, boxShadow: T.shadowMd, border: `1px solid ${T.borderG}` }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Outfit',sans-serif", color: T.text }}>Invest<span style={{ color: T.green }}>Quest</span></div>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>India's Financial Learning Platform</div>
        </div>
        <div style={{ display: "flex", background: T.greenPale, borderRadius: 9, padding: 3, marginBottom: 18 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: "7px", borderRadius: 7, border: "none", background: mode === m ? T.green : "transparent", color: mode === m ? "#fff" : T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
              {m === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>
        {mode === "signup" && (
          <div style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Full Name</div>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.borderG}`, fontSize: 13, color: T.text, background: T.bg, outline: "none" }} />
          </div>
        )}
        <div style={{ marginBottom: 11 }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Email</div>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.borderG}`, fontSize: 13, color: T.text, background: T.bg, outline: "none" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Password</div>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.borderG}`, fontSize: 13, color: T.text, background: T.bg, outline: "none" }} />
        </div>
        {err && <div style={{ color: T.red, fontSize: 12, marginBottom: 12, background: T.redL, borderRadius: 7, padding: "6px 10px" }}>{err}</div>}
        <button onClick={handle} style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: T.green, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 12px ${T.green}50` }}>
          {mode === "login" ? "Login to InvestQuest" : "Create Account"}
        </button>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: T.muted }}>
          {mode === "login" ? "No account? " : "Already have one? "}
          <span onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ color: T.green, cursor: "pointer", fontWeight: 600 }}>
            {mode === "login" ? "Sign Up" : "Login"}
          </span>
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: T.muted }}>🔒 Data stored locally in your browser.</div>
      </div>
    </div>
  );
}

/* ─── TABS ───────────────────────────────────────────────────────────────── */
const TABS = [
  { id:"analyser",  label:"Investment Analyser", icon:"🔍", component:InvestmentAnalyser, highlight:true },
  { id:"sip",       label:"SIP Growth",          icon:"📈", component:SIPCalc },
  { id:"goal",      label:"Goal Planner",        icon:"🎯", component:GoalCalc },
  { id:"inflation", label:"Inflation Impact",    icon:"🔥", component:InflationCalc },
  { id:"risk",      label:"Risk Profile",        icon:"🧠", component:RiskProfiler },
  { id:"compound",  label:"Compound / EMI",      icon:"⚡", component:CompoundEMI },
];

/* ─── ROOT APP ───────────────────────────────────────────────────────────── */
export default function App() {
  const [user,    setUser]    = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState("analyser");
  const [page,    setPage]    = useState("calc");
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [toast,   setToast]   = useState("");

  const refreshUsers = async () => {
    const all = await DB.getUsers();
    setUsers(all);
  };

  useEffect(() => {
    (async () => {
      const u  = await DB.getUser();
      const h  = await DB.getHistory();
      const pr = await DB.getProfile();
      if (u) setUser(u);
      setHistory(h);
      setProfile(pr);
      await refreshUsers();
      setLoading(false);
    })();
  }, []);

  // Reload stored data whenever the active user changes.
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setProfile(null);
      return;
    }

    (async () => {
      const h  = await DB.getHistory();
      const pr = await DB.getProfile();
      setHistory(h);
      setProfile(pr);
    })();
  }, [user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleSave = async (entry) => {
    const arr = await DB.addHistory(entry);
    setHistory(arr);
    showToast("✅ Saved to history!");
  };

  const handleUpdateProfile = async (p) => {
    await DB.setProfile(p);
    setProfile(p);
    const u = { ...user, name: p.name || user.name };
    await DB.setUser(u);
    setUser(u);
    showToast("✅ Profile updated!");
  };

  const handleSwitchUser = async () => {
    const email = window.prompt("Enter the email of the account to switch to:");
    if (!email) return;
    const norm = email.toLowerCase().trim();
    const candidate = (await DB.getUsers()).find(u => u.email === norm);
    if (!candidate) {
      showToast("No user found with that email.");
      return;
    }
    await DB.setUser(candidate);
    setUser(candidate);
    showToast(`Switched to ${candidate.name}`);
  };

  const handleLogout = async () => {
    // Clear the active session (but keep all stored accounts).
    await DB.setUser(null);
    setUser(null);
    setPage("calc");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
        <div style={{ color: T.green, fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18 }}>Loading InvestQuest…</div>
      </div>
    </div>
  );

  const ActiveCalc = TABS.find(t => t.id === active)?.component;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a121c 0%, #0f1c33 45%, #102548 100%)", color: T.text, fontFamily: "'DM Sans',sans-serif", position: "relative", overflow: "hidden" }}>
      <ParticleBackground />
      {/* FIX: global styles hoisted to top-level, outside any conditional/animated div */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes iqFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        input:focus  { border-color: ${T.green} !important; box-shadow: 0 0 0 3px ${T.green}3d !important; outline: none; }
        select:focus { border-color: ${T.green} !important; outline: none; }
        button:active { opacity: .87; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${T.greenMid}; border-radius: 3px; }
        body { background: #0b1320; }
      `}</style>

      {!user && <AuthModal onAuth={u => { setUser(u); refreshUsers(); }} />}

      {/* TOP BAR */}
      <div style={{ background: "linear-gradient(90deg, rgba(12,25,47,0.95), rgba(5,11,18,0.8))", borderBottom: `1px solid ${T.border}`, padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 8px 22px rgba(0,0,0,0.45)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🏆</div>
          <span style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>Invest<span style={{ color: T.green }}>Quest</span></span>
          <Chip color={T.green} bg={T.greenPale}>🇮🇳 India</Chip>
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setPage(page === "profile" ? "calc" : "profile")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 8, border: `1px solid ${T.borderG}`, background: page === "profile" ? T.greenPale : T.surface, color: T.green, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                {(profile?.name || user.name || "U")[0].toUpperCase()}
              </div>
              {profile?.name || user.name}
            </button>
            <button onClick={handleSwitchUser} style={{ padding: "5px 9px", borderRadius: 7, border: `1px solid ${T.borderG}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer" }}>Switch</button>
            <button onClick={handleLogout} style={{ padding: "5px 9px", borderRadius: 7, border: `1px solid ${T.borderG}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer" }}>Logout</button>
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(29, 201, 121, 0.95)", color: "#0a1120", padding: "10px 22px", borderRadius: 30, fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: T.shadowMd }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 14px" }}>
        {page === "profile" ? (
          <ProfilePage
            user={user} profile={profile} history={history}
            onUpdateProfile={handleUpdateProfile}
            onClearHistory={async () => { await DB.clearHistory(); setHistory([]); showToast("🗑️ History cleared."); }}
            onBack={() => setPage("calc")}
          />
        ) : (
          <>
            {user && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 11, padding: "11px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", boxShadow: T.shadow }}>
                <span style={{ fontSize: 13, color: T.sub, flex: 1 }}>
                  👋 Welcome, <strong style={{ color: T.text }}>{profile?.name || user.name}</strong> — Try <strong style={{ color: T.green }}>🔍 Investment Analyser</strong> to enter any investment and see risk, gains & returns instantly.
                </span>
                <Chip color={T.blue} bg={T.blueL}>💾 {history.length} saved</Chip>
              </div>
            )}

            {/* TABS */}
            <div style={{ display: "flex", gap: 5, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActive(tab.id)}
                  style={{ padding: "8px 15px", borderRadius: 9, border: `1.5px solid ${active === tab.id ? T.green : tab.highlight ? T.greenMid : T.borderG}`, background: active === tab.id ? T.green : tab.highlight && active !== tab.id ? T.greenPale : T.surface, color: active === tab.id ? "#fff" : tab.highlight ? T.green : T.muted, fontSize: 12, cursor: "pointer", fontWeight: active === tab.id || tab.highlight ? 700 : 400, whiteSpace: "nowrap", transition: "all 0.15s", boxShadow: active === tab.id ? `0 2px 8px ${T.green}40` : "none" }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* CALCULATOR CARD */}
            <Card style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 17, color: T.text }}>
                    {TABS.find(t => t.id === active)?.icon} {TABS.find(t => t.id === active)?.label}
                  </h2>
                  <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>Interactive · Real-time · Indian market context</div>
                </div>
                <Chip color={T.green} bg={T.greenPale}>● Live</Chip>
              </div>
              {user && ActiveCalc && <ActiveCalc onSave={handleSave} />}
            </Card>

            {/* RECENT HISTORY STRIP */}
            {history.length > 0 && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>🕐 Recent Calculations</div>
                  <button onClick={() => setPage("profile")} style={{ fontSize: 12, color: T.green, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }}>View All →</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {history.slice(0, 3).map(h => (
                    <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 10px", background: T.greenPale, borderRadius: 8, fontSize: 12, flexWrap: "wrap" }}>
                      <span style={{ color: T.green, fontWeight: 700, minWidth: 100 }}>{h.tool}</span>
                      <span style={{ color: T.muted, flex: 1 }}>{Object.entries(h.result || {}).map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>
                      <span style={{ color: T.muted, fontSize: 10 }}>{h.ts}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div style={{ marginTop: 20, textAlign: "center", color: T.muted, fontSize: 10, borderTop: `1px solid ${T.borderG}`, paddingTop: 14 }}>
              ⚠️ InvestQuest is for <strong>educational purposes only</strong>. All projections are estimates. Consult a SEBI-registered advisor before investing.
            </div>
          </>
        )}
      </div>
    </div>
  );
}