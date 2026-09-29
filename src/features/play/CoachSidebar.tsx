import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { ReactNode } from 'react';

export function CoachSidebar({
  odds,
  feedback,
  course,
}: {
  odds: (topic: 'odds' | 'equity') => ReactNode;
  feedback: string;
  course?: ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState<'odds' | 'equity' | 'review'>('odds');
  const panel = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <>
      <button
        ref={trigger}
        className="mobile-coach-button"
        aria-expanded={open}
        aria-controls="table-coach"
        onClick={() => setOpen(true)}
      >
        Open coach · help with this hand
      </button>
      <aside
        ref={panel}
        id="table-coach"
        className={`coach-sidebar ${open ? 'coach-is-open' : ''}`}
        aria-label="Table coach"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) close();
        }}
      >
        <header>
          <div>
            <h2>Your coach</h2>
          </div>
          <button className="close-coach" onClick={close}>
            Back to table
          </button>
        </header>
        <p className="coach-intro">
          The price to stay in. How the numbers work.
        </p>
        <div className="coach-tabs" role="group" aria-label="Coach topics">
          {(['odds', 'equity', 'review'] as const).map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t === 'odds'
                ? 'Pot odds'
                : t === 'equity'
                  ? 'Equity'
                  : 'Last decision'}
            </button>
          ))}
        </div>
        <div className="coach-topic">
          {tab !== 'review' && (
            <>
              {course}
              <p>
                These estimates use your cards, the shared cards, and guesses
                about what opponents might hold. The coach cannot see their
                hidden cards.
              </p>
              {odds(tab)}
              <p>
                <Link to="/lab/charts">Hand charts & poker reference →</Link>
              </p>
            </>
          )}
          {tab === 'review' && (
            <>
              <h3>Your last choice</h3>
              <p>
                {feedback ||
                  'Make a decision first. When an estimate is ready, I’ll compare your choice with the simple model here.'}
              </p>
              <p className="hint">
                A model grade is not a verdict. Later bets and different
                opponent hands can change the result.
              </p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
