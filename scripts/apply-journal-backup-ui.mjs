import fs from 'node:fs';

const path = 'src/liber333.jsx';
let source = fs.readFileSync(path, 'utf8');
let changed = false;

const oldSignature = 'const JournalOverlay = ({ entries, totalReadings, onClose, onDelete, onClear, onSelect, accentColor = "#dc2626" }) => {\n  // Count recurrences';
const newSignature = `const JournalOverlay = ({ entries, totalReadings, onClose, onDelete, onClear, onSelect, onExportBackup, onImportBackup, accentColor = "#dc2626" }) => {
  const importInputRef = useRef(null);
  const [backupStatus, setBackupStatus] = useState(null);

  const handleExportBackup = () => {
    try {
      const backup = onExportBackup?.();
      if (!backup?.content || !backup?.filename) throw new Error('The Grimoire backup could not be prepared.');

      const blob = new Blob([backup.content], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = backup.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);

      const noun = backup.entryCount === 1 ? 'reading' : 'readings';
      setBackupStatus({ type: 'success', text: 'Exported ' + backup.entryCount + ' saved ' + noun + '.' });
    } catch (error) {
      setBackupStatus({ type: 'error', text: error?.message || 'The Grimoire backup could not be exported.' });
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setBackupStatus({ type: 'error', text: 'The selected backup is larger than the 2 MB import limit.' });
      return;
    }

    setBackupStatus({ type: 'working', text: 'Reading the backup…' });
    try {
      const text = await file.text();
      const result = await onImportBackup?.(text);
      if (!result) throw new Error('The Grimoire backup could not be imported.');

      let message = 'Imported ' + result.importedCount + ' new reading' + (result.importedCount === 1 ? '' : 's') + '.';
      if (result.duplicateCount > 0) {
        message += ' ' + result.duplicateCount + ' existing entr' + (result.duplicateCount === 1 ? 'y was' : 'ies were') + ' kept.';
      }
      if (result.omittedByCap > 0) {
        message += ' The newest 50 readings were retained.';
      }
      setBackupStatus({ type: 'success', text: message });
    } catch (error) {
      setBackupStatus({ type: 'error', text: error?.message || 'The selected file is not a valid Grimoire backup.' });
    }
  };

  // Count recurrences`;

if (!source.includes('const importInputRef = useRef(null);')) {
  if (!source.includes(oldSignature)) throw new Error('JournalOverlay signature seam was not found.');
  source = source.replace(oldSignature, newSignature);
  changed = true;
}

const oldControls = `          <div className="flex items-center gap-4">
            {entries.length > 0 && (
              <button onClick={onClear} className="text-[10px] lux-dim hover:lux-crimson transition-colors"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>CLEAR ALL</button>
            )}
            <button onClick={onClose} className="lux-dim hover:text-white transition-colors text-2xl leading-none">×</button>
          </div>`;
const newControls = `          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <button onClick={handleExportBackup} className="text-[10px] lux-dim hover:lux-crimson transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>EXPORT</button>
            <button onClick={() => importInputRef.current?.click()} className="text-[10px] lux-dim hover:lux-crimson transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>IMPORT</button>
            <input ref={importInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
            {entries.length > 0 && (
              <button onClick={onClear} className="text-[10px] lux-dim hover:lux-crimson transition-colors"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>CLEAR ALL</button>
            )}
            <button onClick={onClose} aria-label="Close Grimoire" className="lux-dim hover:text-white transition-colors text-2xl leading-none">×</button>
          </div>`;

if (!source.includes('onClick={handleExportBackup}')) {
  if (!source.includes(oldControls)) throw new Error('JournalOverlay controls seam was not found.');
  source = source.replace(oldControls, newControls);
  changed = true;
}

const oldRule = '        <hr className="star-rule opacity-50" />\n\n        <div className="flex-1 overflow-y-auto p-4">';
const newRule = `        <hr className="star-rule opacity-50" />
        <div className="px-5 pt-2 text-[9px] lux-dim" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Backups are read and written on this device. Imported entries merge without erasing the current journal.
        </div>
        {backupStatus && (
          <div role={backupStatus.type === 'error' ? 'alert' : 'status'} className="px-5 pt-2 text-[10px]"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: backupStatus.type === 'error' ? '#ff8fa0' : backupStatus.type === 'success' ? '#f0b75e' : '#9aa0c4' }}>
            {backupStatus.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">`;

if (!source.includes('Imported entries merge without erasing')) {
  if (!source.includes(oldRule)) throw new Error('JournalOverlay status seam was not found.');
  source = source.replace(oldRule, newRule);
  changed = true;
}

const oldInvocation = `        <JournalOverlay entries={journal.entries} totalReadings={journal.totalReadings}
          onClose={closeJournal} onDelete={journal.removeEntry}
          onClear={journal.clearAll} onSelect={viewJournalEntry} accentColor={accentColor} />`;
const newInvocation = `        <JournalOverlay entries={journal.entries} totalReadings={journal.totalReadings}
          onClose={closeJournal} onDelete={journal.removeEntry}
          onClear={journal.clearAll} onSelect={viewJournalEntry}
          onExportBackup={journal.exportBackup} onImportBackup={journal.importBackup}
          accentColor={accentColor} />`;

if (!source.includes('onExportBackup={journal.exportBackup}')) {
  if (!source.includes(oldInvocation)) throw new Error('JournalOverlay invocation seam was not found.');
  source = source.replace(oldInvocation, newInvocation);
  changed = true;
}

if (!source.includes('ORACLE OF THE ABYSS')) throw new Error('Oracle-facing title changed unexpectedly.');
if (/AI-GENERATED INTERPRETATION/i.test(source)) throw new Error('Rejected Oracle label returned.');

if (changed) fs.writeFileSync(path, source);
console.log(changed ? 'Applied Grimoire backup UI.' : 'Grimoire backup UI already applied.');
