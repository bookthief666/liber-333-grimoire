import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

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
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
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
