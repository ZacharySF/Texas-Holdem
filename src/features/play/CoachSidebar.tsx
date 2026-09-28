import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { HandGuide } from './HandGuide';
import type { Game } from '../../engine/game';

export function CoachSidebar({
  game,
  guided,
  odds,
  feedback,
  course,
}: {
  game: Game;
  guided: boolean;
  odds: ReactNode;
  feedback: string;
  course?: ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState<'help' | 'odds' | 'review'>('help');
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
            <span className="eyebrow">HERE WHEN YOU NEED A HAND</span>
            <h2>Your coach</h2>
          </div>
          <button className="close-coach" onClick={close}>
            Back to table
          </button>
        </header>
        <p className="coach-intro">
          Take your time. I’ll explain the hand. You make the decision.
        </p>
        <div className="coach-tabs" role="group" aria-label="Coach topics">
          {(['help', 'odds', 'review'] as const).map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t === 'help'
                ? 'Explain the hand'
                : t === 'odds'
                  ? 'Odds & why'
                  : 'Last decision'}
            </button>
          ))}
        </div>
        <div className="coach-topic">
          {tab === 'help' && (
            <>
              {course}
              {guided ? (
                <HandGuide key={game.config.seed} game={game} />
              ) : (
                <p>
                  Turn on “Walk me through the hand” above the table for
                  step-by-step tips. You can still explore the odds or review
                  your last decision here.
                </p>
              )}
              <details className="poker-dictionary">
                <summary>What do the poker words mean?</summary>
                <dl>
                  <dt>Pot</dt>
                  <dd>The chips everyone is playing for in this hand.</dd>
                  <dt>Check</dt>
                  <dd>
                    Stay in without adding chips, when no extra chips are owed.
                  </dd>
                  <dt>Call</dt>
                  <dd>Match the current price to stay in the hand.</dd>
                  <dt>Raise</dt>
                  <dd>
                    Increase the bet. “Raise to” is your total for this betting
                    round.
                  </dd>
                  <dt>Fold</dt>
                  <dd>
                    Leave this hand. Chips already put in stay in the pot.
                  </dd>
                  <dt>Equity</dt>
                  <dd>
                    Your average share of the pot across possible outcomes,
                    including ties.
                  </dd>
                  <dt>Outs</dt>
                  <dd>
                    Cards that meet a stated goal, such as making a flush.
                    Completing a draw does not always win.
                  </dd>
                </dl>
              </details>
            </>
          )}
          {tab === 'odds' && (
            <>
              <h3>What might happen?</h3>
              <p>
                These estimates use your cards, the shared cards, and guesses
                about what opponents might hold. The coach cannot see their
                hidden cards.
              </p>
              {odds}
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
