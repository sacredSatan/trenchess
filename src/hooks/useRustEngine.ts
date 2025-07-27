import { useState, useEffect } from 'react';
import init, { TrenchessEngine } from '../../rust-engine/pkg/rust_engine.js';

export function useRustEngine() {
  const [rustEngine, setRustEngine] = useState<TrenchessEngine | null>(null);
  const [wasmLoading, setWasmLoading] = useState(true);
  const [wasmError, setWasmError] = useState<string | null>(null);

  useEffect(() => {
    async function initWasm() {
      try {
        await init();
        const newEngine = new TrenchessEngine();
        setRustEngine(newEngine);
        setWasmLoading(false);
      } catch (err) {
        setWasmError(err instanceof Error ? err.message : 'Failed to load WASM');
        setWasmLoading(false);
      }
    }

    initWasm();
  }, []);

  return { rustEngine, wasmLoading, wasmError };
}
