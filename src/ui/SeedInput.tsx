import { useState } from 'react';
import { Rng } from '../engine/rng';
export function SeedInput({
  seed,
  onCommit,
}: {
  seed: string;
  onCommit: (seed: string) => void;
}) {
  const [draft, setDraft] = useState(seed),
    [error, setError] = useState('');
  function commit() {
    try {
      new Rng(draft);
      setError('');
      if (draft !== seed) onCommit(draft);
    } catch {
      setDraft(seed);
      setError('Seed unchanged. Use 32 hexadecimal digits, not all zero.');
    }
  }
  return (
    <>
      <input
        id="seed"
        value={draft}
        spellCheck={false}
        maxLength={32}
        aria-invalid={!!error}
        aria-describedby={error ? 'seed-error' : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          setError('');
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
      />
      {error && (
        <p id="seed-error" role="alert" className="error">
          {error}
        </p>
      )}
    </>
  );
}
