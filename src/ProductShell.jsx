import { useEffect, useMemo, useRef, useState } from 'react';
import { MODE_LABELS, useGrimoireNavigation } from './contexts/GrimoireNavigationContext.jsx';
import { getExperienceSettingsRuntime } from './features/settings/experienceSettings.js';

const MODE_HELP = {
  oracle: {
    title: 'Oracle — Chamber of Question',
    glyph: '☉',
    purpose: 'Ask one precise question, let its English Ordinal value select a chapter or triad, and read the source text beside calculated correspondences, editorial commentary, and the optional Oracle interpretation.',
    method: 'Single selects one chapter. Triad selects three different chapters and reads them as Thesis, Antithesis, and Synthesis. The exact wording matters because the letters produce the numerical key.',
    practice: 'Ask about one actual contradiction or decision. After reading, name one concrete action or observation that could test the interpretation instead of immediately drawing again.',
    provenance: 'Crowley’s chapter is the source text. Fixed commentary and attributions are modern editorial layers. Gematria is calculated. The optional Oracle interpretation is produced only when the external service is available.',
    data: 'The question and selected reading context may be transmitted to the configured model provider. Saved readings remain in this browser’s local storage.',
    actions: [
      { mode: 'tree', label: 'Locate the chapter on the Tree' },
      { mode: 'grimoire', label: 'Review saved readings' },
    ],
  },
  ritual: {
    title: 'Rites — Processional Circle',
    glyph: '✦',
    purpose: 'Perform the three guided rites as paced sequences rather than reading them as static text.',
    method: 'Choose a rite, read its introduction, prepare the space, and advance station by station. Sound and bells are optional. Read the complete sequence before beginning.',
    practice: 'Use symbolic and physically safe substitutions. When complete, record what changed in attention, mood, or conduct rather than judging the rite only by dramatic sensation.',
    provenance: 'The ritual source material is presented through an editorial step-by-step structure. Explanations, transliterations, and safety language are modern additions.',
    data: 'The guided rite operates locally and does not require the Oracle service. Rite progress is not synchronized.',
    actions: [
      { mode: 'tree', label: 'Study the source chapter' },
      { mode: 'oracle', label: 'Ask after practice' },
    ],
  },
  tree: {
    title: 'Tree — Map of Emanation',
    glyph: '☷',
    purpose: 'Study the Book through Sephiroth, paths, and the negative veils instead of treating it only as a linear sequence.',
    method: 'Select a sphere, path, or veil to inspect associated chapters. Opening a chapter here is a deliberate study choice, not a divinatory draw.',
    practice: 'Compare several chapters assigned to one location and identify the recurring philosophical or magical problem that binds them.',
    provenance: 'The interactive map and chapter placements are an editorial correspondence model rather than a claim that Crowley supplied this exact arrangement.',
    data: 'Tree browsing is local. No Oracle request occurs unless an interpretation is later invoked.',
    actions: [
      { mode: 'gematria', label: 'Examine a phrase' },
      { mode: 'oracle', label: 'Form a question' },
    ],
  },
  gematria: {
    title: 'Gematria — Constellation of Number',
    glyph: '∴',
    purpose: 'Calculate English Ordinal values, reduction steps, factors, and selected numerical correspondences without initiating a reading.',
    method: 'The current calculator uses A=1 through Z=26. Latin letters are counted; spaces, punctuation, digits, accents, and other scripts are ignored.',
    practice: 'Compare two precise formulations of the same intention. Treat numerical echoes as prompts for interpretation, not automatic historical proof or causation.',
    provenance: 'The arithmetic is reproducible. Meanings attached to notable numbers are editorial selections from Qabalistic and Thelemic reference traditions.',
    data: 'Standalone Gematria calculation occurs entirely in the browser.',
    actions: [
      { mode: 'oracle', label: 'Use the phrase as a question' },
      { mode: 'tree', label: 'Browse related architecture' },
    ],
  },
  grimoire: {
    title: 'Grimoire — Memory Vault',
    glyph: '☥',
    purpose: 'Review saved consultations, repeated chapters, question wording, interpretations, and timing context across a longer period of work.',
    method: 'Open an entry to revisit it. Compare recurrence, unresolved actions, and changes in the questions you ask before beginning another consultation.',
    practice: 'When a chapter repeats, identify what remained unfinished between appearances. Use recurrence as a demand for verification, not automatic supernatural proof.',
    provenance: 'The journal records your inputs and the application’s outputs. Milestones and recurrence language are part of the designed ritual experience.',
    data: 'Entries and backups remain local to this browser unless you explicitly export a JSON file.',
    actions: [
      { mode: 'oracle', label: 'Begin a new reading' },
      { mode: 'tree', label: 'Study a recurrent chapter' },
    ],
  },
};

const ORIENTATION_STEPS = [
  { mode: 'oracle', glyph: '☉', title: 'I have a question', text: 'Begin a deterministic Single or Triad reading.' },
  { mode: 'tree', glyph: '☷', title: 'I want to study', text: 'Browse chapters through the Tree and its attributed locations.' },
  { mode: 'ritual', glyph: '✦', title: 'I want to practice', text: 'Enter a guided, symbolically safe ritual sequence.' },
  { mode: 'gematria', glyph: '∴', title: 'I want to examine a word', text: 'Calculate its English Ordinal value without drawing a chapter.' },
  { mode: 'grimoire', glyph: '☥', title: 'I want to review patterns', text: 'Return to saved readings, recurrence, and local backups.' },
];

function normalizeText(value = '') {
  return value.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toUpperCase();
}

function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null);
  const titleId = `liber-dialog-${normalizeText(title).toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = dialog?.querySelector(selector);
    (focusable || dialog)?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll(selector)).filter((element) => element.getClientRects().length > 0);
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
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="liber-shell-dialog" tabIndex={-1}>
        <header className="liber-shell-dialog-header">
          <div>
            <p className="liber-shell-kicker">LIBER CCCXXXIII</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className="liber-shell-close" onClick={onClose} aria-label="Close dialog">×</button>
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
      <div className="liber-help-glyph" aria-hidden="true">{help.glyph}</div>
      <div className="liber-help-sections">
        <section><h3>What this chamber does</h3><p>{help.purpose}</p></section>
        <section><h3>How it works</h3><p>{help.method}</p></section>
        <section><h3>Practical use</h3><p>{help.practice}</p></section>
        <section><h3>Source and interpretation</h3><p>{help.provenance}</p></section>
        <section className="liber-help-data"><h3>Data</h3><p>{help.data}</p></section>
      </div>
      <div className="liber-shell-actions">
        {help.actions.map((action) => (
          <button key={action.mode} onClick={() => onNavigate(action.mode)}>{action.label}</button>
        ))}
      </div>
    </Modal>
  );
}

function OrientationPanel({ onClose, onNavigate }) {
  return (
    <Modal title="Ways of Working" onClose={onClose}>
      <p className="liber-orientation-intro">
        Choose an intention rather than a feature. This guidance can be reopened or reset from Reading Environment settings.
      </p>
      <div className="liber-orientation-grid">
        {ORIENTATION_STEPS.map((step) => (
          <button key={step.mode} className="liber-orientation-card" onClick={() => onNavigate(step.mode)}>
            <span aria-hidden="true">{step.glyph}</span>
            <strong>{step.title}</strong>
            <small>{step.text}</small>
          </button>
        ))}
      </div>
      <div className="liber-shell-actions">
        <button onClick={onClose}>Enter the Astral Void</button>
      </div>
    </Modal>
  );
}

function SegmentedControl({ label, value, options, onChange, description, disabled = false }) {
  const descriptionId = description ? `liber-setting-${normalizeText(label).toLowerCase().replace(/\s+/g, '-')}` : undefined;
  return (
    <fieldset className="liber-setting-group" disabled={disabled} aria-describedby={descriptionId}>
      <legend>{label}</legend>
      <div className="liber-segmented">
        {options.map((option) => (
          <button
            type="button"
            key={String(option.value)}
            aria-pressed={value === option.value}
            className={value === option.value ? 'is-active' : ''}
            onClick={() => onChange(option.value)}
            disabled={disabled || option.disabled}
          >
            {option.label}
          </button>
        ))}
      </div>
      {description ? <p id={descriptionId} className="liber-setting-note">{description}</p> : null}
    </fieldset>
  );
}

function SettingsPanel({ settings, onPatch, onClose, installAvailable, onInstall, onResetOrientation }) {
  return (
    <Modal title="Reading Environment" onClose={onClose}>
      <div className="liber-settings-stack">
        <p className="liber-setting-intro">
          The full ritual experience remains the default. Reduced settings preserve the Astral Void identity while shortening ceremony, limiting movement, or lowering atmospheric load.
        </p>

        <div className="liber-settings-grid">
          <SegmentedControl label="Ceremony" value={settings.ceremony} onChange={(ceremony) => onPatch({ ceremony })}
            options={[{ value: 'full', label: 'Full' }, { value: 'reduced', label: 'Reduced' }]}
            description="Reduced ceremony shortens nonessential reveal pacing without changing the selected chapters or text." />
          <SegmentedControl label="Motion" value={settings.motionExplicit ? settings.motion : settings.effectiveMotion} onChange={(motion) => onPatch({ motion })}
            options={[{ value: 'full', label: 'Full' }, { value: 'reduced', label: 'Reduced' }]}
            description={settings.motionExplicit ? `Your explicit preference is active.` : `System preference is currently applied as ${settings.effectiveMotion}.`} />
          <SegmentedControl label="Visual effects" value={settings.effects} onChange={(effects) => onPatch({ effects })}
            options={[{ value: 'high', label: 'High' }, { value: 'low', label: 'Low' }]}
            description="Low reduces particle, WebGL, whisper, blur, glow, and simultaneous background intensity." />
          <SegmentedControl label="Text size" value={settings.textSize} onChange={(textSize) => onPatch({ textSize })}
            options={[{ value: 'standard', label: 'Standard' }, { value: 'large', label: 'Large' }]} />
          <SegmentedControl label="Sound" value={settings.sound} onChange={(sound) => onPatch({ sound })}
            options={[{ value: true, label: 'On' }, { value: false, label: 'Off' }]} />
          <SegmentedControl label="Voice" value={settings.voice} onChange={(voice) => onPatch({ voice })}
            options={[{ value: true, label: 'On' }, { value: false, label: 'Off' }]} />
          <SegmentedControl label="Haptics" value={settings.haptics} onChange={(haptics) => onPatch({ haptics })}
            options={[{ value: true, label: 'On' }, { value: false, label: 'Off' }]}
            disabled={!settings.hapticsSupported}
            description={settings.hapticsSupported ? 'Used only where the browser and device support vibration.' : 'Haptics are not exposed by this browser or device.'} />
        </div>

        <button className="liber-reset-orientation" onClick={onResetOrientation}>Reset orientation guidance</button>
        {installAvailable ? <button className="liber-install-action" onClick={onInstall}>Install Liber 333 on this device</button> : null}

        <section className="liber-privacy-card">
          <h3>Privacy and persistence</h3>
          <p>Settings and saved readings remain in this browser’s local storage. Oracle questions and selected reading context may be sent to the configured model provider.</p>
        </section>
      </div>
    </Modal>
  );
}

export default function ProductShell({ children }) {
  const runtime = useMemo(() => getExperienceSettingsRuntime(), []);
  const initialSettings = useMemo(() => runtime?.getSnapshot?.() || {}, [runtime]);
  const [settings, setSettings] = useState(initialSettings);
  const [activePanel, setActivePanel] = useState(() => (initialSettings.orientationSeen ? null : 'orientation'));
  const { mode: activeMode, navigate } = useGrimoireNavigation();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || false);
  const help = useMemo(() => MODE_HELP[activeMode] || MODE_HELP.oracle, [activeMode]);

  useEffect(() => runtime?.subscribe?.(setSettings), [runtime]);

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

  const patchSettings = (patch) => runtime?.setSettings?.(patch);
  const closeOrientation = () => {
    runtime?.markOrientationSeen?.();
    setActivePanel(null);
  };
  const navigateFromPanel = (nextMode) => {
    if (activePanel === 'orientation') runtime?.markOrientationSeen?.();
    setActivePanel(null);
    navigate(nextMode);
  };
  const resetOrientation = () => {
    runtime?.resetOrientation?.();
    setActivePanel('orientation');
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
          className={`liber-context-help ${activePanel === 'help' ? 'is-active' : ''}`}
          onClick={() => setActivePanel('help')}
          aria-label={`Explain ${MODE_LABELS[activeMode].toLowerCase()} mode`}
          aria-expanded={activePanel === 'help'}
          aria-pressed={activePanel === 'help'}
          title={`Explain ${MODE_LABELS[activeMode].toLowerCase()} mode`}
        >
          <span aria-hidden="true">{help.glyph}</span><sup aria-hidden="true">?</sup>
        </button>
        <button
          className={`liber-context-settings ${activePanel === 'settings' ? 'is-active' : ''}`}
          onClick={() => setActivePanel('settings')}
          aria-label="Open reading environment settings"
          aria-expanded={activePanel === 'settings'}
          aria-pressed={activePanel === 'settings'}
          title="Reading environment"
        >
          <span aria-hidden="true">⚙</span>
        </button>
      </div>

      {activePanel === 'help' ? <HelpPanel mode={activeMode} onClose={() => setActivePanel(null)} onNavigate={navigateFromPanel} /> : null}
      {activePanel === 'orientation' ? <OrientationPanel onClose={closeOrientation} onNavigate={navigateFromPanel} /> : null}
      {activePanel === 'settings' ? (
        <SettingsPanel
          settings={settings}
          onPatch={patchSettings}
          onClose={() => setActivePanel(null)}
          onResetOrientation={resetOrientation}
          installAvailable={!installed && Boolean(installPrompt)}
          onInstall={install}
        />
      ) : null}
    </div>
  );
}
