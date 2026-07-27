import { useEffect, useMemo, useRef, useState } from 'react';
import { formatChapterNumber } from '../../data/correspondences.js';
import {
  DEFAULT_GRIMOIRE_FILTERS,
  applyGrimoireFilters,
  buildGrimoireRecurrence,
  getEntryChapterRecords,
  normalizeGrimoireFilters,
  normalizeSpreadType,
} from './grimoireWorkbench.js';
import { JOURNAL_NOTE_LIMIT } from './journalSchema.js';
import './grimoireWorkbench.css';

const STATUS_COLORS = {
  error: '#ff8fa0',
  success: '#f0b75e',
  working: '#9aa0c4',
  info: '#9aa0c4',
};

function downloadTextFile(payload, type) {
  if (!payload?.content || !payload?.filename) throw new Error('The export could not be prepared.');
  const blob = new Blob([payload.content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = payload.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function describeFilters(filters) {
  const normalized = normalizeGrimoireFilters(filters);
  const labels = [];
  if (normalized.query.trim()) labels.push(`Search: ${normalized.query.trim()}`);
  if (normalized.spread !== 'all') labels.push(normalized.spread === 'triad' ? 'Triad' : 'Single');
  if (normalized.favoritesOnly) labels.push('Favorites');
  if (normalized.chapter !== null) labels.push(`Chapter ${normalized.chapter}`);
  if (normalized.from) labels.push(`From ${normalized.from}`);
  if (normalized.to) labels.push(`Through ${normalized.to}`);
  if (normalized.sort === 'oldest') labels.push('Oldest first');
  return labels.length ? labels.join(' · ') : 'All saved consultations';
}

function EntryChapterLabel({ entry }) {
  const chapters = getEntryChapterRecords(entry);
  const primary = chapters[0] || { chapter: entry.chapter, title: entry.title };
  const extraCount = Math.max(0, chapters.length - 1);
  return (
    <div className="grimoire-entry-chapter">
      <span className="grimoire-entry-number">{formatChapterNumber(primary.chapter)}</span>
      <span className="grimoire-entry-title">{primary.title || `Chapter ${primary.chapter}`}</span>
      {extraCount > 0 && <span className="grimoire-entry-extra">+{extraCount}</span>}
    </div>
  );
}

function SegmentedButton({ active, children, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      className="grimoire-segment"
      aria-label={ariaLabel}
      aria-pressed={active}
      data-active={active ? 'true' : 'false'}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function NoteEditor({ entry, onSave, onCancel }) {
  const [draft, setDraft] = useState(entry.note || '');
  const [state, setState] = useState('idle');
  const original = entry.note || '';
  const dirty = draft !== original;

  const save = async () => {
    setState('saving');
    try {
      await onSave(entry.id, draft);
      setState('saved');
      setTimeout(() => onCancel(), 450);
    } catch {
      setState('error');
    }
  };

  return (
    <div className="grimoire-note-editor" onClick={(event) => event.stopPropagation()}>
      <label htmlFor={`grimoire-note-${entry.id}`}>Private integration note</label>
      <textarea
        id={`grimoire-note-${entry.id}`}
        value={draft}
        maxLength={JOURNAL_NOTE_LIMIT}
        autoFocus
        onChange={(event) => {
          setDraft(event.target.value);
          if (state !== 'idle') setState('idle');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          }
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            if (dirty && state !== 'saving') save();
          }
        }}
        placeholder="Record what you will test, practice, observe, or revisit."
      />
      <div className="grimoire-note-footer">
        <span aria-live="polite">
          {state === 'saving' && 'Saving…'}
          {state === 'saved' && 'Saved.'}
          {state === 'error' && 'Could not save.'}
          {state === 'idle' && dirty && 'Unsaved changes'}
          {state === 'idle' && !dirty && `${draft.length.toLocaleString('en-US')} / ${JOURNAL_NOTE_LIMIT.toLocaleString('en-US')}`}
        </span>
        <div>
          <button type="button" className="grimoire-text-button" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="grimoire-primary-button"
            disabled={!dirty || state === 'saving'}
            onClick={save}
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GrimoireWorkbench({
  entries,
  totalReadings,
  onClose,
  onDelete,
  onClear,
  onSelect,
  onExportBackup,
  onExportMarkdown,
  onImportBackup,
  onSetFavorite,
  onSaveNote,
  accentColor = '#dc2626',
}) {
  const dialogRef = useRef(null);
  const importInputRef = useRef(null);
  const searchRef = useRef(null);
  const [filters, setFilters] = useState(DEFAULT_GRIMOIRE_FILTERS);
  const [status, setStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [clearArmed, setClearArmed] = useState(false);
  const safeEntries = Array.isArray(entries) ? entries : [];

  const filteredEntries = useMemo(() => applyGrimoireFilters(safeEntries, filters), [safeEntries, filters]);
  const recurrence = useMemo(() => buildGrimoireRecurrence(safeEntries), [safeEntries]);
  const activeFilters = describeFilters(filters);
  const hasActiveFilters = activeFilters !== 'All saved consultations';

  const updateFilter = (patch) => setFilters((current) => normalizeGrimoireFilters({ ...current, ...patch }));
  const resetFilters = () => {
    setFilters(DEFAULT_GRIMOIRE_FILTERS);
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previous = document.activeElement;
    searchRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (editingId) {
          event.preventDefault();
          setEditingId(null);
          return;
        }
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      if (previous && document.contains(previous)) previous.focus?.();
    };
  }, [editingId, onClose]);

  useEffect(() => {
    if (!clearArmed) return undefined;
    const timeout = setTimeout(() => setClearArmed(false), 5000);
    return () => clearTimeout(timeout);
  }, [clearArmed]);

  const exportBackup = () => {
    try {
      const payload = onExportBackup?.();
      downloadTextFile(payload, 'application/json;charset=utf-8');
      setStatus({ type: 'success', text: `Exported ${payload.entryCount} saved consultation${payload.entryCount === 1 ? '' : 's'} as JSON.` });
    } catch (error) {
      setStatus({ type: 'error', text: error?.message || 'The JSON backup could not be exported.' });
    }
  };

  const exportMarkdown = (filtered) => {
    try {
      const payload = onExportMarkdown?.(filtered
        ? { selectedEntries: filteredEntries, filterDescription: activeFilters }
        : undefined);
      downloadTextFile(payload, 'text/markdown;charset=utf-8');
      setStatus({ type: 'success', text: `Exported ${payload.entryCount} consultation${payload.entryCount === 1 ? '' : 's'} as Markdown.` });
    } catch (error) {
      setStatus({ type: 'error', text: error?.message || 'The Markdown export could not be created.' });
    }
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: 'error', text: 'The selected backup is larger than the 2 MB import limit.' });
      return;
    }

    setStatus({ type: 'working', text: 'Reading and validating the backup…' });
    try {
      const result = await onImportBackup?.(await file.text());
      if (!result) throw new Error('The backup could not be imported.');
      let message = `Imported ${result.importedCount} new consultation${result.importedCount === 1 ? '' : 's'}.`;
      if (result.duplicateCount) message += ` Kept ${result.duplicateCount} existing local entr${result.duplicateCount === 1 ? 'y' : 'ies'}.`;
      if (result.omittedByCap) message += ' Retained the newest 50 consultations.';
      if (result.backupSourceVersion === 1) message += ' Migrated a version 1 backup to the current schema.';
      setStatus({ type: 'success', text: message });
    } catch (error) {
      setStatus({ type: 'error', text: error?.message || 'The selected file is not a valid Grimoire backup.' });
    }
  };

  const toggleFavorite = async (entry) => {
    try {
      await onSetFavorite?.(entry.id, !entry.favorite);
      setStatus({ type: 'success', text: entry.favorite ? 'Removed from favorites.' : 'Added to favorites.' });
    } catch {
      setStatus({ type: 'error', text: 'Favorite state could not be saved.' });
    }
  };

  const confirmClear = async () => {
    if (!clearArmed) {
      setClearArmed(true);
      setStatus({ type: 'info', text: 'Press Confirm clear within five seconds to remove saved consultations. Lifetime total remains.' });
      return;
    }
    await onClear?.();
    setClearArmed(false);
    setStatus({ type: 'success', text: 'Saved consultations cleared. Lifetime reading total preserved.' });
  };

  return (
    <div className="grimoire-workbench-layer">
      <button type="button" className="grimoire-workbench-scrim" aria-label="Close Grimoire" onClick={onClose} />
      <section
        ref={dialogRef}
        className="grimoire-workbench"
        role="dialog"
        aria-modal="true"
        aria-labelledby="grimoire-workbench-title"
        style={{ '--grimoire-accent': accentColor }}
      >
        <header className="grimoire-workbench-header">
          <div>
            <p className="grimoire-eyebrow">PRIVATE · LOCAL · OFFLINE</p>
            <h2 id="grimoire-workbench-title">☥ Grimoire Workbench</h2>
            <p>{totalReadings} lifetime readings · {safeEntries.length} saved · {filteredEntries.length} shown</p>
          </div>
          <button type="button" className="grimoire-close" aria-label="Close Grimoire" onClick={onClose}>×</button>
        </header>

        <div className="grimoire-workbench-toolbar" aria-label="Grimoire tools">
          <button type="button" onClick={exportBackup}>JSON backup</button>
          <button type="button" onClick={() => exportMarkdown(false)}>Markdown: all</button>
          <button type="button" disabled={!filteredEntries.length} onClick={() => exportMarkdown(true)}>Markdown: shown</button>
          <button type="button" onClick={() => importInputRef.current?.click()}>Import JSON</button>
          <input ref={importInputRef} type="file" accept="application/json,.json" onChange={importBackup} hidden />
          {safeEntries.length > 0 && (
            <button type="button" className={clearArmed ? 'danger' : ''} onClick={confirmClear}>
              {clearArmed ? 'Confirm clear' : 'Clear saved'}
            </button>
          )}
        </div>

        {status && (
          <div
            className="grimoire-status"
            role={status.type === 'error' ? 'alert' : 'status'}
            style={{ color: STATUS_COLORS[status.type] || STATUS_COLORS.info }}
          >
            {status.text}
          </div>
        )}

        <div className="grimoire-workbench-body">
          <aside className="grimoire-workbench-controls" aria-label="Search and filter Grimoire">
            <label className="grimoire-search-label" htmlFor="grimoire-search">Search the Workbench</label>
            <div className="grimoire-search-row">
              <input
                ref={searchRef}
                id="grimoire-search"
                type="search"
                value={filters.query}
                placeholder="Question, chapter, interpretation, note…"
                onChange={(event) => updateFilter({ query: event.target.value })}
              />
              {hasActiveFilters && <button type="button" onClick={resetFilters}>Reset</button>}
            </div>

            <fieldset className="grimoire-filter-group">
              <legend>Spread</legend>
              <div className="grimoire-segments">
                <SegmentedButton active={filters.spread === 'all'} onClick={() => updateFilter({ spread: 'all' })}>All</SegmentedButton>
                <SegmentedButton active={filters.spread === 'single'} onClick={() => updateFilter({ spread: 'single' })}>Single</SegmentedButton>
                <SegmentedButton active={filters.spread === 'triad'} onClick={() => updateFilter({ spread: 'triad' })}>Triad</SegmentedButton>
              </div>
            </fieldset>

            <div className="grimoire-filter-grid">
              <label>
                Chapter
                <select value={filters.chapter ?? ''} onChange={(event) => updateFilter({ chapter: event.target.value || null })}>
                  <option value="">All chapters</option>
                  {recurrence.map((item) => (
                    <option key={item.chapter} value={item.chapter}>Chapter {item.chapter}: {item.title || 'Untitled'}</option>
                  ))}
                </select>
              </label>
              <label>
                Sort
                <select value={filters.sort} onChange={(event) => updateFilter({ sort: event.target.value })}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
              <label>
                From
                <input type="date" value={filters.from || ''} onChange={(event) => updateFilter({ from: event.target.value || null })} />
              </label>
              <label>
                Through
                <input type="date" value={filters.to || ''} onChange={(event) => updateFilter({ to: event.target.value || null })} />
              </label>
            </div>

            <button
              type="button"
              className="grimoire-favorites-toggle"
              aria-pressed={filters.favoritesOnly}
              data-active={filters.favoritesOnly ? 'true' : 'false'}
              onClick={() => updateFilter({ favoritesOnly: !filters.favoritesOnly })}
            >
              ★ Favorites only
            </button>

            <section className="grimoire-recurrence" aria-labelledby="grimoire-recurrence-title">
              <div className="grimoire-section-heading">
                <h3 id="grimoire-recurrence-title">Recurrence</h3>
                <span>appearances / consultations</span>
              </div>
              {recurrence.length ? (
                <ol>
                  {recurrence.slice(0, 8).map((item) => (
                    <li key={item.chapter}>
                      <button type="button" onClick={() => updateFilter({ chapter: item.chapter })}>
                        <span>{formatChapterNumber(item.chapter)} · {item.title || 'Untitled'}</span>
                        <strong>{item.appearances} / {item.consultations}</strong>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : <p>No recurrence data yet.</p>}
            </section>
          </aside>

          <main className="grimoire-results" aria-label="Saved consultations">
            <div className="grimoire-results-heading">
              <div>
                <strong>{filteredEntries.length}</strong> result{filteredEntries.length === 1 ? '' : 's'}
                <span>{activeFilters}</span>
              </div>
            </div>

            {!safeEntries.length ? (
              <div className="grimoire-empty"><span>☉</span><p>No consultations have been saved yet.</p></div>
            ) : !filteredEntries.length ? (
              <div className="grimoire-empty"><span>∅</span><p>No saved consultations match these filters.</p><button type="button" onClick={resetFilters}>Reset filters</button></div>
            ) : (
              <div className="grimoire-entry-list">
                {filteredEntries.map((entry) => {
                  const recurrenceItem = recurrence.find((item) => item.chapter === entry.chapter);
                  const editing = editingId === entry.id;
                  return (
                    <article key={entry.id} className="grimoire-entry" data-favorite={entry.favorite ? 'true' : 'false'}>
                      <div className="grimoire-entry-topline">
                        <button
                          type="button"
                          className="grimoire-entry-open"
                          onClick={() => { onSelect?.(entry); onClose?.(); }}
                        >
                          <EntryChapterLabel entry={entry} />
                          <span className="grimoire-entry-question">{entry.question}</span>
                          <span className="grimoire-entry-meta">
                            {new Date(entry.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            {' · '}{entry.gematria ?? 0}
                            {' · '}{normalizeSpreadType(entry.spreadType) === 'triad' ? 'Triad' : 'Single'}
                            {recurrenceItem?.consultations > 1 ? ` · repeated ${recurrenceItem.consultations}×` : ''}
                          </span>
                        </button>
                        <div className="grimoire-entry-actions">
                          <button
                            type="button"
                            className="grimoire-favorite-button"
                            aria-label={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
                            aria-pressed={entry.favorite === true}
                            onClick={() => toggleFavorite(entry)}
                          >
                            {entry.favorite ? '★' : '☆'}
                          </button>
                          <button type="button" onClick={() => setEditingId(editing ? null : entry.id)}>
                            {editing ? 'Close note' : entry.note ? 'Edit note' : 'Add note'}
                          </button>
                          <button type="button" className="danger-text" aria-label={`Delete saved consultation for ${entry.title || `chapter ${entry.chapter}`}`} onClick={() => onDelete?.(entry.id)}>Delete</button>
                        </div>
                      </div>

                      {!editing && entry.note && <p className="grimoire-entry-note">{entry.note}</p>}
                      {editing && <NoteEditor entry={entry} onSave={onSaveNote} onCancel={() => setEditingId(null)} />}
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
