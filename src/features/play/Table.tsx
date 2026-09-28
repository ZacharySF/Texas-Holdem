import type { Persona } from '../../engine/bots';
import { evaluateReference } from '../../engine/evaluator';
import { potSize, type Game, type Action } from '../../engine/game';
import { PlayingCards } from '../../ui/PlayingCards';

const names = ['You', 'River', 'Jules', 'Ash', 'Morgan', 'Quinn'];
export const seatName = (seat: number) => names[seat] ?? `Seat ${seat + 1}`;
export const botStyles: Record<Persona, { name: string; description: string }> =
  {
    'tight-passive': {
      name: 'The patient player',
      description:
        'Selective with starting hands. Usually prefers calling to raising.',
    },
    'loose-aggressive': {
      name: 'The pressure player',
      description: 'Plays more hands and puts you to the test with raises.',
    },
    'calling-station': {
      name: 'The curious caller',
      description: 'Likes to see another card. Expect fewer folds.',
    },
    'equity-driven': {
      name: 'The calculator',
      description:
        'Weighs estimated hand strength against the price of a call.',
    },
  };
export function actionText(action: Action) {
  return action.type === 'raise'
    ? `Raised to ${action.to}`
    : { fold: 'Folded', check: 'Checked', call: 'Called' }[action.type];
}
export function Table({ game, persona }: { game: Game; persona: Persona }) {
  const total = game.complete
    ? game.finalContributions.reduce((a, b) => a + b, 0)
    : potSize(game);
  const last = game.history.at(-1);
  return (
    <section
      className={`felt-table table-${game.players.length}${game.runouts ? ' has-runouts' : ''}`}
      aria-label="Poker table"
    >
      <div className="table-brand" aria-hidden="true">
        MONTE CARLO ♠
      </div>
      <div className="table-center">
        <span className="eyebrow">
          {game.complete ? 'HAND COMPLETE' : game.street.toUpperCase()}
        </span>
        <div className="community-cards">
          <PlayingCards cards={game.board} />
          {Array.from({ length: 5 - game.board.length }, (_, i) => (
            <span className="board-slot" key={i} aria-hidden="true">
              ♠
            </span>
          ))}
        </div>
        {game.runouts && (
          <div>
            <p className="runout-label">Second runout</p>
            <PlayingCards cards={game.runouts[1]} />
          </div>
        )}
        <span className="pot-chip">
          {game.complete ? 'Final pot' : 'Pot'}{' '}
          <strong>{total.toLocaleString()}</strong>
        </span>
        <p className="table-status" role="status">
          {game.complete
            ? `Hand over. You receive ${game.awards[0]} chips from the matched pots.`
            : game.actor === 0
              ? 'Your turn'
              : `${seatName(game.actor)} is thinking…`}
        </p>
      </div>
      {game.players.map((player, seat) => {
        const latest = [...game.history].reverse().find((h) => h.seat === seat);
        return (
          <div
            key={seat}
            data-seat={seat}
            className={`seat ${seat === 0 ? 'hero-seat' : 'bot-seat'} ${!game.complete && game.actor === seat ? 'acting' : ''} ${player.folded ? 'folded' : ''} ${game.complete && game.awards[seat] > 0 ? 'winner' : ''}`}
          >
            <div className="seat-identity">
              <span className="seat-avatar" aria-hidden="true">
                {seatName(seat).slice(0, 1)}
              </span>
              <div>
                <h2>
                  {seatName(seat)}{' '}
                  {game.config.button === seat && (
                    <span
                      className="dealer-button"
                      title="Dealer button"
                      aria-label="Dealer button"
                    >
                      D
                    </span>
                  )}
                </h2>
                <span className="seat-stack">
                  {player.stack.toLocaleString()} chips
                </span>
              </div>
            </div>
            <PlayingCards
              cards={seat === 0 || game.complete ? player.hand : []}
              hidden={seat !== 0 && !game.complete ? 2 : 0}
            />
            <span className="seat-action">
              {player.folded
                ? 'Folded'
                : game.complete && game.awards[seat] > 0
                  ? `Won ${game.awards[seat]}`
                  : player.stack === 0
                    ? 'All in'
                    : latest
                      ? actionText(latest.action)
                      : seat === 0
                        ? 'Your hole cards'
                        : botStyles[persona].name}
            </span>
            {player.round > 0 && !game.complete && (
              <span className="seat-bet">● {player.round} in front</span>
            )}
          </div>
        );
      })}
      <div className="table-caption">
        {game.board.length >= 3 && !game.players[0].folded && (
          <span>
            Your hand:{' '}
            {evaluateReference([...game.players[0].hand, ...game.board]).name}
          </span>
        )}
        {last && (
          <span>
            {seatName(last.seat)} · {actionText(last.action)}
          </span>
        )}
      </div>
    </section>
  );
}
