import { useState } from 'react';
import { Link } from 'react-router';
import { legalActions, type Game } from '../../engine/game';
import { seatName } from './Table';

const stages = ['preflop', 'flop', 'turn', 'river'] as const;
const guidance = {
  preflop: {
    title: 'Start with your two cards',
    text: 'These cards belong only to you. The blinds start the pot. Stay in by matching the bet, raise to put in more, or fold to leave this hand.',
    lesson: '0-1',
  },
  flop: {
    title: 'Meet the shared cards',
    text: 'Everyone can use these three cards. Combine them with your hole cards to make your best five-card hand. Ask what helped you—and what could help an opponent.',
    lesson: '7-2',
  },
  turn: {
    title: 'One card still to come',
    text: 'The fourth shared card is out. If you are waiting for a straight or a flush, think about which river cards would complete it. Making your draw does not guarantee a win.',
    lesson: '8-1',
  },
  river: {
    title: 'Make your final decision',
    text: 'There are no more cards to come. Compare the price of staying in with what your opponent might hold. A raise can mean strength or a bluff.',
    lesson: '12-2',
  },
};
export function HandGuide({ game }: { game: Game }) {
  const [expanded, setExpanded] = useState(true);
  const step = guidance[game.street],
    legal = legalActions(game);
  const done = game.complete;
  return (
    <aside className="hand-guide" aria-label="Hand walkthrough">
      <div className="guide-heading">
        <span className="coach-avatar" aria-hidden="true">
          ♠
        </span>
        <div>
          <span className="eyebrow">YOUR TABLE COACH</span>
          <h2>{done ? 'One hand is one piece of the story' : step.title}</h2>
        </div>
        <button aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide tip' : 'Show tip'}
        </button>
      </div>
      <ol className="street-progress" aria-label="Hand stages">
        {stages.map((stage) => (
          <li
            key={stage}
            className={
              stages.indexOf(stage) <= stages.indexOf(game.street)
                ? 'reached'
                : ''
            }
            aria-current={!done && stage === game.street ? 'step' : undefined}
          >
            {stage === 'preflop' ? 'Your cards' : stage}
          </li>
        ))}
      </ol>
      {expanded && (
        <>
          <p>
            {done
              ? game.players[0].folded
                ? 'You folded and kept the rest of your stack. Folding is part of poker. Review the action if you want, then take a fresh hand.'
                : 'The chips have been settled. A good decision can lose a hand, and a risky one can win. Review the decisions separately from the result.'
              : step.text}
          </p>
          {!done && (
            <p className="guide-prompt">
              {game.players[0].folded
                ? 'You are out of this hand. Watch the remaining players finish, then take the next deal.'
                : game.players[0].stack === 0
                  ? 'You are all in. Your chips are committed; watch the remaining action and the runout.'
                  : game.actor !== 0
                    ? `Watch ${seatName(game.actor)}. Their action changes the decision you face next.`
                    : legal.canCheck
                      ? `You can check: stay in without adding chips.${legal.canRaise ? ' Or add chips to put pressure on the other players.' : ''}`
                      : `It costs ${legal.toCall} chips to call. Fold keeps your remaining chips; call matches the price.${legal.canRaise ? ' A raise increases it.' : ' Raising is not available on this turn.'}`}
            </p>
          )}
          <details>
            <summary>Explore this idea</summary>
            <p>
              Opening a lesson leaves this table. Finish the hand first to save
              it.
            </p>
            <Link to={`/learn/${done ? '14-2' : step.lesson}`}>
              Open the related lesson →
            </Link>
          </details>
        </>
      )}
    </aside>
  );
}
