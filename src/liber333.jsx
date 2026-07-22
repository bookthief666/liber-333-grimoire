// ═══════════════════════════════════════════════════════════════════
//  LIBER CCCXXXIII — THE BOOK OF LIES — DIGITAL GRIMOIRE
//  A Complete Oracle of Aleister Crowley's masterwork
//  Single-file React JSX Application
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";
import { fetchOracleInterpretation } from './api.js';
import { useAIOracle } from './features/oracle/useAIOracle.js';
import { useGrimoireNavigation } from './contexts/GrimoireNavigationContext.jsx';
import LandingCenterpiece from './LandingCenterpiece.jsx';
import { NOTABLE_NUMBERS } from './features/gematria/gematriaData.js';
import { calculateGematria, findCorrespondences } from './features/gematria/gematriaEngine.js';
import { selectReadingChapters } from './features/oracle/divinationSelection.js';
import { useJournal } from './features/journal/useJournal.js';
import { RITUALS } from './features/rites/ritualData.js';
import { ELEMENT_SYMBOLS, HEBREW_LETTERS, formatChapterNumber, getSephiraColor, getSephiraInfo } from './data/correspondences.js';
import { LIBER_333 } from './data/liber333.js';
import { PLANETS, useLunarPhase, usePlanetaryTime } from './features/cosmic/cosmicTiming.js';
import { TREE_NODE_ORDER, TREE_POS, deriveTreePaths, getVeilChapters, groupChaptersBySephira } from './features/tree/treeModel.js';

// ─────────────────────────────────────────────
//  GEMATRIA ENGINE — TABLES
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  GEMATRIA ENGINE — FUNCTIONS
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  NOISE TEXTURE
// ─────────────────────────────────────────────
const NOISE_TEXTURE_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
)}`;


// ─────────────────────────────────────────────
//  HAPTIC FEEDBACK
// ─────────────────────────────────────────────
const haptic = (pattern) => {
  try { navigator?.vibrate?.(pattern); } catch(e) {}
};

// ─────────────────────────────────────────────
//  AUDIO ENGINE (Enhanced)
// ─────────────────────────────────────────────
const useAudioEngine = (active, intensity = 0.5) => {
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const masterRef = useRef(null);

  const init = useCallback(() => {
    if (ctxRef.current) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24; comp.knee.value = 12;
    comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
    comp.connect(master);

    [55, 110, 165, 220].forEach((freq, i) => {
      const types = ['sawtooth', 'square', 'triangle', 'sine'];
      const vols = [0.3, 0.15, 0.08, 0.2];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();
      osc.type = types[i]; osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 3;
      gain.gain.value = vols[i]; pan.pan.value = (i - 1.5) * 0.3;
      osc.connect(gain); gain.connect(pan); pan.connect(comp);
      osc.start(); nodesRef.current.push(osc);
    });

    const binL = ctx.createOscillator(); const binR = ctx.createOscillator();
    const gL = ctx.createGain(); const gR = ctx.createGain();
    const merger = ctx.createChannelMerger(2);
    binL.frequency.value = 200; binR.frequency.value = 207.83;
    binL.type = binR.type = 'sine';
    gL.gain.value = gR.gain.value = 0.06;
    binL.connect(gL); binR.connect(gR);
    gL.connect(merger, 0, 0); gR.connect(merger, 0, 1);
    merger.connect(master); binL.start(); binR.start();

    const lfo = ctx.createOscillator(); const lfoG = ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.08; lfoG.gain.value = 0.04;
    lfo.connect(lfoG); lfoG.connect(master.gain); lfo.start();
  }, []);

  useEffect(() => {
    if (active) {
      init();
      if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
      if (masterRef.current && ctxRef.current) {
        masterRef.current.gain.cancelScheduledValues(ctxRef.current.currentTime);
        masterRef.current.gain.setTargetAtTime(0.12 * intensity, ctxRef.current.currentTime, 2);
      }
    } else if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.5);
    }
  }, [active, intensity, init]);

  const playBell = useCallback((freq = 528) => {
    if (!ctxRef.current || !masterRef.current) return;
    const ctx = ctxRef.current; const now = ctx.currentTime;
    [freq, freq * 2.003].forEach((f, i) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      g.gain.setValueAtTime(i === 0 ? 0.25 : 0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + (i === 0 ? 3 : 2.5));
      osc.connect(g); g.connect(masterRef.current);
      osc.start(now); osc.stop(now + 3);
    });
  }, []);

  const playImpact = useCallback(() => {
    if (!ctxRef.current || !masterRef.current) return;
    const ctx = ctxRef.current; const now = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(g); g.connect(masterRef.current);
    osc.start(now); osc.stop(now + 0.8);
  }, []);

  return { playBell, playImpact };
};

// ─────────────────────────────────────────────
//  VOICE ENGINE (Web Speech API)
// ─────────────────────────────────────────────
const useVoice = () => {
  const synthRef = useRef(null);
  const voiceRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const [available, setAvailable] = useState(false);

  // Choose the deepest, most resonant male voice available — a sage/wizard
  // timbre (British baritone preferred), in the spirit of Alan Moore.
  const pickVoice = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return null;
    const voices = synth.getVoices();
    if (!voices.length) return null;
    // Ranked preferences — earlier = deeper / more esoteric British male.
    const ranked = [
      /daniel/i,                        // iOS/macOS UK male — deep, grave
      /arthur|oliver|george/i,          // British male names
      /google uk english male/i,
      /uk english male|en[-_]gb.*male/i,
      /microsoft (george|ryan|james)/i,
      /rishi|brian/i,
      /\bmale\b/i,
      /en[-_]gb/i,
      /english/i,
    ];
    for (const re of ranked) {
      const hit = voices.find(v => re.test(v.name) || (v.lang && re.test(v.lang)));
      if (hit) return hit;
    }
    return voices.find(v => /^en/i.test(v.lang)) || voices[0];
  }, []);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    synthRef.current = window.speechSynthesis;
    setAvailable(true);
    const load = () => { voiceRef.current = pickVoice(); };
    load();
    // Voices often load asynchronously.
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load);
  }, [pickVoice]);

  const speak = useCallback((text) => {
    if (!synthRef.current || !text) return;
    synthRef.current.cancel();
    if (!voiceRef.current) voiceRef.current = pickVoice();

    // Speak in measured sentences so the cadence feels like an incantation
    // rather than a rushed monotone. Each clause gets a low, slow delivery.
    const clauses = text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?;:—])\s+/)
      .filter(Boolean);

    let started = false;
    clauses.forEach((clause, i) => {
      const utt = new SpeechSynthesisUtterance(clause);
      utt.rate = 0.74;     // slow, deliberate
      utt.pitch = 0.55;    // deep, grave
      utt.volume = 1.0;
      if (voiceRef.current) utt.voice = voiceRef.current;
      if (i === 0) utt.onstart = () => { if (!started) { started = true; setSpeaking(true); } };
      if (i === clauses.length - 1) {
        utt.onend = () => setSpeaking(false);
      }
      utt.onerror = () => setSpeaking(false);
      synthRef.current.speak(utt);
    });
    setSpeaking(true);
  }, [pickVoice]);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, available };
};

// ─────────────────────────────────────────────
//  GUIDED RITUALS — the three performable rites of Liber 333
//  Faithful to Crowley's published text (1913, public domain). Presented
//  as a guided recitation/visualization; physical implements are optional
//  and the rites may be performed symbolically.
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  GEMATRIA ECHOES (highlight notable words)
// ─────────────────────────────────────────────
const findGematriaEchoes = (text) => {
  if (!text) return [];
  const words = text.split(/\s+/);
  const echoes = [];
  words.forEach((word, idx) => {
    const clean = word.replace(/[^a-zA-Z]/g, '');
    if (clean.length < 3) return;
    const val = calculateGematria(clean).simple;
    if (NOTABLE_NUMBERS[val]) {
      echoes.push({ word: clean, value: val, meaning: NOTABLE_NUMBERS[val].split(';')[0].split('—')[0].trim(), index: idx });
    }
  });
  return echoes;
};


// ─────────────────────────────────────────────
//  PARTICLE CANVAS (Enhanced — planetary colors)
// ─────────────────────────────────────────────
const ParticleCanvas = ({ active, intensity = 1, accentColor = "#dc2626" }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Parse accent color to RGB
    const parseColor = (hex) => {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return { r, g, b };
    };
    const c = parseColor(accentColor || "#dc2626");

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(Math.random() * 2.5 + 0.8) * intensity,
      size: Math.random() * 3 + 0.5,
      life: 1,
      decay: Math.random() * 0.008 + 0.003,
      phase: Math.random() * Math.PI * 2,
      bright: Math.random() > 0.7, // 30% are brighter accent particles
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (active && particlesRef.current.length < Math.floor(120 * intensity)) {
        for (let i = 0; i < Math.ceil(2 * intensity); i++)
          particlesRef.current.push(createParticle());
      }
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx + Math.sin(p.y * 0.008 + p.phase) * 0.4;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) return false;
        const a = p.life, r = p.size * p.life;
        // silver stars, with ~30% tinted by the planetary accent
        const pc = p.bright ? c : { r: 205, g: 212, b: 245 };
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pc.r},${pc.g},${pc.b},${a * 0.85})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a * 0.6})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pc.r},${pc.g},${pc.b},${a * 0.06})`; ctx.fill();
        return true;
      });

      // Constellation lines — link nearby stars with faint silver threads.
      const ps = particlesRef.current;
      const N = Math.min(ps.length, 70);
      const D = 120, D2 = D * D;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < D2) {
            const a = (1 - d2 / D2) * 0.28 * Math.min(ps[i].life, ps[j].life);
            ctx.strokeStyle = `rgba(190,200,240,${a})`;
            ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active, intensity, accentColor]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none"
      style={{ opacity: active ? 1 : 0, transition: 'opacity 2s', zIndex: 1 }} />
  );
};

// ─────────────────────────────────────────────
//  EVOLVING SIGIL (Enhanced — accumulates from readings)
// ─────────────────────────────────────────────
const AnimatedSigil = ({ input, size = 200, spinning = true, glowing = true, 
                         evolutionRings = 0, accentColor = "#dc2626" }) => {
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!spinning) return;
    const iv = setInterval(() => setTime(t => t + 0.02), 16);
    return () => clearInterval(iv);
  }, [spinning]);

  const geometry = useMemo(() => {
    if (!input) return null;
    const hash = Math.abs(Array.from(input).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0));
    const basePoints = 5 + (hash % 8);
    const baseRings = 2 + (hash % 3);
    const numRings = baseRings + Math.min(evolutionRings, 4); // Up to 4 extra rings from readings
    const points = [], lines = [], rings = [];

    for (let r = 0; r < numRings; r++) {
      const ringRadius = 22 + r * (70 / numRings);
      rings.push({ radius: ringRadius, evolved: r >= baseRings });
      const numPts = basePoints + (r >= baseRings ? r - baseRings + 3 : 0);
      const ringPts = [];
      for (let i = 0; i < numPts; i++) {
        const angle = (i / numPts) * Math.PI * 2 + (r * 0.3);
        const charVal = input.charCodeAt((i + r * 3) % input.length) || 65;
        const wobble = (charVal % 20) - 10;
        const x = 100 + Math.cos(angle) * (ringRadius + wobble);
        const y = 100 + Math.sin(angle) * (ringRadius + wobble);
        points.push({ x, y, ring: r, evolved: r >= baseRings });
        ringPts.push({ x, y });
      }
      for (let i = 0; i < ringPts.length; i++) {
        const next = ringPts[(i + 1) % ringPts.length];
        lines.push({ x1: ringPts[i].x, y1: ringPts[i].y, x2: next.x, y2: next.y, ring: r, evolved: r >= baseRings });
      }
    }
    // Cross-ring connections
    for (let i = 0; i < basePoints; i++) {
      for (let r = 0; r < numRings - 1; r++) {
        const idx1 = r * basePoints + (i % points.filter(p => p.ring === r).length);
        const idx2 = (r + 1) * basePoints + ((i + 1) % points.filter(p => p.ring === r + 1).length);
        if (points[idx1] && points[idx2])
          lines.push({ x1: points[idx1].x, y1: points[idx1].y, x2: points[idx2].x, y2: points[idx2].y, ring: -1 });
      }
    }
    return { points, lines, rings };
  }, [input, evolutionRings]);

  if (!geometry) return null;
  const ac = accentColor || "#dc2626";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="w-full h-full" style={{
        filter: glowing ? `drop-shadow(0 0 20px ${ac}99) drop-shadow(0 0 40px ${ac}40)` : 'none'
      }}>
        <defs>
          <radialGradient id="sigilGlow">
            <stop offset="0%" stopColor={ac} stopOpacity="0.3" />
            <stop offset="100%" stopColor={ac} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill="url(#sigilGlow)" />
        {geometry.rings.map((r, i) => (
          <circle key={`ring-${i}`} cx="100" cy="100" r={r.radius} fill="none"
            stroke={r.evolved ? "#fbbf24" : ac}
            strokeWidth={i === 0 ? 2 : r.evolved ? 0.6 : 1}
            strokeDasharray={i > 0 ? "4 3" : "none"}
            opacity={r.evolved ? 0.3 + Math.sin(time * 1.5 + i) * 0.1 : 0.6 - i * 0.08}
            transform={`rotate(${time * (18 + i * 8) * (i % 2 === 0 ? 1 : -1)} 100 100)`} />
        ))}
        {geometry.lines.map((line, i) => (
          <line key={`ln-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={line.ring === -1 ? "#ffffff" : line.evolved ? "#fbbf24" : ac}
            strokeWidth={line.ring === -1 ? 1.2 : 0.8}
            opacity={line.ring === -1 ? 0.3 : line.evolved ? 0.2 : 0.25 + Math.sin(time * 2 + i * 0.5) * 0.15} />
        ))}
        {geometry.points.map((pt, i) => {
          const pulse = Math.sin(time * 3 + i * 0.7);
          return (
            <g key={`pt-${i}`}>
              <circle cx={pt.x} cy={pt.y} r={2.5 + pulse * 0.8}
                fill={pt.evolved ? "#fbbf24" : ac} opacity={pt.evolved ? 0.5 : 0.8} />
              <circle cx={pt.x} cy={pt.y} r={5 + pulse * 1.5} fill="none"
                stroke={pt.evolved ? "#fbbf24" : ac} strokeWidth="0.5" opacity="0.2" />
            </g>
          );
        })}
        <circle cx="100" cy="100" r={7 + Math.sin(time * 1.8) * 2}
          fill="none" stroke="white" strokeWidth="1.5" opacity="0.75" />
        <circle cx="100" cy="100" r="2.5" fill="white" opacity={0.5 + Math.sin(time * 4) * 0.3} />
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────
//  CRT OVERLAY
// ─────────────────────────────────────────────
const CRTOverlay = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 50 }}>
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.02), rgba(0,0,255,0.04))',
      backgroundSize: '100% 3px, 4px 100%'
    }} />
    <div className="absolute inset-0" style={{
      background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.7) 100%)'
    }} />
  </div>
);

// ─────────────────────────────────────────────
//  GLITCH TEXT
// ─────────────────────────────────────────────
const GLYPHS = "\u0391\u0392\u0393\u0394\u0395\u0396\u0397\u0398\u0399\u039A\u039B\u039C\u039D\u039E\u039F\u03A0\u03A1\u03A3\u03A4\u03A5\u03A6\u03A7\u03A8\u03A9\u2234\u2235\u2295\u2297\u2609\u263D\u2605\u26A1\u2318\u221E\u2299";

const GlitchText = ({ text, active, speed = 30, className = "" }) => {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    let iter = 0;
    const iv = setInterval(() => {
      setDisplay(text.split("").map((c, i) => {
        if (c === ' ') return ' ';
        if (i < iter) return text[i];
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }).join(""));
      if (iter >= text.length) clearInterval(iv);
      iter += 1 / 3;
    }, speed);
    return () => clearInterval(iv);
  }, [text, active, speed]);
  return <span className={className}>{display}</span>;
};

// ─────────────────────────────────────────────
//  TYPEWRITER TEXT
// ─────────────────────────────────────────────
const TypewriterText = ({ text, speed = 20, onComplete, className = "" }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); onComplete?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse" style={{ opacity: 0.7 }}>▌</span>}
    </span>
  );
};

// ─────────────────────────────────────────────
//  NOISE BACKGROUND
// ─────────────────────────────────────────────
const NoiseBackground = () => (
  <div className="fixed inset-0 pointer-events-none opacity-10" style={{ zIndex: 0, backgroundImage: `url("${NOISE_TEXTURE_URL}")` }} />
);

// ─────────────────────────────────────────────
//  BABALON STAR — the seven-pointed Seal of Babalon
//  A neon-crimson heptagram that shapeshifts {7/2}↔{7/3}, glitches with
//  chromatic aberration, and teleports to new positions, fading in and
//  out across the whole app. Pure atmosphere — pointer-events: none.
// ─────────────────────────────────────────────
const heptagramPath = (cx, cy, r, skip) => {
  const pts = [];
  for (let i = 0; i < 7; i++) {
    const idx = (i * skip) % 7;
    const a = (-90 + idx * (360 / 7)) * Math.PI / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return "M" + pts.join("L") + "Z";
};

const BabalonStar = ({ accentColor = "#ff0028" }) => {
  const [s, setS] = useState({ top: 50, left: 50, size: 200, skip: 3, key: 0, spin: 48, dir: 1 });

  useEffect(() => {
    let alive = true;
    const teleport = () => {
      if (!alive) return;
      setS(prev => ({
        top: 10 + Math.random() * 72,
        left: 12 + Math.random() * 68,
        size: 120 + Math.random() * 190,
        skip: Math.random() > 0.5 ? 3 : 2,
        spin: 36 + Math.random() * 36,
        dir: Math.random() > 0.5 ? 1 : -1,
        key: prev.key + 1,
      }));
    };
    const first = setTimeout(teleport, 1200);
    const iv = setInterval(teleport, 8000);
    return () => { alive = false; clearTimeout(first); clearInterval(iv); };
  }, []);

  const inner = heptagramPath(100, 100, 86, s.skip);
  const ring = heptagramPath(100, 100, 60, s.skip === 3 ? 2 : 3);

  return (
    <div className="fixed pointer-events-none hidden sm:block"
      aria-hidden="true"
      style={{
        zIndex: 1, top: `${s.top}%`, left: `${s.left}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'top 2.8s cubic-bezier(.22,1,.36,1), left 2.8s cubic-bezier(.22,1,.36,1)',
        animation: 'babalonAppear 1.6s ease-out both, babalonBreathe 8s ease-in-out 1.6s infinite',
        mixBlendMode: 'screen',
      }}>
      <svg key={s.key} width={s.size} height={s.size} viewBox="0 0 200 200"
        style={{ animation: `babalonSpin ${s.spin}s linear infinite`, transformOrigin: 'center', transform: `scaleX(${s.dir})` }}>
        <defs>
          <filter id="babGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* chromatic-aberration ghosts (glitch) */}
        <path d={inner} fill="none" stroke="#00e0ff" strokeOpacity="0.35" strokeWidth="1" transform="translate(2.2,-1.4)" />
        <path d={inner} fill="none" stroke="#ff2bdf" strokeOpacity="0.30" strokeWidth="1" transform="translate(-2.2,1.4)" />
        {/* core heptagram */}
        <path d={inner} fill="none" stroke={accentColor} strokeWidth="1.6" filter="url(#babGlow)" />
        <path d={ring} fill="none" stroke={accentColor} strokeOpacity="0.5" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="92" fill="none" stroke={accentColor} strokeOpacity="0.18" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="3" fill={accentColor} filter="url(#babGlow)" />
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────
//  ZODIAC RING — slow counter-rotating glyph wheels behind the sigil
// ─────────────────────────────────────────────
const ZODIAC = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const PLANET_GLYPHS = ["☉","☽","☿","♀","♂","♃","♄"];

const ZodiacRing = ({ size = 320, accentColor = "#ff2e4d" }) => {
  const ring = (glyphs, radius, dur, rev, op, fs) => (
    <div className="absolute inset-0" style={{ animation: `${rev ? 'glyphRingRev' : 'glyphRing'} ${dur}s linear infinite` }}>
      {glyphs.map((g, i) => {
        const a = (i / glyphs.length) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + (radius * Math.cos(a));
        const y = 50 + (radius * Math.sin(a));
        return (
          <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%`, fontSize: fs, color: accentColor, opacity: op,
              textShadow: `0 0 8px ${accentColor}88`, fontFamily: 'serif' }}>
            {g}
          </span>
        );
      })}
    </div>
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: size, height: size, zIndex: -1 }} aria-hidden="true">
      {ring(ZODIAC, 46, 120, false, 0.22, '13px')}
      {ring(PLANET_GLYPHS, 32, 90, true, 0.28, '12px')}
    </div>
  );
};

// ─────────────────────────────────────────────
//  MARGINALIA — faint occult glyphs drifting at the edges (always on)
// ─────────────────────────────────────────────
const MARGINALIA_GLYPHS = ["☉","☽","☿","♀","♂","♃","♄","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","✶","✷","⸸","☤","🜍","🜏","🜔","∴","∵","☉","ϟ"];
const Marginalia = () => {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);
  useEffect(() => {
    const spawn = () => {
      const edge = Math.random() > 0.5;
      setItems(prev => [...prev.slice(-7), {
        id: idRef.current++,
        g: MARGINALIA_GLYPHS[Math.floor(Math.random() * MARGINALIA_GLYPHS.length)],
        x: edge ? 4 + Math.random() * 14 : 82 + Math.random() * 14, // hug left/right margins
        y: 18 + Math.random() * 64,
        size: 14 + Math.random() * 22,
        dur: 7 + Math.random() * 5,
      }]);
    };
    spawn();
    const iv = setInterval(spawn, 3200);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none hidden sm:block" style={{ zIndex: 1 }} aria-hidden="true">
      {items.map(it => (
        <span key={it.id} className="absolute"
          style={{ left: `${it.x}%`, top: `${it.y}%`, fontSize: it.size, color: 'rgba(150,160,230,0.45)',
            textShadow: '0 0 10px rgba(120,130,200,0.4)', fontFamily: 'serif',
            animation: `marginaliaDrift ${it.dur}s ease-in-out both` }}>
          {it.g}
        </span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
//  WEBGL ABYSS — volumetric fractal nebula
//  A full-screen fragment shader. Reacts to ritual phase (intensity)
//  and the active planetary accent color. Degrades to nothing if the
//  GPU/context is unavailable — the 2D layers remain underneath.
// ─────────────────────────────────────────────
const hexToRGB = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return [0.86, 0.15, 0.15];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
};

const ABYSS_FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform float u_intensity;   // 0..~1.2, swells during ritual
uniform vec3  u_accent;      // planetary color (used sparingly as colored stars)

// hash / value noise
float hash(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p,p+34.345); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
  vec2 u = f*f*(3.-2.*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v = 0.0, amp = 0.5;
  mat2 rot = mat2(0.8,-0.6,0.6,0.8);
  for(int i=0;i<5;i++){ v += amp*noise(p); p = rot*p*2.0 + 0.015*u_time; amp *= 0.5; }
  return v;
}

// star layer: sparse bright points that twinkle
float stars(vec2 uv, float density, float sz, float tw){
  vec2 g = floor(uv*density);
  vec2 f = fract(uv*density) - 0.5;
  float h = hash(g);
  float h2 = hash(g+7.1);
  if (h < 0.86) return 0.0;                 // most cells empty
  float d = length(f);
  float twinkle = 0.5 + 0.5*sin(u_time*tw + h2*6.28);
  return smoothstep(sz, 0.0, d) * twinkle;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  float rad = length(uv);
  float vign = smoothstep(1.35, 0.1, rad);

  // Deep indigo nebula — DARK. Never multiplied by a pale accent (no gray washout).
  float t = u_time*0.02;
  vec2 q = vec2(fbm(uv*1.2 + vec2(0.0,t)), fbm(uv*1.2 + vec2(4.2,-t)));
  float neb = fbm(uv*1.1 + 1.8*q);
  neb = pow(clamp(neb,0.0,1.0), 2.6);
  vec3 nebCol = mix(vec3(0.04,0.03,0.10), vec3(0.10,0.05,0.20), neb);  // indigo→violet
  vec3 col = nebCol * neb * (0.5 + 0.5*u_intensity) * vign;

  // a faint crimson swell at the heart during ritual
  float core = smoothstep(0.6, 0.0, rad) * u_intensity;
  col += vec3(0.22,0.02,0.06) * core * 0.5;

  // three star layers (parallax depth) — silver, plus a few accent-tinted
  float s = 0.0;
  s += stars(uv + vec2(0.0, t*0.3), 9.0,  0.06, 2.0) * 0.7;
  s += stars(uv*1.7 + 11.0,        16.0, 0.05, 3.0) * 0.5;
  s += stars(uv*2.6 - 5.0,         26.0, 0.04, 4.5) * 0.35;
  vec3 starCol = mix(vec3(0.8,0.85,1.0), u_accent, 0.25);
  col += starCol * s * vign;

  // base lift so pure black never reads flat
  col += vec3(0.01,0.008,0.022) * vign;

  float alpha = clamp(neb*vign*(0.16 + 0.30*u_intensity) + s*0.9*vign + core*0.4, 0.0, 0.92);
  gl_FragColor = vec4(col, alpha);
}`;

const ABYSS_VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;

const AbyssShader = ({ accentColor = "#dc2626", intensity = 0.3, active = true }) => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ intensity: 0.3, accent: [0.86, 0.15, 0.15] });

  // keep latest props without re-initializing the GL context
  useEffect(() => { stateRef.current.intensity = intensity; }, [intensity]);
  useEffect(() => { stateRef.current.accent = hexToRGB(accentColor); }, [accentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let gl;
    try {
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false })
        || canvas.getContext("experimental-webgl");
    } catch (_) { gl = null; }
    if (!gl) return; // graceful: 2D layers remain
    glRef.current = gl;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("Abyss shader:", gl.getShaderInfoLog(sh)); return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, ABYSS_VERT);
    const fs = compile(gl.FRAGMENT_SHADER, ABYSS_FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn("Abyss link failed"); return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const u_res = gl.getUniformLocation(prog, "u_res");
    const u_time = gl.getUniformLocation(prog, "u_time");
    const u_intensity = gl.getUniformLocation(prog, "u_intensity");
    const u_accent = gl.getUniformLocation(prog, "u_accent");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    let smoothI = stateRef.current.intensity;
    const render = () => {
      resize();
      const time = (performance.now() - start) / 1000;
      // ease intensity toward target for smooth ritual swells
      smoothI += (stateRef.current.intensity - smoothI) * 0.04;
      gl.uniform2f(u_res, canvas.width, canvas.height);
      gl.uniform1f(u_time, time);
      gl.uniform1f(u_intensity, smoothI);
      const a = stateRef.current.accent;
      gl.uniform3f(u_accent, a[0], a[1], a[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, []);

  return (
    <canvas ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: active ? 1 : 0, transition: "opacity 1.2s ease" }}
      aria-hidden="true" />
  );
};

// ─────────────────────────────────────────────
//  AMBIENT WHISPERS (Idle floating text)
// ─────────────────────────────────────────────
const AmbientWhispers = ({ active }) => {
  const [fragments, setFragments] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) { setFragments([]); return; }
    const spawn = () => {
      const ch = LIBER_333[Math.floor(Math.random() * LIBER_333.length)];
      const words = ch.text.split(/\s+/);
      const start = Math.floor(Math.random() * Math.max(1, words.length - 6));
      const frag = words.slice(start, start + 3 + Math.floor(Math.random() * 5)).join(" ");
      const id = idRef.current++;
      setFragments(prev => [...prev.slice(-6), {
        id, text: frag,
        x: 10 + Math.random() * 80,
        y: 20 + Math.random() * 60,
        delay: Math.random() * 2,
      }]);
    };
    spawn();
    const iv = setInterval(spawn, 4000 + Math.random() * 3000);
    return () => clearInterval(iv);
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {fragments.map(f => (
        <div key={f.id} className="absolute text-xs italic"
          style={{
            fontFamily: "'IM Fell English', serif",
            color: 'rgba(176,184,224,0.5)',
            textShadow: '0 0 12px rgba(120,130,200,0.4)',
            left: `${f.x}%`, top: `${f.y}%`,
            animation: `whisperFade 8s ease-in-out ${f.delay}s both`,
            maxWidth: '200px', textAlign: 'center', lineHeight: 1.4,
          }}>
          {f.text}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
//  SHOCKWAVE EFFECT (Radial pulse on chapter reveal)
// ─────────────────────────────────────────────
const Shockwave = ({ active, color = "#dc2626" }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }}>
      <div style={{
        width: 0, height: 0,
        borderRadius: '50%',
        boxShadow: `0 0 60px 30px ${color}33, 0 0 120px 60px ${color}11`,
        animation: 'shockwaveExpand 1.2s ease-out forwards',
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────
//  EXPANDABLE SECTION
// ─────────────────────────────────────────────
const ExpandableSection = ({ title, icon, children, defaultOpen = false, accentColor = "#dc2626" }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-5">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-left group">
        <span className="flex items-center gap-2.5 text-lg lux-crimson tracking-wide"
          style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif" }}>
          <span className="text-base opacity-90">{icon}</span>
          {title}
        </span>
        <span className="lux-dim text-[10px] transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      <hr className="star-rule mb-3" style={{ opacity: open ? 0.8 : 0.3, transition: 'opacity 0.4s' }} />
      <div className="overflow-hidden transition-all duration-500" style={{ maxHeight: open ? '4000px' : '0', opacity: open ? 1 : 0 }}>
        <div className="pb-2 lux text-[15px] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  MILESTONE / ABYSS EVENT OVERLAY
// ─────────────────────────────────────────────
const MilestoneOverlay = ({ number, onDismiss }) => {
  const messages = {
    33: { title: "THE LOVER", text: "33 readings. The number of the highest degree. You have traced the paths of Lamed — Ox Goad of Equilibrium. The Book recognizes you.", icon: "♎" },
    66: { title: "THE QLIPHOTHIC GATE", text: "66 readings. The mystic sum of the shells. You have walked the nightside. The shadows know your name now.", icon: "☾" },
    93: { title: "ΘΕΛΗΜΑ", text: "93 readings. Thelema. Agape. Will equals Love. You have completed the full circuit of the Book. Do what thou wilt.", icon: "⊙" },
    333: { title: "CHORONZON", text: "333 readings. The Dweller in the Abyss speaks: 'I am I.' But you know better. You are none and two. Cross.", icon: "∅" },
  };
  const m = messages[number] || { title: `READING ${number}`, text: "A threshold is crossed.", icon: "☉" };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={{ zIndex: 70 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }} />
      <div className="relative text-center max-w-md" style={{ animation: 'milestoneAppear 1.5s ease-out' }}>
        <div className="text-6xl mb-6 opacity-60">{m.icon}</div>
        <div className="text-xs tracking-[0.4em] text-amber-600/70 mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          READING #{number}
        </div>
        <div className="text-3xl tracking-wider text-amber-500 mb-4" style={{ fontFamily: 'Cinzel, serif', textShadow: '0 0 40px rgba(245,158,11,0.3)' }}>
          {m.title}
        </div>
        <div className="lux text-sm leading-relaxed mb-8" style={{ fontFamily: "'IM Fell English', serif" }}>
          {m.text}
        </div>
        <button onClick={onDismiss}
          className="text-xs tracking-[0.25em] transition-all hover:tracking-[0.4em]"
          style={{ fontFamily: 'Cinzel, serif', color: '#f0b75e', textShadow: '0 0 16px rgba(240,183,94,0.5)' }}>
          ✦ CONTINUE ✦
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  JOURNAL OVERLAY (Enhanced)
// ─────────────────────────────────────────────
const JournalOverlay = ({ entries, totalReadings, onClose, onDelete, onClear, onSelect, accentColor = "#dc2626" }) => {
  // Count recurrences
  const recurrenceMap = useMemo(() => {
    const map = {};
    entries.forEach(e => { map[e.chapter] = (map[e.chapter] || 0) + 1; });
    return map;
  }, [entries]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(5,3,15,0.88)' }} onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, rgba(20,14,45,0.9), rgba(5,3,15,0.95))', borderRadius: '16px', boxShadow: '0 0 60px rgba(120,80,200,0.15)' }}>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-2xl gilded" style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif", letterSpacing: '0.02em' }}>
              ☥ Grimoire Journal
            </h2>
            <div className="text-[10px] lux-dim mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {totalReadings} total readings · {entries.length} saved
            </div>
          </div>
          <div className="flex items-center gap-4">
            {entries.length > 0 && (
              <button onClick={onClear} className="text-[10px] lux-dim hover:lux-crimson transition-colors"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>CLEAR ALL</button>
            )}
            <button onClick={onClose} className="lux-dim hover:text-white transition-colors text-2xl leading-none">×</button>
          </div>
        </div>
        <hr className="star-rule opacity-50" />

        <div className="flex-1 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <div className="text-center py-16 lux-dim text-sm" style={{ fontFamily: "'IM Fell English', serif" }}>
              <div className="text-4xl mb-4 opacity-30">☉</div>
              No readings recorded yet.
            </div>
          ) : entries.map((entry, idx) => (
            <div key={entry.id}>
              <div className="group py-3 px-1 hover:bg-white/[0.03] rounded transition-all cursor-pointer"
                onClick={() => { onSelect?.(entry); onClose(); }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg lux-crimson" style={{ fontFamily: "'UnifrakturCook', serif" }}>
                        {formatChapterNumber(entry.chapter)}
                      </span>
                      <span className="lux text-sm truncate" style={{ fontFamily: "'Pirata One', serif" }}>
                        {entry.title}
                      </span>
                      {recurrenceMap[entry.chapter] > 1 && (
                        <span className="text-[9px]" style={{ color: '#f0b75e', textShadow: '0 0 8px rgba(240,183,94,0.5)' }}>
                          ×{recurrenceMap[entry.chapter]}
                        </span>
                      )}
                    </div>
                    <div className="lux text-[12px] truncate italic" style={{ fontFamily: "'IM Fell English', serif" }}>{entry.question}</div>
                    <div className="lux-dim text-[10px] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {" · "}{entry.gematria}
                      {entry.spreadType && ` · ${entry.spreadType}`}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                    className="opacity-0 group-hover:opacity-100 lux-dim hover:lux-crimson transition-all text-sm ml-3">✕</button>
                </div>
              </div>
              {idx < entries.length - 1 && <hr className="star-rule opacity-20" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  TREE OF LIFE — interactive map of all 93 chapters
//  Every chapter is seated on its Sephira or Path. Click a node or path
//  to read the chapters that live there; click a chapter to consult it.
// ─────────────────────────────────────────────

const TreeOfLife = ({ onBack, onSelectChapter, accentColor = "#dc2626" }) => {
  const [selected, setSelected] = useState(null); // location key
  const [hover, setHover] = useState(null);

  // group every chapter by its sephira/path string
  const groups = useMemo(() => groupChaptersBySephira(LIBER_333), []);

  // path keys = compound "A-B" sephira strings that resolve to two nodes
  const paths = useMemo(() => deriveTreePaths(groups), [groups]);

  const veilChapters = useMemo(() => getVeilChapters(groups), [groups]);

  const selChapters = selected === "__veils__" ? veilChapters : (selected ? (groups[selected] || []) : []);
  const selInfo = selected && selected !== "__veils__" ? getSephiraInfo(selected) : null;

  return (
    <div className="w-full max-w-5xl mx-auto" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl gilded" style={{ fontFamily: "'Pirata One', 'Cinzel', serif", letterSpacing: '0.06em' }}>
          The Tree of Life
        </h2>
        <button onClick={onBack}
          className="text-neutral-400 hover:text-neutral-400 text-[10px] tracking-wider px-3 py-1.5 rounded hover:bg-white/[0.03] transition-colors"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          ← ORACLE
        </button>
      </div>
      <p className="text-neutral-400 text-[10px] mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        The 96 chapters mapped to the 10 Sephiroth and 22 Paths · tap a sphere or path
      </p>

      <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        {/* ── The diagram ── */}
        <div className="relative rounded-xl border border-white/[0.04] overflow-hidden"
          style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.02), transparent)' }}>
          <svg viewBox="0 0 100 102" className="w-full" style={{ display: 'block' }}>
            {/* veils above Kether */}
            <text x="50" y="2.4" textAnchor="middle" fontSize="2.1"
              fill={accentColor + '55'} style={{ fontFamily: 'Cinzel, serif', cursor: 'pointer', letterSpacing: '0.15em' }}
              onClick={() => setSelected("__veils__")}>
              ∅ AIN · SOPH · AUR ∅
            </text>

            {/* paths */}
            {paths.map(({ key, a, b }) => {
              const p1 = TREE_POS[a], p2 = TREE_POS[b];
              const isSel = selected === key, isHov = hover === key;
              const ch = groups[key]?.[0];
              const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
              return (
                <g key={key} style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(key)}
                  onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={isSel || isHov ? accentColor : '#ffffff'}
                    strokeOpacity={isSel ? 0.9 : isHov ? 0.5 : 0.12}
                    strokeWidth={isSel ? 0.9 : 0.5}
                    style={{ transition: 'stroke-opacity 0.3s, stroke 0.3s' }} />
                  {/* invisible fat hit-area */}
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth="3" />
                  {ch && ch.path && ch.path !== "—" && (
                    <text x={mx} y={my + 0.6} textAnchor="middle" fontSize="2"
                      fill={isSel || isHov ? accentColor : '#ffffff'} fillOpacity={isSel || isHov ? 0.95 : 0.3}
                      style={{ fontFamily: 'JetBrains Mono, monospace', pointerEvents: 'none' }}>
                      {HEBREW_LETTERS[ch.path]?.letter || ''}
                    </text>
                  )}
                </g>
              );
            })}

            {/* nodes */}
            {TREE_NODE_ORDER.map((name) => {
              const pos = TREE_POS[name];
              const info = getSephiraInfo(name);
              const list = groups[name] || [];
              const isDaath = name === "Daath";
              const isSel = selected === name, isHov = hover === name;
              const r = isDaath ? 3.2 : 4.4;
              return (
                <g key={name} style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(name)}
                  onMouseEnter={() => setHover(name)} onMouseLeave={() => setHover(null)}>
                  {(isSel || isHov) && (
                    <circle cx={pos.x} cy={pos.y} r={r + 2.4} fill={accentColor} opacity="0.18" />
                  )}
                  <circle cx={pos.x} cy={pos.y} r={r}
                    fill={isDaath ? '#0a0510' : '#05050a'}
                    stroke={isSel ? accentColor : (info.color || '#888')}
                    strokeWidth={isSel ? 0.8 : 0.5}
                    strokeDasharray={isDaath ? "1 1" : undefined}
                    style={{ filter: `drop-shadow(0 0 ${isSel ? 3 : 1.4}px ${info.color}aa)`, transition: 'stroke 0.3s' }} />
                  <text x={pos.x} y={pos.y + 0.4} textAnchor="middle" fontSize="2.4"
                    fill={info.color} fillOpacity="0.95"
                    style={{ fontFamily: 'Cinzel, serif', pointerEvents: 'none' }}>
                    {info.number || (isDaath ? '' : '')}
                  </text>
                  <text x={pos.x} y={pos.y + r + 2.4} textAnchor="middle" fontSize="1.9"
                    fill={isSel ? accentColor : '#888'} fillOpacity={isSel ? 1 : 0.6}
                    style={{ fontFamily: 'Cinzel, serif', pointerEvents: 'none', letterSpacing: '0.05em' }}>
                    {name.toUpperCase()}
                  </text>
                  {list.length > 0 && !isDaath && (
                    <text x={pos.x + r - 0.2} y={pos.y - r + 0.6} textAnchor="middle" fontSize="1.7"
                      fill={accentColor} fillOpacity="0.9"
                      style={{ fontFamily: 'JetBrains Mono, monospace', pointerEvents: 'none' }}>
                      {list.length}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Detail panel ── */}
        <div className="min-h-[280px]">
          {!selected ? (
            <div className="lux text-[14px] leading-relaxed p-2"
              style={{ fontFamily: "'IM Fell English', serif" }}>
              <div className="mb-3 tracking-wider lux-crimson text-lg" style={{ fontFamily: "'UnifrakturCook', serif" }}>
                ✦ The Map of Emanation
              </div>
              Each sphere is a Sephira — a vessel of divine light. Each line is a Path — a letter of the Hebrew alphabet, a Tarot trump, a doorway between states.
              <br /><br />
              The Book of Lies is woven through the whole Tree: the ten numbered chapters descend the spheres from Crown to Kingdom; chapters 11–32 walk the twenty-two paths; the rest cluster where their gematria binds them.
              <br /><br />
              <span className="lux-crimson">Select a sphere or path to descend.</span>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <div className="flex items-center gap-2 mb-1">
                {selected !== "__veils__" && selInfo && (
                  <span className="w-3 h-3 rounded-full"
                    style={{ background: selInfo.color, boxShadow: `0 0 12px ${selInfo.color}` }} />
                )}
                <h3 className="text-xl gilded" style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif" }}>
                  {selected === "__veils__" ? "The Three Veils" : selected}
                </h3>
              </div>
              {selInfo && (
                <div className="text-[10px] text-neutral-400 mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {selInfo.meaning}
                  {selInfo.planet && selInfo.planet !== "—" && <> · {selInfo.planet}</>}
                  {selInfo.godName && selInfo.godName !== "—" && <> · {selInfo.godName}</>}
                </div>
              )}
              {selected === "__veils__" && (
                <div className="text-[10px] text-neutral-400 mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Ain · Ain Soph · Ain Soph Aur — the Boundless Negative before the first emanation
                </div>
              )}

              {selChapters.length === 0 ? (
                <div className="text-neutral-400 text-[11px] italic">No chapter seated here — a silent vessel.</div>
              ) : (
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {selChapters.map((ch) => (
                    <button key={ch.chapter} onClick={() => onSelectChapter(ch)}
                      className="w-full text-left flex items-start gap-3 px-1 py-2 hover:bg-white/[0.03] rounded transition-all group">
                      <span className="text-lg shrink-0 w-8 text-center lux-crimson" style={{ fontFamily: "'UnifrakturCook', serif" }}>
                        {formatChapterNumber(ch.chapter)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] lux tracking-wide truncate" style={{ fontFamily: "'Pirata One', serif" }}>
                          {ch.title}
                        </span>
                        <span className="block text-[9px] lux-dim mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {ch.element}{ch.tarot && ch.tarot !== "—" ? ` · ${ch.tarot}` : ''}
                        </span>
                      </span>
                      <span className="lux-dim group-hover:lux-crimson text-[12px] self-center transition-colors">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  GUIDED RITUAL MODE — perform the three rites step by step
// ─────────────────────────────────────────────
const RitualMode = ({ onBack, accentColor = "#dc2626", playBell, audioEnabled, initialChapter = null }) => {
  const [activeChapter, setActiveChapter] = useState(initialChapter && RITUALS[initialChapter] ? initialChapter : null);
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);

  const rite = activeChapter ? RITUALS[activeChapter] : null;
  const step = rite && started ? rite.steps[stepIndex] : null;
  const isFinal = step?.final;

  // Sound the bell as each station with a bell is entered.
  useEffect(() => {
    if (step?.bell && audioEnabled && playBell) playBell();
  }, [stepIndex, started, activeChapter]); // eslint-disable-line

  const openRite = (chap) => { setActiveChapter(chap); setStepIndex(0); setStarted(false); };
  const closeRite = () => { setActiveChapter(null); setStepIndex(0); setStarted(false); };

  // ── List of rites ──
  if (!rite) {
    return (
      <div className="w-full max-w-2xl mx-auto" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl gilded" style={{ fontFamily: "'Pirata One', 'Cinzel', serif", letterSpacing: '0.06em' }}>
            The Rites
          </h2>
          <button onClick={onBack}
            className="text-neutral-400 hover:text-neutral-400 text-[10px] tracking-wider px-3 py-1.5 rounded hover:bg-white/[0.03] transition-colors"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}>← ORACLE</button>
        </div>
        <p className="text-neutral-400 text-[10px] mb-6" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          The three performable ceremonies of Liber 333 · guided station by station
        </p>
        <div className="space-y-2">
          {Object.values(RITUALS).map((r) => (
            <div key={r.chapter}>
              <button onClick={() => openRite(r.chapter)}
                className="w-full text-left hover:bg-white/[0.03] rounded-lg transition-all p-3 group">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl lux-crimson" style={{ fontFamily: "'UnifrakturCook', serif" }}>
                    {formatChapterNumber(r.chapter)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl gilded" style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif" }}>{r.title}</div>
                    <div className="text-[11px] lux-dim italic" style={{ fontFamily: "'IM Fell English', serif" }}>{r.subtitle}</div>
                  </div>
                  <span className="lux-dim group-hover:lux-crimson transition-colors text-base">→</span>
                </div>
                <div className="text-[10px] lux-dim flex items-center gap-3 pl-12" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <span>{ELEMENT_SYMBOLS[r.element] || ''} {r.element}</span>
                  <span>· {r.steps.length} stations</span>
                  <span>· {r.duration}</span>
                </div>
              </button>
              <hr className="star-rule opacity-30 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Intro screen for a chosen rite ──
  if (!started) {
    return (
      <div className="w-full max-w-xl mx-auto text-center" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <button onClick={closeRite}
          className="text-neutral-400 hover:text-neutral-400 text-[10px] tracking-wider mb-6 inline-block"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>← ALL RITES</button>
        <div className="mb-4">
          <AnimatedSigil input={rite.title} size={120} spinning={true} glowing={true} accentColor={accentColor} />
        </div>
        <div className="text-6xl mb-2 gilded" style={{ fontFamily: "'UnifrakturCook', serif", filter: `drop-shadow(0 0 30px ${accentColor}66)` }}>
          {formatChapterNumber(rite.chapter)}
        </div>
        <h2 className="text-3xl mb-1 gilded" style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif", letterSpacing: '0.02em' }}>{rite.title}</h2>
        <div className="text-[11px] tracking-[0.25em] lux-dim mb-6" style={{ fontFamily: 'Cinzel, serif' }}>{rite.subtitle.toUpperCase()}</div>
        <p className="lux text-[15px] leading-relaxed mb-8 text-left max-w-md mx-auto" style={{ fontFamily: "'IM Fell English', serif" }}>
          {rite.intro}
        </p>
        {!audioEnabled && (
          <p className="text-[11px] mb-5" style={{ color: '#f0b75e', textShadow: '0 0 10px rgba(240,183,94,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
            ☉ Enable sound (♪ in the top bar) to hear the bell at each station.
          </p>
        )}
        <button onClick={() => { setStarted(true); setStepIndex(0); }}
          className="text-base tracking-[0.3em] lux-crimson transition-all duration-700 hover:tracking-[0.45em]"
          style={{ fontFamily: 'Cinzel, serif' }}>
          ✦ BEGIN THE RITE ✦
        </button>
      </div>
    );
  }

  // ── The guided stepper ──
  const progress = ((stepIndex + 1) / rite.steps.length) * 100;
  return (
    <div className="w-full max-w-xl mx-auto" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={closeRite}
          className="lux-dim hover:lux-crimson text-[10px] tracking-wider transition-colors"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>✕ END RITE</button>
        <div className="text-[11px] tracking-[0.2em] lux-crimson" style={{ fontFamily: 'Cinzel, serif' }}>
          {rite.title}
        </div>
        <div className="text-[10px] lux-dim" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {stepIndex + 1} / {rite.steps.length}
        </div>
      </div>

      {/* progress */}
      <div className="h-px w-full mb-9" style={{ background: 'rgba(150,160,230,0.15)' }}>
        <div className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, rgba(150,160,230,0.4), #ff5e74)', boxShadow: '0 0 8px rgba(255,94,116,0.6)' }} />
      </div>

      {/* station — floating, no box */}
      <div key={stepIndex} className="text-center" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div className="text-[11px] tracking-[0.35em] lux-crimson mb-5" style={{ fontFamily: 'Cinzel, serif' }}>
          {step.station.toUpperCase()}
          {step.bell && <span className="ml-2">🔔</span>}
        </div>

        <p className="lux text-[15px] leading-relaxed mb-8 max-w-md mx-auto" style={{ fontFamily: "'IM Fell English', serif" }}>
          {step.direction}
        </p>

        {step.words && (
          <div className="mb-6">
            <div className={`${isFinal ? 'text-2xl' : 'text-xl md:text-2xl'} leading-relaxed mb-3 gilded`}
              style={{ fontFamily: "'Cinzel', serif" }}>
              {step.words}
            </div>
            {step.translit && (
              <div className="text-[13px] lux italic mb-1" style={{ fontFamily: "'IM Fell English', serif" }}>
                {step.translit}
              </div>
            )}
            {step.meaning && (
              <div className="text-[11px] lux-dim" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {step.meaning}
              </div>
            )}
          </div>
        )}
      </div>

      {/* controls — floating text */}
      <div className="flex items-center justify-center gap-8 mt-10">
        <button onClick={() => setStepIndex(i => Math.max(0, i - 1))} disabled={stepIndex === 0}
          className={`text-[11px] tracking-[0.18em] transition-all ${stepIndex === 0 ? 'opacity-25 cursor-default lux-dim' : 'lux-dim hover:text-[#d8dcf2]'}`}
          style={{ fontFamily: 'Cinzel, serif' }}>← BACK</button>

        {!isFinal ? (
          <button onClick={() => setStepIndex(i => Math.min(rite.steps.length - 1, i + 1))}
            className="text-[12px] tracking-[0.2em] lux-crimson transition-all hover:tracking-[0.32em]"
            style={{ fontFamily: 'Cinzel, serif' }}>
            NEXT STATION →
          </button>
        ) : (
          <button onClick={closeRite}
            className="text-[12px] tracking-[0.2em] lux-crimson transition-all hover:tracking-[0.32em]"
            style={{ fontFamily: 'Cinzel, serif' }}>
            ✦ THE RITE IS COMPLETE
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  GEMATRIA CALCULATOR MODE
// ─────────────────────────────────────────────
const GematriaMode = ({ onBack, accentColor = "#dc2626" }) => {
  const [input, setInput] = useState("");
  const result = useMemo(() => input.trim() ? calculateGematria(input) : null, [input]);
  const corr = useMemo(() => result ? findCorrespondences(result.simple) : [], [result]);

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <button onClick={onBack}
        className="text-neutral-400 hover:text-neutral-400 text-xs tracking-widest mb-8 transition-colors flex items-center gap-2"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <span>←</span> RETURN TO ORACLE
      </button>

      <h2 className="text-3xl text-center mb-2 gilded" style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif", letterSpacing: '0.02em' }}>
        Gematria Calculator
      </h2>
      <p className="text-center lux-dim text-[11px] mb-8" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        English Qabalah · A=1 B=2 ... Z=26
      </p>

      <div className="relative">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          placeholder="Enter a word or phrase..."
          className="w-full bg-transparent px-2 py-3 text-center text-lg lux placeholder:text-[#5b608a] focus:outline-none transition-all"
          style={{
            fontFamily: "'IM Fell English', serif", border: 'none', borderBottom: '1px solid transparent',
            borderImage: input ? 'linear-gradient(90deg, transparent, #ff5e74, transparent) 1' : 'linear-gradient(90deg, transparent, rgba(150,160,230,0.4), transparent) 1',
          }}
        />
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <div className="text-7xl mb-1 gilded" style={{ fontFamily: "'UnifrakturCook', serif", filter: `drop-shadow(0 0 30px ${accentColor}55)` }}>
              {result.simple}
            </div>
            <div className="lux-dim text-[11px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {result.reductionSteps.join(" → ")} · {result.raw} letter{result.raw !== 1 ? 's' : ''}
            </div>
          </div>

          {corr.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] lux-crimson tracking-[0.3em] mb-2" style={{ fontFamily: 'Cinzel, serif' }}>CORRESPONDENCES</div>
              {corr.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-[13px]" style={{ fontFamily: "'IM Fell English', serif" }}>
                  <span className="text-[9px] uppercase tracking-wider mt-1"
                    style={{ color: c.type === 'direct' ? '#ff8fa0' : c.type === 'square' ? '#f0b75e' : '#9aa0c4' }}>{c.type}</span>
                  <span className="lux">{c.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4">
            <hr className="star-rule mb-3 opacity-40" />
            <div className="text-[10px] lux-crimson tracking-[0.3em] mb-3" style={{ fontFamily: 'Cinzel, serif' }}>HEBREW LETTERS</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] lux-dim" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {Object.entries(HEBREW_LETTERS).map(([name, data]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="w-4 text-center lux-crimson">{data.letter}</span>
                  <span className="lux w-8 text-right">{data.value}</span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  GEMATRIA ECHO RENDERER (highlighted text)
// ─────────────────────────────────────────────
const EchoText = ({ text, echoes = [], accentColor = "#dc2626" }) => {
  if (!echoes.length) return <span>{text}</span>;
  
  const words = text.split(/(\s+)/);
  const echoWords = new Set(echoes.map(e => e.word.toLowerCase()));
  const echoMap = {};
  echoes.forEach(e => { echoMap[e.word.toLowerCase()] = e; });

  return (
    <span>
      {words.map((w, i) => {
        const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (echoWords.has(clean)) {
          const echo = echoMap[clean];
          return (
            <span key={i} className="relative group cursor-help">
              <span style={{ borderBottom: `1px dotted ${accentColor}60`, color: '#e5e5e5' }}>{w}</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: '#1a1a1a', border: `1px solid ${accentColor}30`, color: accentColor, fontFamily: 'JetBrains Mono, monospace' }}>
                {echo.value} · {echo.meaning}
              </span>
            </span>
          );
        }
        return <span key={i}>{w}</span>;
      })}
    </span>
  );
};


// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
const App = () => {
  const {
    surfaceMode,
    journalOpen,
    navigationRequest,
    navigate,
    openJournal,
    closeJournal,
  } = useGrimoireNavigation();

  // ── Phase: init | input | ritual | revelation ──
  const [phase, setPhase] = useState("init");
  const [ritualChapter, setRitualChapter] = useState(null); // deep-link into a rite
  const [spreadType, setSpreadType] = useState("single"); // single | spread
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [idleTime, setIdleTime] = useState(0);

  // ── Oracle state ──
  const [question, setQuestion] = useState("");
  const [drawnChapters, setDrawnChapters] = useState([]); // Array for spread support
  const [gematriaResult, setGematriaResult] = useState(null);
  const [correspondences, setCorrespondences] = useState([]);
  const [ritualProgress, setRitualProgress] = useState(0);
  const [ritualAct, setRitualAct] = useState(0); // 0=invoking, 1=communing, 2=receiving, 3=silence, 4=done
  const [showShockwave, setShowShockwave] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revealIndex, setRevealIndex] = useState(0); // For spread: which chapter is shown
  const [textEchoes, setTextEchoes] = useState([]);

  // ── Hooks ──
  const planetary = usePlanetaryTime();
  const lunar = useLunarPhase();
  const audioIntensity = phase === "ritual" ? 1.0 : phase === "revelation" ? 0.6 : 0.3;
  const { playBell, playImpact } = useAudioEngine(audioEnabled, audioIntensity);
  const oracle = useAIOracle(PLANETS);
  const journal = useJournal();
  const voice = useVoice();

  // ── Derived values ──
  const accentColor = planetary?.color || "#dc2626";
  const accentLight = planetary?.colorLight || "#f87171";
  const drawnChapter = drawnChapters[revealIndex] || drawnChapters[0] || null;
  const isSpread = spreadType === "spread" && drawnChapters.length === 3;
  const evolutionRings = Math.min(Math.floor(journal.totalReadings / 5), 4);

  useEffect(() => {
    if (!navigationRequest) return;

    if (navigationRequest.type === 'oracle-input') {
      setQuestion(navigationRequest.question || '');
      setPhase("input");
      return;
    }

    if (navigationRequest.type === 'rite') {
      setRitualChapter(navigationRequest.chapter || null);
    }
  }, [navigationRequest]);


  // ── Idle detection for ambient mode ──
  useEffect(() => {
    if (phase !== "init") { setIdleTime(0); return; }
    const iv = setInterval(() => setIdleTime(t => t + 1), 1000);
    const reset = () => setIdleTime(0);
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    window.addEventListener('touchstart', reset);
    return () => {
      clearInterval(iv);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('touchstart', reset);
    };
  }, [phase]);

  const isAmbient = phase === "init" && idleTime > 20;

  // ── Perform divination ──
  const performDivination = useCallback(() => {
    if (!question.trim()) return;
    haptic([30, 50, 30]);

    const gem = calculateGematria(question);
    const corr = findCorrespondences(gem.simple);
    setGematriaResult(gem);
    setCorrespondences(corr);

    // Select chapters
    const chapters = selectReadingChapters({
      chapters: LIBER_333,
      gematria: gem,
      question,
      spreadType,
    });

    setDrawnChapters(chapters);
    setRevealIndex(0);
    setPhase("ritual");
    setRitualProgress(0);
    setRitualAct(0);
    setGlitchActive(false);
    setShowShockwave(false);
    setSaved(false);
    setTextEchoes([]);
    oracle.resetOracle();

    if (audioEnabled) playBell();

    // Enhanced 3-act ritual: 7 seconds total
    // Act 1: Invoking (0-2.5s) — dim, sparse, tension
    // Act 2: Communing (2.5-4.5s) — expansion, surge
    // Act 3: Receiving (4.5-6s) — contraction
    // Act 4: Silence (6-6.5s) — brief darkness
    // Act 5: Reveal (6.5s) — SLAM
    const duration = 7000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setRitualProgress(pct);

      if (elapsed < 2500) setRitualAct(0);
      else if (elapsed < 4500) {
        if (ritualAct !== 1 && audioEnabled) playBell(396);
        setRitualAct(1);
      }
      else if (elapsed < 6000) setRitualAct(2);
      else if (elapsed < 6500) setRitualAct(3);
      else {
        setRitualAct(4);
        setPhase("revelation");
        setGlitchActive(true);
        setShowShockwave(true);
        haptic([50, 30, 80]);
        if (audioEnabled) { playImpact(); setTimeout(() => playBell(), 300); }
        setTimeout(() => setShowShockwave(false), 1200);

        // Compute text echoes
        const ch = chapters[0];
        setTextEchoes(findGematriaEchoes(ch.text));

        // Consult oracle with full context — synthesis for a triad, single otherwise
        const ctx = {
          recentReadings: journal.getRecentReadings(5),
          recurrenceCount: journal.getRecurrenceCount(chapters[0].chapter),
          planetary,
          lunar,
          totalReadings: journal.totalReadings + 1,
        };
        if (spreadType === "spread" && chapters.length === 3) {
          oracle.consultSpread(question, chapters, gem, corr, ctx);
        } else {
          oracle.consultOracle(question, chapters[0], gem, corr, ctx);
        }
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [question, spreadType, audioEnabled, playBell, playImpact, oracle, journal, planetary, lunar]);

  // ── Save reading ──
  const saveReading = useCallback(async () => {
    if (!drawnChapter || saved) return;
    for (const ch of drawnChapters) {
      await journal.addEntry({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: new Date().toISOString(),
        question,
        chapter: ch.chapter,
        title: ch.title,
        gematria: gematriaResult?.simple || 0,
        interpretation: oracle.text || null,
        spreadType: isSpread ? "Thesis/Antithesis/Synthesis" : "single",
        planetary: planetary?.planet,
        lunar: lunar?.name,
      });
    }
    setSaved(true);
    haptic(30);
  }, [drawnChapter, drawnChapters, question, gematriaResult, oracle.text, saved, journal, isSpread, planetary, lunar]);

  // ── Reset ──
  const resetToInput = useCallback(() => {
    setPhase("input");
    setQuestion("");
    setDrawnChapters([]);
    setGematriaResult(null);
    setCorrespondences([]);
    setGlitchActive(false);
    setShowShockwave(false);
    setSaved(false);
    setTextEchoes([]);
    setRevealIndex(0);
    oracle.resetOracle();
    voice.stop();
  }, [oracle, voice]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && question.trim()) performDivination();
  };

  // ── View journal entry ──
  const viewJournalEntry = useCallback((entry) => {
    const ch = LIBER_333.find(c => c.chapter === entry.chapter);
    if (!ch) return;
    setQuestion(entry.question);
    setDrawnChapters([ch]);
    setGematriaResult(calculateGematria(entry.question));
    setCorrespondences(findCorrespondences(entry.gematria));
    setTextEchoes(findGematriaEchoes(ch.text));
    setPhase("revelation");
    setGlitchActive(false);
    setSpreadType("single");
  }, []);

  // ── View a chapter chosen from the Tree of Life (study, no divination) ──
  const viewChapterFromTree = useCallback((ch) => {
    const gem = calculateGematria(ch.title);
    navigate("oracle");
    setQuestion(`Contemplating Chapter ${formatChapterNumber(ch.chapter)} — ${ch.title}`);
    setDrawnChapters([ch]);
    setRevealIndex(0);
    setGematriaResult(gem);
    setCorrespondences(findCorrespondences(gem.simple));
    setTextEchoes(findGematriaEchoes(ch.text));
    setPhase("revelation");
    setGlitchActive(false);
    setSpreadType("single");
    setSaved(false);
    oracle.resetOracle();
  }, [oracle, navigate]);

  // ── Unified (re)consultation for retry / manual-invoke buttons ──
  const consultNow = useCallback(() => {
    if (!drawnChapter) return;
    const ctx = {
      recentReadings: journal.getRecentReadings(5),
      recurrenceCount: journal.getRecurrenceCount(drawnChapter.chapter),
      planetary, lunar, totalReadings: journal.totalReadings,
    };
    if (isSpread) {
      oracle.consultSpread(question, drawnChapters, gematriaResult, correspondences, ctx);
    } else {
      oracle.consultOracle(question, drawnChapter, gematriaResult, correspondences, ctx);
    }
  }, [drawnChapter, drawnChapters, isSpread, question, gematriaResult, correspondences, oracle, journal, planetary, lunar]);

  // ── Render helpers ──
  const particleActive = phase === "ritual" || phase === "revelation" || isAmbient;
  const particleIntensity = phase === "ritual" ? (ritualAct === 1 ? 2.5 : ritualAct >= 3 ? 0.1 : 1.2) :
                            phase === "revelation" ? 0.4 : isAmbient ? 0.15 : 0;

  // Abyss shader swell: deepest during the Communing act, gentle elsewhere.
  // Kept low so the cosmos never washes out the floating text.
  const abyssIntensity = phase === "ritual" ? (ritualAct === 1 ? 0.85 : ritualAct >= 3 ? 0.15 : 0.5) :
                         phase === "revelation" ? 0.3 : isAmbient ? 0.28 : 0.2;

  const ritualLabels = ["INVOKING", "COMMUNING", "RECEIVING", "　", "COMPLETE"];

  // ── Spread labels ──
  const spreadLabels = ["THESIS", "ANTITHESIS", "SYNTHESIS"];

  return (
    <div className="min-h-screen relative overflow-x-hidden"
      style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--lux)', background: 'transparent' }}>

      {/* Background Layers */}
      <AbyssShader accentColor={accentColor} intensity={abyssIntensity} active={true} />
      <NoiseBackground />
      <ParticleCanvas active={particleActive} intensity={particleIntensity} accentColor={accentColor} />
      {isAmbient && <AmbientWhispers active={true} />}
      <Marginalia />
      <BabalonStar accentColor="#ff2e4d" />
      <Shockwave active={showShockwave} color={accentColor} />
      <CRTOverlay />

      {/* ═══ TOP NAVIGATION ═══ */}
      <nav className="fixed top-0 left-0 right-0"
        style={{ zIndex: 40, background: 'linear-gradient(180deg, rgba(7,5,18,0.92), rgba(5,3,15,0.78) 70%, transparent)', backdropFilter: 'blur(10px)', paddingTop: 'calc(var(--safe-top) + 8px)' }}>
        {/* Row 1 — brand + ambient state + sound toggles */}
        <div className="flex items-center justify-between gap-2 px-3 pb-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg sm:text-xl leading-none gilded truncate" style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif", letterSpacing: '0.02em' }}>
              Liber CCCXXXIII
            </span>
            {planetary && (
              <span className="text-[10px] lux-dim hidden sm:inline-flex items-center gap-1.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ color: '#ff5e74' }}>{planetary.symbol}</span>
                {planetary.planet} Hour
                {lunar && <span title={lunar.name}>· {lunar.emoji}</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {voice.available && (
              <button onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) voice.stop(); }}
                title="Sage's voice — narration"
                className="text-[15px] transition-all duration-300"
                style={{
                  color: voiceEnabled ? '#ff5e74' : '#7e84ad',
                  textShadow: voiceEnabled ? '0 0 14px rgba(255,46,77,0.8)' : 'none',
                }}>◉</button>
            )}
            <button onClick={() => setAudioEnabled(!audioEnabled)}
              title="Ambient sound & bells"
              className="text-[16px] transition-all duration-300"
              style={{
                color: audioEnabled ? '#ff5e74' : '#7e84ad',
                textShadow: audioEnabled ? '0 0 14px rgba(255,46,77,0.8)' : 'none',
              }}>{audioEnabled ? "♫" : "♪"}</button>
          </div>
        </div>
        {/* Row 2 — floating mode glyphs (horizontally scrollable, never clipped) */}
        <div className="nav-rail flex items-center gap-5 px-4 pb-2 overflow-x-auto">
          {[["oracle", "ORACLE"], ["ritual", "RITES"], ["tree", "TREE"], ["gematria", "GEMATRIA"]].map(([m, label]) => {
            const on = surfaceMode === m;
            return (
              <button key={m} onClick={() => { navigate(m); if (m === "ritual") setRitualChapter(null); }}
                className={`relative text-[12px] tracking-[0.22em] whitespace-nowrap transition-all duration-300 ${on ? 'lux-crimson' : 'lux-dim hover:text-[#cfd3ee]'}`}
                style={{ fontFamily: 'Cinzel, serif' }}>
                {on && <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-[9px]" style={{ color: '#ff5e74' }}>✦</span>}
                {label}
              </button>
            );
          })}
          <button onClick={() => openJournal()}
            className="relative text-[12px] tracking-[0.22em] whitespace-nowrap lux-dim hover:text-[#cfd3ee] transition-all duration-300"
            style={{ fontFamily: 'Cinzel, serif' }}>
            GRIMOIRE
            {journal.entries.length > 0 && (
              <span className="absolute -top-2 -right-3 text-[9px] font-bold lux-crimson">
                {journal.entries.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Journal Overlay */}
      {journalOpen && (
        <JournalOverlay entries={journal.entries} totalReadings={journal.totalReadings}
          onClose={closeJournal} onDelete={journal.removeEntry}
          onClear={journal.clearAll} onSelect={viewJournalEntry} accentColor={accentColor} />
      )}

      {/* Milestone Overlay */}
      {journal.milestone && (
        <MilestoneOverlay number={journal.milestone} onDismiss={journal.dismissMilestone} />
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4" style={{ zIndex: 2, paddingTop: 'calc(var(--safe-top) + 104px)', paddingBottom: 'calc(var(--safe-bottom) + 32px)' }}>

        {/* ── GEMATRIA MODE ── */}
        {surfaceMode === "gematria" && (
          <GematriaMode onBack={() => navigate("oracle")} accentColor={accentColor} />
        )}

        {/* ── GUIDED RITUAL MODE ── */}
        {surfaceMode === "ritual" && (
          <RitualMode onBack={() => navigate("oracle")} accentColor={accentColor}
            playBell={playBell} audioEnabled={audioEnabled} initialChapter={ritualChapter} />
        )}

        {/* ── TREE OF LIFE MODE ── */}
        {surfaceMode === "tree" && (
          <TreeOfLife onBack={() => navigate("oracle")} onSelectChapter={viewChapterFromTree} accentColor={accentColor} />
        )}

        {/* ── ORACLE MODE ── */}
        {surfaceMode === "oracle" && (
          <>
            {/* ═══ INIT PHASE ═══ */}
            {phase === "init" && (
              <div className="text-center max-w-lg mx-auto" style={{ animation: 'fadeIn 2s ease-out' }}>
                <LandingCenterpiece />
                {evolutionRings > 0 && (
                  <div className="text-[9px] text-amber-700/60 tracking-widest mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    YOUR SIGIL · {journal.totalReadings} READING{journal.totalReadings !== 1 ? 'S' : ''} · {evolutionRings} RING{evolutionRings !== 1 ? 'S' : ''} EVOLVED
                  </div>
                )}
                <h1 className="text-5xl md:text-6xl mb-3 gilded leading-tight"
                  style={{ fontFamily: "'UnifrakturCook', 'Cinzel Decorative', serif", filter: `drop-shadow(0 0 40px ${accentColor}55)` }}>
                  The Book of Lies
                </h1>
                <hr className="star-rule w-48 mx-auto mb-3" />
                <p className="lux-dim text-[11px] tracking-[0.35em] mb-1" style={{ fontFamily: "'Pirata One', serif" }}>
                  LIBER CCCXXXIII
                </p>
                <p className="lux-dim text-[12px] mb-12 italic" style={{ fontFamily: "'IM Fell English', serif" }}>
                  93 chapters · gematric divination · the Oracle of the Abyss
                </p>
                <button onClick={() => setPhase("input")}
                  className="text-base tracking-[0.3em] lux-crimson transition-all duration-700 hover:tracking-[0.45em]"
                  style={{ fontFamily: 'Cinzel, serif' }}>
                  ✦ BEGIN CONSULTATION ✦
                </button>

                {/* Cosmic info */}
                {planetary && (
                  <div className="mt-12 text-[11px] lux-dim space-y-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <div>
                      <span style={{ color: '#ff5e74' }}>{planetary.symbol}</span> {planetary.planet} hour
                      {lunar && <> · {lunar.emoji} {lunar.name}</>}
                    </div>
                    <div className="opacity-70">{planetary.timeOfDay}</div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ INPUT PHASE ═══ */}
            {phase === "input" && (
              <div className="w-full max-w-lg mx-auto text-center" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                <div className="mb-6 opacity-40">
                  <AnimatedSigil input="query" size={80} spinning={true} glowing={false} accentColor={accentColor} />
                </div>
                <h2 className="text-3xl mb-2 gilded" style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif", letterSpacing: '0.02em' }}>
                  Speak Your Question
                </h2>
                <p className="lux-dim text-[13px] mb-8 italic" style={{ fontFamily: "'IM Fell English', serif" }}>
                  The gematria of your words shall draw the chapter from the Abyss.
                </p>

                <input type="text" value={question} onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown} autoFocus
                  placeholder="What do you seek to know?"
                  className="w-full bg-transparent px-2 py-3 text-center text-lg lux
                    placeholder:text-[#5b608a] focus:outline-none transition-all duration-500"
                  style={{
                    fontFamily: "'IM Fell English', serif",
                    border: 'none',
                    borderBottom: '1px solid transparent',
                    borderImage: question
                      ? 'linear-gradient(90deg, transparent, #ff5e74, transparent) 1'
                      : 'linear-gradient(90deg, transparent, rgba(150,160,230,0.4), transparent) 1',
                  }}
                />

                {/* Spread selector — floating text */}
                <div className="flex items-center justify-center gap-6 mt-7">
                  <button onClick={() => setSpreadType("single")}
                    className={`text-[11px] tracking-widest transition-all ${spreadType === "single" ? 'lux-crimson' : 'lux-dim opacity-70 hover:opacity-100'}`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    {spreadType === "single" ? "✦ " : ""}SINGLE
                  </button>
                  <button onClick={() => setSpreadType("spread")}
                    className={`text-[11px] tracking-widest transition-all ${spreadType === "spread" ? 'lux-crimson' : 'lux-dim opacity-70 hover:opacity-100'}`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    {spreadType === "spread" ? "✦ " : ""}TRIAD SPREAD
                  </button>
                </div>

                <button onClick={performDivination} disabled={!question.trim()}
                  className={`mt-9 text-base tracking-[0.3em] transition-all duration-500 ${
                    question.trim() ? 'cursor-pointer lux-crimson hover:tracking-[0.45em]' : 'cursor-not-allowed lux-dim opacity-40'
                  }`}
                  style={{ fontFamily: 'Cinzel, serif' }}>
                  ✦ DIVINE ✦
                </button>
              </div>
            )}

            {/* ═══ RITUAL PHASE ═══ */}
            {phase === "ritual" && drawnChapters.length > 0 && (
              <div className="text-center max-w-md mx-auto" style={{
                animation: ritualAct === 3 ? 'none' : undefined,
                opacity: ritualAct === 3 ? 0.05 : 1,
                transition: 'opacity 0.4s ease-in-out',
              }}>
                <div className="mb-6" style={{
                  transform: ritualAct === 1 ? 'scale(1.15)' : ritualAct >= 2 ? 'scale(0.7)' : 'scale(1)',
                  transition: 'transform 1.5s ease-in-out',
                }}>
                  <AnimatedSigil input={question} size={ritualAct === 1 ? 260 : 200} spinning={true} glowing={true}
                    accentColor={accentColor} />
                </div>

                {ritualAct <= 1 && (
                  <div className="lux-dim text-[11px] tracking-widest mb-2" style={{ animation: 'ritualPulse 2s ease-in-out infinite' }}>
                    GEMATRIA: {gematriaResult?.simple}
                  </div>
                )}

                {ritualAct === 1 && (
                  <div className="text-lg mt-4 tracking-wider" style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: accentColor + '60',
                    animation: 'ritualPulse 1s ease-in-out infinite',
                  }}>
                    <GlitchText text={question} active={true} speed={50} />
                  </div>
                )}

                {/* Progress bar */}
                <div className="w-full max-w-xs mx-auto mt-8">
                  <div className="h-px w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${ritualProgress}%`,
                        background: `linear-gradient(90deg, ${accentColor}40, ${accentColor}, ${accentLight})`,
                      }} />
                  </div>
                  <div className="text-center mt-2 text-[10px] tracking-[0.3em]"
                    style={{ fontFamily: 'JetBrains Mono, monospace', color: accentColor + '80' }}>
                    {ritualLabels[ritualAct] || ""}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ REVELATION PHASE ═══ */}
            {phase === "revelation" && drawnChapter && (
              <div className="w-full max-w-2xl mx-auto">

                {/* Spread navigation */}
                {isSpread && (
                  <div className="flex items-center justify-center gap-2 mb-6" style={{ animation: 'fadeIn 1s ease-out' }}>
                    {drawnChapters.map((ch, i) => (
                      <button key={i} onClick={() => { setRevealIndex(i); setTextEchoes(findGematriaEchoes(ch.text)); }}
                        className={`px-4 py-2 text-[10px] tracking-wider transition-all ${
                          i === revealIndex ? 'lux-crimson' : 'lux-dim opacity-70 hover:opacity-100'
                        }`}
                        style={{ fontFamily: 'Cinzel, serif' }}>
                        <div className="text-[9px] mb-0.5 opacity-80">{spreadLabels[i]}</div>
                        <div className="text-base">{formatChapterNumber(ch.chapter)}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Chapter Header */}
                <div className="text-center mb-8" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
                  <div className="mb-4 relative inline-flex items-center justify-center">
                    <ZodiacRing size={210} accentColor="#ff2e4d" />
                    <AnimatedSigil input={question || drawnChapter.title} size={120} spinning={true} glowing={true}
                      evolutionRings={evolutionRings} accentColor={accentColor} />
                  </div>

                  {isSpread && (
                    <div className="text-[10px] tracking-[0.35em] lux-crimson mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                      {spreadLabels[revealIndex]}
                    </div>
                  )}

                  <div className="text-[10px] tracking-[0.3em] lux-dim mb-2"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    CHAPTER
                  </div>

                  <div className={`text-7xl md:text-8xl font-bold mb-2 ${glitchActive ? '' : 'gilded'}`}
                    style={{
                      fontFamily: "'UnifrakturCook', 'Cinzel Decorative', serif",
                      color: glitchActive ? accentColor : undefined,
                      filter: `drop-shadow(0 0 40px ${accentColor}55)`,
                      animation: glitchActive ? 'numberSlam 0.6s ease-out' : 'none',
                    }}>
                    {glitchActive
                      ? <GlitchText text={formatChapterNumber(drawnChapter.chapter)} active={true} speed={35} />
                      : formatChapterNumber(drawnChapter.chapter)
                    }
                  </div>

                  <hr className="star-rule w-40 mx-auto mb-3" />

                  <div className="text-2xl lux tracking-wide mb-1" style={{ fontFamily: "'UnifrakturCook', 'Pirata One', serif", letterSpacing: '0.03em' }}>
                    {glitchActive
                      ? <GlitchText text={drawnChapter.title} active={true} speed={20} />
                      : drawnChapter.title
                    }
                  </div>

                  {/* Recurrence — floating, no box */}
                  {journal.getRecurrenceCount(drawnChapter.chapter) > 0 && (
                    <div className="mt-2 text-[10px] tracking-wide" style={{ color: '#f0b75e', textShadow: '0 0 12px rgba(240,183,94,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
                      ↻ Drawn {journal.getRecurrenceCount(drawnChapter.chapter) + 1}× — the Book insists
                    </div>
                  )}

                  {gematriaResult && (
                    <div className="text-[12px] lux-dim mt-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {gematriaResult.simple} → {gematriaResult.reductionSteps.join(" → ")}
                      {drawnChapter.element && ELEMENT_SYMBOLS[drawnChapter.element] &&
                        ` ${ELEMENT_SYMBOLS[drawnChapter.element]}`}
                      {planetary && <> · <span style={{ color: '#ff5e74' }}>{planetary.symbol}</span> {planetary.planet}</>}
                      {lunar && <> · {lunar.emoji}</>}
                    </div>
                  )}
                </div>

                {/* Key Text — floating illuminated verse, no box */}
                <div className="mb-10 relative text-center px-2" style={{ animation: 'fadeInUp 1s ease-out 0.3s both' }}>
                  <div aria-hidden="true" className="lux-crimson text-sm mb-3" style={{ fontFamily: "'UnifrakturCook', serif" }}>✦ ❧ ✦</div>
                  <div className="relative lux leading-loose text-left
                      first-letter:text-6xl first-letter:float-left first-letter:pr-2 first-letter:mt-1 first-letter:leading-[0.7]
                      first-letter:text-[#ff5e74] first-letter:[font-family:'UnifrakturCook',serif]
                      first-letter:[text-shadow:0_0_22px_rgba(255,94,116,0.8)]"
                    style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '17px' }}>
                    <TypewriterText text={drawnChapter.text} speed={12}
                      onComplete={() => { if (voiceEnabled) voice.speak(drawnChapter.text); }}
                      className="italic" />
                  </div>
                  {textEchoes.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2.5 justify-center">
                      {textEchoes.map((e, i) => (
                        <span key={i} className="text-[10px]"
                          style={{ color: '#ff8fa0', textShadow: '0 0 10px rgba(255,46,77,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {e.word}={e.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <div aria-hidden="true" className="lux-crimson text-sm mt-4" style={{ fontFamily: "'UnifrakturCook', serif" }}>✦ ❧ ✦</div>
                </div>

                {/* Expandable Sections */}
                <div className="space-y-0" style={{ animation: 'fadeInUp 1s ease-out 0.6s both' }}>
                  <ExpandableSection title="Commentary" icon="☥" defaultOpen={true} accentColor={accentColor}>
                    <div className="pt-1 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '16px' }}>{drawnChapter.commentary}</div>
                  </ExpandableSection>

                  <ExpandableSection title={isSpread ? "ORACLE OF THE ABYSS · TRIAD SYNTHESIS" : "ORACLE OF THE ABYSS"} icon="☉" defaultOpen={true} accentColor={accentColor}>
                    <div className="pt-1">
                      {oracle.loading && !oracle.text ? (
                        <div className="flex items-center gap-2 lux-crimson">
                          <span style={{ animation: 'ritualPulse 1.5s ease-in-out infinite' }}>☉</span>
                          <span className="text-[12px]">
                            {oracle.thinking ? "The Oracle descends through the veils..." : "The Oracle speaks from the depths..."}
                          </span>
                        </div>
                      ) : oracle.error ? (
                        <div className="text-[13px] lux">
                          <span className="lux-crimson">The Abyss refuses:</span> {oracle.error}
                          <button onClick={consultNow} className="ml-2 underline lux-crimson">Retry</button>
                        </div>
                      ) : oracle.text ? (
                        <div className="space-y-3">
                          <div className="whitespace-pre-wrap leading-relaxed lux" style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '16.5px' }}>
                            {oracle.text}
                            {oracle.streaming && (
                              <span style={{ color: '#ff5e74', animation: 'ritualPulse 1s ease-in-out infinite' }}>▌</span>
                            )}
                          </div>
                          {!oracle.streaming && voiceEnabled && voice.available && (
                            <button onClick={() => voice.speaking ? voice.stop() : voice.speak(oracle.text)}
                              className="text-[11px] tracking-wider transition-colors lux-crimson hover:opacity-80 flex items-center gap-1.5"
                              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {voice.speaking ? "◼ STOP" : "▶ SPEAK"}
                            </button>
                          )}
                        </div>
                      ) : (
                        <button onClick={consultNow} className="text-[12px] lux-crimson hover:opacity-80 transition-colors">
                          {isSpread ? "Invoke the Oracle's synthesis..." : "Invoke the Oracle..."}
                        </button>
                      )}
                    </div>
                  </ExpandableSection>

                  <ExpandableSection title="Qabalistic Analysis" icon="♁" defaultOpen={false} accentColor={accentColor}>
                    <div className="pt-1 space-y-3">
                      {(() => {
                        const info = getSephiraInfo(drawnChapter.sephira);
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-2.5 text-[12px]">
                              <div>
                                <span className="lux-dim">Sephira:</span>{" "}
                                <span className="lux">{drawnChapter.sephira}</span>
                                <span className="lux-dim ml-1">({info.meaning})</span>
                              </div>
                              <div>
                                <span className="lux-dim">Path:</span>{" "}
                                <span className="lux">{drawnChapter.path}</span>
                                {drawnChapter.path !== "—" && drawnChapter.path !== "∅" && HEBREW_LETTERS[drawnChapter.path] && (
                                  <span className="ml-1 lux-crimson">{HEBREW_LETTERS[drawnChapter.path].letter}</span>
                                )}
                              </div>
                              <div>
                                <span className="lux-dim">Element:</span>{" "}
                                <span className="lux">{drawnChapter.element}</span>
                                {ELEMENT_SYMBOLS[drawnChapter.element] && <span className="ml-1 lux">{ELEMENT_SYMBOLS[drawnChapter.element]}</span>}
                              </div>
                              <div>
                                <span className="lux-dim">Tarot:</span>{" "}
                                <span className="lux">{drawnChapter.tarot}</span>
                              </div>
                              {info.planet !== "—" && <div><span className="lux-dim">Planet:</span> <span className="lux">{info.planet}</span></div>}
                              {info.godName !== "—" && <div><span className="lux-dim">God Name:</span> <span className="lux">{info.godName}</span></div>}
                              {info.archangel !== "—" && <div><span className="lux-dim">Archangel:</span> <span className="lux">{info.archangel}</span></div>}
                            </div>

                            {correspondences.length > 0 && (
                              <div className="pt-3">
                                <hr className="star-rule mb-3 opacity-40" />
                                <div className="text-[10px] lux-dim mb-2 tracking-wider">
                                  GEMATRIC CORRESPONDENCES ({gematriaResult?.simple})
                                </div>
                                {correspondences.map((c, i) => (
                                  <div key={i} className="flex items-start gap-2 text-[12px] mb-1.5">
                                    <span className="text-[9px] tracking-wider uppercase"
                                      style={{ color: c.type === 'direct' ? '#ff8fa0' : c.type === 'square' ? '#f0b75e' : '#9aa0c4' }}>{c.type}</span>
                                    <span className="lux">{c.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: info.color, boxShadow: `0 0 10px ${info.color}` }} />
                              <span className="text-[11px] lux-dim">{drawnChapter.sephira}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </ExpandableSection>
                </div>

                {/* Perform-this-rite (only for the three ritual chapters) */}
                {RITUALS[drawnChapter.chapter] && (
                  <div className="flex justify-center mt-8" style={{ animation: 'fadeInUp 1s ease-out 0.85s both' }}>
                    <button onClick={() => { setRitualChapter(drawnChapter.chapter); navigate("ritual"); }}
                      className="text-[12px] tracking-[0.22em] lux-crimson transition-all duration-500 hover:tracking-[0.34em]"
                      style={{ fontFamily: 'Cinzel, serif' }}>
                      ☉ Perform this Rite — {RITUALS[drawnChapter.chapter].title}
                    </button>
                  </div>
                )}

                {/* Action Buttons — floating glowing links */}
                <div className="flex items-center justify-center gap-8 mt-10 pb-8" style={{ animation: 'fadeInUp 1s ease-out 0.9s both' }}>
                  <button onClick={saveReading} disabled={saved}
                    className={`text-[12px] tracking-[0.18em] transition-all duration-300 ${saved ? 'cursor-default lux-dim opacity-60' : 'lux-crimson hover:tracking-[0.28em]'}`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    {saved ? "✓ Recorded" : "✦ Save to Grimoire"}
                  </button>
                  <button onClick={resetToInput}
                    className="text-[12px] tracking-[0.18em] lux-dim hover:text-[#d8dcf2] hover:tracking-[0.28em] transition-all duration-300"
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    New Reading →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative text-center text-[13px] italic" style={{ zIndex: 2, fontFamily: "'IM Fell English', serif", paddingTop: '8px', paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <hr className="gild-rule w-48 mx-auto mb-3 opacity-60" />
        <span className="gilded">Do what thou wilt shall be the whole of the Law.</span>
      </footer>
    </div>
  );
};

export default App;
