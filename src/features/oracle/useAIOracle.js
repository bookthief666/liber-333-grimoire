import { useCallback, useRef, useState } from 'react';
import { streamOracleInterpretation } from '../../api.js';
import { createSingleOracleRequest, createTriadOracleRequest } from './oracleRequest.js';

const INITIAL_ORACLE_STATE = {
  loading: false,
  streaming: false,
  thinking: false,
  text: null,
  error: null,
};

export function useAIOracle() {
  const [oracleState, setOracleState] = useState(INITIAL_ORACLE_STATE);
  const abortRef = useRef(null);

  const consultOracle = useCallback(async (question, chapter, _gematria, _correspondences, context = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setOracleState({ loading: true, streaming: false, thinking: false, text: null, error: null });

    const request = createSingleOracleRequest({ question, chapter, context });

    try {
      let acc = '';
      const text = await streamOracleInterpretation({
        request,
        signal: controller.signal,
        onThinking: (active) => {
          if (controller.signal.aborted) return;
          setOracleState((state) => ({ ...state, thinking: active }));
        },
        onToken: (chunk) => {
          if (controller.signal.aborted) return;
          acc += chunk;
          setOracleState((state) => ({ ...state, loading: false, streaming: true, thinking: false, text: acc }));
        },
      });

      if (controller.signal.aborted) return;
      setOracleState({ loading: false, streaming: false, thinking: false, text, error: null });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setOracleState({ loading: false, streaming: false, thinking: false, text: null, error: error.message });
    }
  }, []);

  const consultSpread = useCallback(async (question, chapters, _gematria, _correspondences, context = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setOracleState({ loading: true, streaming: false, thinking: false, text: null, error: null });

    const request = createTriadOracleRequest({ question, chapters, context });

    try {
      let acc = '';
      const text = await streamOracleInterpretation({
        request,
        signal: controller.signal,
        onThinking: (active) => {
          if (controller.signal.aborted) return;
          setOracleState((state) => ({ ...state, thinking: active }));
        },
        onToken: (chunk) => {
          if (controller.signal.aborted) return;
          acc += chunk;
          setOracleState((state) => ({ ...state, loading: false, streaming: true, thinking: false, text: acc }));
        },
      });
      if (controller.signal.aborted) return;
      setOracleState({ loading: false, streaming: false, thinking: false, text, error: null });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setOracleState({ loading: false, streaming: false, thinking: false, text: null, error: error.message });
    }
  }, []);

  const resetOracle = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setOracleState({ loading: false, streaming: false, thinking: false, text: null, error: null });
  }, []);

  return { ...oracleState, consultOracle, consultSpread, resetOracle };
}
