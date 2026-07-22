import { useCallback, useRef, useState } from 'react';
import { streamOracleInterpretation } from '../../api.js';
import { buildSingleOraclePrompt, buildTriadOraclePrompt } from './oraclePrompts.js';

const INITIAL_ORACLE_STATE = {
  loading: false,
  streaming: false,
  thinking: false,
  text: null,
  error: null,
};

export function useAIOracle(planetaryData = {}) {
  const [oracleState, setOracleState] = useState(INITIAL_ORACLE_STATE);
  const abortRef = useRef(null);

  const consultOracle = useCallback(async (question, chapter, gematria, correspondences, context = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setOracleState({ loading: true, streaming: false, thinking: false, text: null, error: null });

    const { prompt, systemPrompt } = buildSingleOraclePrompt({
      question,
      chapter,
      gematria,
      correspondences,
      context,
      planetaryData,
    });

    try {
      let acc = '';
      const text = await streamOracleInterpretation({
        prompt,
        systemPrompt,
        signal: controller.signal,
        onThinking: (active) => {
          if (controller.signal.aborted) return;
          setOracleState((state) => ({ ...state, thinking: active }));
        },
        onToken: (chunk) => {
          if (controller.signal.aborted) return;
          acc += chunk;
          // First token: the Oracle begins to speak — leave the loading veil.
          setOracleState((state) => ({ ...state, loading: false, streaming: true, thinking: false, text: acc }));
        },
      });

      if (controller.signal.aborted) return;
      setOracleState({ loading: false, streaming: false, thinking: false, text, error: null });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setOracleState({ loading: false, streaming: false, thinking: false, text: null, error: error.message });
    }
  }, [planetaryData]);

  const consultSpread = useCallback(async (question, chapters, gematria, correspondences, context = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setOracleState({ loading: true, streaming: false, thinking: false, text: null, error: null });

    const { prompt, systemPrompt } = buildTriadOraclePrompt({
      question,
      chapters,
      gematria,
      correspondences,
      context,
      planetaryData,
    });

    try {
      let acc = '';
      const text = await streamOracleInterpretation({
        prompt,
        systemPrompt,
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
  }, [planetaryData]);

  const resetOracle = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setOracleState({ loading: false, streaming: false, thinking: false, text: null, error: null });
  }, []);

  return { ...oracleState, consultOracle, consultSpread, resetOracle };
}
