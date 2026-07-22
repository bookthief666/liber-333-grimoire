import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function file(relativePath) {
  return path.join(ROOT, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(file(relativePath), 'utf8');
}

function write(relativePath, content) {
  const target = file(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function replaceOnce(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) {
    throw new Error(`Navigation transform could not find: ${label}`);
  }
  return next;
}

function removeFile(relativePath) {
  const target = file(relativePath);
  if (fs.existsSync(target)) fs.rmSync(target);
}

const navigationContext = `import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export const GRIMOIRE_MODES = ['oracle', 'ritual', 'tree', 'gematria', 'grimoire'];

export const MODE_LABELS = {
  oracle: 'ORACLE',
  ritual: 'RITES',
  tree: 'TREE',
  gematria: 'GEMATRIA',
  grimoire: 'GRIMOIRE',
};

const VALID_MODES = new Set(GRIMOIRE_MODES);
const GrimoireNavigationContext = createContext(null);

function readInitialNavigation() {
  if (typeof window === 'undefined') return { mode: 'oracle', surfaceMode: 'oracle', journalOpen: false };

  const url = new URL(window.location.href);
  const requested = url.searchParams.get('mode');
  const mode = requested && VALID_MODES.has(requested) ? requested : 'oracle';
  const surfaceMode = mode === 'grimoire' ? 'oracle' : mode;

  if (requested) {
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', \`${'${url.pathname}${url.search}${url.hash}'}\`);
  }

  return { mode, surfaceMode, journalOpen: mode === 'grimoire' };
}

export function GrimoireNavigationProvider({ children }) {
  const initial = useRef(readInitialNavigation()).current;
  const [mode, setModeState] = useState(initial.mode);
  const [surfaceMode, setSurfaceMode] = useState(initial.surfaceMode);
  const [journalOpen, setJournalOpen] = useState(initial.journalOpen);
  const [navigationRequest, setNavigationRequest] = useState(null);
  const requestId = useRef(0);

  const issueRequest = useCallback((type, payload = {}) => {
    requestId.current += 1;
    setNavigationRequest({ id: requestId.current, type, ...payload });
  }, []);

  const navigate = useCallback((nextMode, payload = null) => {
    if (!VALID_MODES.has(nextMode)) return;

    if (nextMode === 'grimoire') {
      setModeState('grimoire');
      setJournalOpen(true);
      issueRequest('journal', payload || {});
      return;
    }

    setSurfaceMode(nextMode);
    setModeState(nextMode);
    setJournalOpen(false);
    if (payload) issueRequest('navigate', { mode: nextMode, payload });
  }, [issueRequest]);

  const openOracleInput = useCallback((question = '') => {
    setSurfaceMode('oracle');
    setModeState('oracle');
    setJournalOpen(false);
    issueRequest('oracle-input', { question });
  }, [issueRequest]);

  const openRite = useCallback((chapter = null) => {
    setSurfaceMode('ritual');
    setModeState('ritual');
    setJournalOpen(false);
    issueRequest('rite', { chapter });
  }, [issueRequest]);

  const openJournal = useCallback(() => {
    setModeState('grimoire');
    setJournalOpen(true);
    issueRequest('journal');
  }, [issueRequest]);

  const closeJournal = useCallback(() => {
    setJournalOpen(false);
    setModeState(surfaceMode);
  }, [surfaceMode]);

  const value = useMemo(() => ({
    mode,
    surfaceMode,
    journalOpen,
    navigationRequest,
    setMode: navigate,
    navigate,
    openOracleInput,
    openRite,
    openJournal,
    closeJournal,
  }), [
    mode,
    surfaceMode,
    journalOpen,
    navigationRequest,
    navigate,
    openOracleInput,
    openRite,
    openJournal,
    closeJournal,
  ]);

  return (
    <GrimoireNavigationContext.Provider value={value}>
      {children}
    </GrimoireNavigationContext.Provider>
  );
}

export function useGrimoireNavigation() {
  const context = useContext(GrimoireNavigationContext);
  if (!context) throw new Error('useGrimoireNavigation must be used within GrimoireNavigationProvider');
  return context;
}
`;

const landingCenterpiece = `import IchorOrb from './IchorOrb.jsx';

export default function LandingCenterpiece() {
  return (
    <div className="liber-ichor-host">
      <IchorOrb />
    </div>
  );
}
`;

write('src/contexts/GrimoireNavigationContext.jsx', navigationContext);
write('src/LandingCenterpiece.jsx', landingCenterpiece);

let main = read('src/main.jsx');
main = replaceOnce(
  main,
  "import LandingIchorPortal from './LandingIchorPortal.jsx';\nimport { applyInitialDeepLink } from './deepLinkBridge.js';",
  "import { GrimoireNavigationProvider } from './contexts/GrimoireNavigationContext.jsx';",
  'main imports',
);
main = replaceOnce(
  main,
  `  <React.StrictMode>\n    <ProductShell>\n      <App />\n      <LandingIchorPortal />\n    </ProductShell>\n  </React.StrictMode>,`,
  `  <React.StrictMode>\n    <GrimoireNavigationProvider>\n      <ProductShell>\n        <App />\n      </ProductShell>\n    </GrimoireNavigationProvider>\n  </React.StrictMode>,`,
  'provider render boundary',
);
main = replaceOnce(main, '\napplyInitialDeepLink();\n', '\n', 'legacy deep-link call');
write('src/main.jsx', main);

let shell = read('src/ProductShell.jsx');
shell = replaceOnce(
  shell,
  "import { useEffect, useMemo, useRef, useState } from 'react';",
  "import { useEffect, useMemo, useRef, useState } from 'react';\nimport { MODE_LABELS, useGrimoireNavigation } from './contexts/GrimoireNavigationContext.jsx';",
  'ProductShell navigation import',
);
shell = replaceOnce(
  shell,
  /\nconst MODE_LABELS = \{[\s\S]*?\n\};\n\nconst MODE_HELP =/,
  '\nconst MODE_HELP =',
  'ProductShell local mode labels',
);
shell = replaceOnce(
  shell,
  /\nfunction findButton\([\s\S]*?\n}\n\nfunction navigateLegacyApp\([\s\S]*?\n}\n/,
  '\n',
  'ProductShell DOM navigation helpers',
);
shell = replaceOnce(
  shell,
  "  const [activePanel, setActivePanel] = useState(null);\n  const [activeMode, setActiveMode] = useState('oracle');",
  "  const [activePanel, setActivePanel] = useState(null);\n  const { mode: activeMode, navigate } = useGrimoireNavigation();",
  'ProductShell active mode state',
);
shell = replaceOnce(
  shell,
  /\n  useEffect\(\(\) => \{\n    const trackMode = \(event\) => \{[\s\S]*?\n  }, \[\]\);\n/,
  '\n',
  'ProductShell click tracker',
);
shell = replaceOnce(
  shell,
  `  const navigate = (mode) => {\n    setActivePanel(null);\n    setActiveMode(mode);\n    navigateLegacyApp(mode);\n  };`,
  `  const navigateFromHelp = (nextMode) => {\n    setActivePanel(null);\n    navigate(nextMode);\n  };`,
  'ProductShell help navigation',
);
shell = replaceOnce(shell, 'onNavigate={navigate}', 'onNavigate={navigateFromHelp}', 'ProductShell HelpPanel action');
write('src/ProductShell.jsx', shell);

let app = read('src/liber333.jsx');
app = replaceOnce(
  app,
  "import { fetchOracleInterpretation, streamOracleInterpretation } from './api.js';",
  "import { fetchOracleInterpretation, streamOracleInterpretation } from './api.js';\nimport { useGrimoireNavigation } from './contexts/GrimoireNavigationContext.jsx';\nimport LandingCenterpiece from './LandingCenterpiece.jsx';",
  'core navigation imports',
);
app = replaceOnce(
  app,
  `const App = () => {\n  // ── Phase: init | input | ritual | revelation ──\n  const [phase, setPhase] = useState("init");\n  const [mode, setMode] = useState("oracle"); // oracle | ritual | tree | gematria`,
  `const App = () => {\n  const {\n    surfaceMode,\n    journalOpen,\n    navigationRequest,\n    navigate,\n    openJournal,\n    closeJournal,\n  } = useGrimoireNavigation();\n\n  // ── Phase: init | input | ritual | revelation ──\n  const [phase, setPhase] = useState("init");`,
  'core local mode state',
);
app = replaceOnce(
  app,
  '  const [showJournal, setShowJournal] = useState(false);\n',
  '',
  'core journal state',
);
app = replaceOnce(
  app,
  `  const evolutionRings = Math.min(Math.floor(journal.totalReadings / 5), 4);\n\n\n  // ── Idle detection for ambient mode ──`,
  `  const evolutionRings = Math.min(Math.floor(journal.totalReadings / 5), 4);\n\n  useEffect(() => {\n    if (!navigationRequest) return;\n\n    if (navigationRequest.type === 'oracle-input') {\n      setQuestion(navigationRequest.question || '');\n      setPhase("input");\n      return;\n    }\n\n    if (navigationRequest.type === 'rite') {\n      setRitualChapter(navigationRequest.chapter || null);\n    }\n  }, [navigationRequest]);\n\n\n  // ── Idle detection for ambient mode ──`,
  'navigation request effect',
);
app = app.replaceAll('setMode(', 'navigate(');
app = replaceOnce(app, '  }, [oracle]);\n\n  // ── Unified (re)consultation', '  }, [oracle, navigate]);\n\n  // ── Unified (re)consultation', 'tree callback dependency');
app = replaceOnce(app, 'const on = mode === m;', 'const on = surfaceMode === m;', 'top navigation active mode');
app = replaceOnce(app, 'setShowJournal(true)', 'openJournal()', 'journal open action');
app = replaceOnce(app, '{showJournal && (', '{journalOpen && (', 'journal visibility');
app = replaceOnce(app, 'onClose={() => setShowJournal(false)}', 'onClose={closeJournal}', 'journal close action');
app = app.replaceAll('mode === "gematria"', 'surfaceMode === "gematria"');
app = app.replaceAll('mode === "ritual"', 'surfaceMode === "ritual"');
app = app.replaceAll('mode === "tree"', 'surfaceMode === "tree"');
app = app.replaceAll('mode === "oracle"', 'surfaceMode === "oracle"');
app = replaceOnce(
  app,
  `                <div className="mb-6 relative inline-flex items-center justify-center" style={{ animation: isAmbient ? 'breathe 8s ease-in-out infinite' : 'none' }}>\n                  <ZodiacRing size={300} accentColor="#ff2e4d" />\n                  <AnimatedSigil input="LIBER CCCXXXIII" size={180} spinning={true} glowing={true}\n                    evolutionRings={evolutionRings} accentColor={accentColor} />\n                </div>`,
  '                <LandingCenterpiece />',
  'explicit landing centerpiece',
);

if (/\bsetMode\(/.test(app)) throw new Error('Legacy setMode call remains in src/liber333.jsx');
if (/\bshowJournal\b/.test(app)) throw new Error('Legacy showJournal state remains in src/liber333.jsx');
write('src/liber333.jsx', app);

removeFile('src/deepLinkBridge.js');
removeFile('src/LandingIchorPortal.jsx');

write('docs/NAVIGATION_FOUNDATION.md', `# Shared Navigation Foundation\n\nThis milestone replaces the temporary DOM compatibility bridges with a canonical React navigation boundary.\n\n## Canonical modes\n\n- Oracle\n- Rites\n- Tree\n- Gematria\n- Grimoire\n\nThe provider exposes the active context mode, the underlying surface mode, journal visibility, a future-safe navigation request payload, and explicit actions for opening Oracle input, a rite, or the journal.\n\n## Removed compatibility mechanisms\n\n- button-text matching in ProductShell;\n- document-level click tracking for active mode;\n- delayed deep-link button clicks;\n- MutationObserver landing-title discovery;\n- portal injection of the Ichor Orb.\n\nThe landing orb is now rendered by an explicit LandingCenterpiece component inside the original landing phase.\n\n## Protected behavior\n\nThis transformation does not modify the corpus, chapter indexes, Gematria arithmetic, Oracle prompt wording, Tree placements, ritual choreography, or journal storage schema.\n`);

console.log('Navigation foundation applied successfully.');
