import { useEffect, useMemo, useRef, useState } from 'react';

const PREFERENCES_KEY = 'liber333_shell_preferences_v2';

const DEFAULT_PREFERENCES = {
  motion: 'system',
  textScale: '100',
};

const MODE_LABELS = {
  oracle: 'ORACLE',
  ritual: 'RITES',
  tree: 'TREE',
  gematria: 'GEMATRIA',
  grimoire: 'GRIMOIRE',
};

const MODE_HELP = {
  oracle: {
    title: 'Oracle — Chamber of Question',
    glyph: '☉',
    purpose:
      'Ask one precise question, let its English Ordinal value select a chapter or triad, and then read the source text beside calculated correspondences, editorial commentary, and the optional AI reflection.',
    method:
      'Single selects one chapter. Triad selects three different chapters and reads them as Thesis, Antithesis, and Synthesis. The wording of the question matters because the exact letters produce the numerical key.',
    practice:
      'Ask about one actual contradiction or decision. After reading, name one concrete action or observation that could test the interpretation instead of immediately drawing again.',
    provenance:
      'Crowley’s chapter is the source text. Fixed commentary and attributions are modern editorial layers. Gematria is calculated. The Oracle reflection is AI-generated when the external service is available.',
    data:
      'The question and selected reading context may be transmitted to the configured AI provider. Saved readings remain in this browser’s local storage.',
    actions: [
      { mode: 'tree', label: 'Locate the chapter on the Tree' },
      { mode: 'grimoire', label: 'Review saved readings' },
    ],
  },
  ritual: {
    title: 'Rites — Processional Circle',
    glyph: '✦',
    purpose:
      'Perform the three guided rites as paced sequences rather than reading them as static text.',
    method:
      'Choose a rite, read its introduction, prepare the space, and advance station by station. Sound and bells are optional. Read the complete sequence before beginning.',
    practice:
      'Use symbolic and physically safe substitutions. When complete, record what changed in attention, mood, or conduct rather than judging the rite only by dramatic sensation.',
    provenance:
      'The ritual source material is presented through an editorial step-by-step structure. Explanations, transliterations, and safety language are modern additions.',
    data:
      'The guided rite operates locally and does not require the AI service. Rite progress is not yet synchronized or permanently stored.',
    actions: [
      { mode: 'tree', label: 'Study the source chapter' },
      { mode: 'oracle', label: 'Ask after practice' },
    ],
  },
  tree: {
    title: 'Tree — Map of Emanation',
    glyph: '☷',
    purpose:
      'Study the Book through Sephiroth, paths, and the negative veils instead of treating it only as a linear sequence.',
    method:
      'Select a sphere, path, or veil to inspect the chapters associated with that location. Opening a chapter here is a deliberate study choice, not a divinatory draw.',
    practice:
      'Compare several chapters assigned to one location and identify the recurring philosophical or magical problem that binds them.',
    provenance:
      'The interactive map and chapter placements are an editorial correspondence model. They are interpretive architecture rather than a claim that Crowley supplied this exact arrangement.',
    data:
      'Tree browsing is local. No AI request occurs unless an Oracle interpretation is later invoked.',
    actions: [
      { mode: 'gematria', label: 'Examine a phrase' },
      { mode: 'oracle', label: 'Form a question' },
    ],
  },
  gematria: {
    title: 'Gematria — Constellation of Number',
    glyph: '∴',
    purpose:
      'Calculate English Ordinal values, reduction steps, factors, and selected numerical correspondences without initiating a reading.',
    method:
      'The current calculator uses A=1 through Z=26. Latin letters are counted; spaces, punctuation, digits, accents, and other scripts are ignored.',
    practice:
      'Compare two precise formulations of the same intention. Treat numerical echoes as prompts for interpretation, not automatic historical proof or causation.',
    provenance:
      'The arithmetic is reproducible. The meanings attached to notable numbers are editorial selections from Qabalistic and Thelemic reference traditions.',
    data:
      'Standalone Gematria calculation occurs entirely in the browser.',
    actions: [
      { mode: 'oracle', label: 'Use the phrase as a question' },
      { mode: 'tree', label: 'Browse related architecture' },
    ],
  },
  grimoire: {
    title: 'Grimoire — Memory Vault',
    glyph: '☥',
    purpose:
      'Review saved consultations, repeated chapters, question wording, interpretations, and timing context across a longer period of work.',
    method:
      'Open an entry to revisit it. Compare recurrence, unresolved actions, and changes in the questions you ask before beginning another consultation.',
    practice:
      'When a chapter repeats, identify what remained unfinished between appearances. Use recurrence as a demand for verification, not as automatic supernatural proof.',
    provenance:
      'The journal records your inputs and the application’s outputs. Milestones and recurrence language are part of the designed ritual experience.',
    data:
      'Entries are stored in this browser’s local storage. They are not synchronized and can be lost if site data is cleared.',
    actions: [
      { mode: 'oracle', label: 'Begin a new reading' },
      { mode: 'tree', label: 'Study a recurrent chapter' },
    ],
  },
};

function normalizeText(value = '') {
  return value
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toUpperCase();
}

function readStoredPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || 'null');
    return { ...DEFAULT_PREFERENCES, ...(parsed || {}) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function findButton(label) {
  const target = normalizeText(label);
  return Array.from(document.querySelectorAll('button')).find((button) => {
    const text = normalizeText(button.textContent || '');
    return text === target || (target === 'GRIMOIRE' && text.startsWith('GRIMOIRE'));
  });
}

function navigateLegacyApp(mode) {
  window.dispatchEvent(new CustomEvent('liber333:navigate', { detail: { mode } }));
  window.setTimeout(() => findButton(MODE_LABELS[mode])?.click(), 80);
}

function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null);
  const titleId = `liber-dialog-${normalizeText(title).toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const items = Array.from(
        dialog.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="liber-shell-backdrop" role="presentation">
      <button className="liber-shell-dismiss-layer" aria-label="Close dialog" onClick={onClose} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="liber-shell-dialog">
        <header className="liber-shell-dialog-header">
          <div>
            <p className="liber-shell-kicker">LIBER CCCXXXIII</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className="liber-shell-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function HelpPanel({ mode, onClose, onNavigate }) {
  const help = MODE_HELP[mode] || MODE_HELP.oracle;
  return (
    <Modal title={help.title} onClose={onClose}>
      <div className="liber-help-glyph" aria-hidden="true">
        {help.glyph}
      </div>
      <div className="liber-help-sections">
        <section>
          <h3>What this chamber does</h3>
          <p>{help.purpose}</p>
        </section>
        <section>
          <h3>How it works</h3>
          <p>{help.method}</p>
        </section>
        <section>
          <h3>Practical use</h3>
          <p>{help.practice}</p>
        </section>
        <section>
          <h3>Source and interpretation</h3>
          <p>{help.provenance}</p>
        </section>
        <section className="liber-help-data">
          <h3>Data</h3>
          <p>{help.data}</p>
        </section>
      </div>
      <div className="liber-shell-actions">
        {help.actions.map((action) => (
          <button key={action.mode} onClick={() => onNavigate(action.mode)}>
            {action.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <fieldset className="liber-setting-group">
      <legend>{label}</legend>
      <div className="liber-segmented">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            aria-pressed={value === option.value}
            className={value === option.value ? 'is-active' : ''}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function SettingsPanel({ preferences, onChange, onClose, installAvailable, onInstall }) {
  return (
    <Modal title="Reading Environment" onClose={onClose}>
      <div className="liber-settings-stack">
        <p className="liber-setting-intro">
          The Astral Void, stars, sigils, particles, and ritual animations remain fully present by default. Motion is reduced only when you explicitly request it or your device accessibility setting does so.
        </p>

        <SegmentedControl
          label="Motion"
          value={preferences.motion}
          onChange={(motion) => onChange({ ...preferences, motion })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'full', label: 'Full' },
            { value: 'reduced', label: 'Reduced' },
          ]}
        />

        <SegmentedControl
          label="Text scale"
          value={preferences.textScale}
          onChange={(textScale) => onChange({ ...preferences, textScale })}
          options={[
            { value: '90', label: '90%' },
            { value: '100', label: '100%' },
            { value: '115', label: '115%' },
            { value: '130', label: '130%' },
          ]}
        />

        {installAvailable ? (
          <button className="liber-install-action" onClick={onInstall}>
            Install Liber 333 on this device
          </button>
        ) : null}

        <section className="liber-privacy-card">
          <h3>Privacy and persistence</h3>
          <p>
            Saved readings remain in this browser’s local storage. Oracle questions and reading context may be sent to the configured AI provider. Tree, Rites, Gematria, and journal review operate locally.
          </p>
        </section>
      </div>
    </Modal>
  );
}

export default function ProductShell({ children }) {
  const [activePanel, setActivePanel] = useState(null);
  const [activeMode, setActiveMode] = useState('oracle');
  const [preferences, setPreferences] = useState(readStoredPreferences);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || false);

  const help = useMemo(() => MODE_HELP[activeMode] || MODE_HELP.oracle, [activeMode]);

  useEffect(() => {
    document.documentElement.dataset.liberTextScale = preferences.textScale;
    document.documentElement.dataset.liberMotion = preferences.motion;
    document.documentElement.classList.toggle('liber-force-reduced-motion', preferences.motion === 'reduced');
    document.documentElement.classList.toggle('liber-force-full-motion', preferences.motion === 'full');
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // Presentation preferences are non-critical.
    }
  }, [preferences]);

  useEffect(() => {
    const trackMode = (event) => {
      const button = event.target.closest?.('button');
      if (!button) return;
      const text = normalizeText(button.textContent || '');
      const matched = Object.entries(MODE_LABELS).find(([, label]) => {
        const normalizedLabel = normalizeText(label);
        return text === normalizedLabel || (label === 'GRIMOIRE' && text.startsWith(normalizedLabel));
      });
      if (matched) setActiveMode(matched[0]);
    };
    document.addEventListener('click', trackMode, true);
    return () => document.removeEventListener('click', trackMode, true);
  }, []);

  useEffect(() => {
    const beforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const appInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', appInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', appInstalled);
    };
  }, []);

  const navigate = (mode) => {
    setActivePanel(null);
    setActiveMode(mode);
    navigateLegacyApp(mode);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    setInstallPrompt(null);
  };

  return (
    <div className="liber-product-shell">
      <div className="liber-shell-starfield" aria-hidden="true" />
      {children}

      <div className="liber-context-tools" aria-label="Contextual guidance and settings">
        <button
          className="liber-context-help"
          onClick={() => setActivePanel('help')}
          aria-label={`Explain ${MODE_LABELS[activeMode].toLowerCase()} mode`}
          title={`Explain ${MODE_LABELS[activeMode].toLowerCase()} mode`}
        >
          <span aria-hidden="true">{help.glyph}</span>
          <sup aria-hidden="true">?</sup>
        </button>
        <button
          className="liber-context-settings"
          onClick={() => setActivePanel('settings')}
          aria-label="Open reading environment settings"
          title="Reading environment"
        >
          ⚙
        </button>
      </div>

      {activePanel === 'help' ? <HelpPanel mode={activeMode} onClose={() => setActivePanel(null)} onNavigate={navigate} /> : null}
      {activePanel === 'settings' ? (
        <SettingsPanel
          preferences={preferences}
          onChange={setPreferences}
          onClose={() => setActivePanel(null)}
          installAvailable={!installed && Boolean(installPrompt)}
          onInstall={install}
        />
      ) : null}
    </div>
  );
}
