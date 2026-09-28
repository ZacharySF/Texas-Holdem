import { lazy, Suspense, useEffect, useState } from 'react';
import {
  HashRouter,
  useLocation,
  NavLink,
  Navigate,
  Route,
  Routes,
} from 'react-router';
import { Lab } from './features/lab/Lab';
const DecisionDrills = lazy(() => import('./features/arcade/DecisionDrills'));
const EventBuilder = lazy(() => import('./features/lab/EventBuilder'));
const BankrollLab = lazy(() => import('./features/lab/BankrollLab'));
const RangeLab = lazy(() => import('./features/lab/RangeLab'));
const Stats = lazy(() => import('./features/stats/Stats'));
const Arcade = lazy(() => import('./features/arcade/OutsRush'));
const Play = lazy(() => import('./features/play/Play'));
const Learn = lazy(() => import('./features/learn/Learn'));
const ShuffleLab = lazy(() => import('./features/lab/ShuffleLab'));
const FinalCalculators = lazy(() => import('./features/lab/FinalCalculators'));
const StreakTrap = lazy(() => import('./features/arcade/StreakTrap'));
const Akq = lazy(() => import('./features/arcade/Akq'));
interface Settings {
  theme: 'dark' | 'light';
  fourColor: boolean;
}
function readSettings(): Settings {
  try {
    const s: unknown = JSON.parse(
      localStorage.getItem('holdem-settings') ?? 'null',
    );
    if (
      s &&
      typeof s === 'object' &&
      'theme' in s &&
      'fourColor' in s &&
      (s.theme === 'dark' || s.theme === 'light') &&
      typeof s.fourColor === 'boolean'
    )
      return s as Settings;
  } catch {
    /* Storage may be unavailable. */
  }
  return { theme: 'dark', fourColor: false };
}
const modes = [
  ['play', 'Play', 3],
  ['learn', 'Course', 2],
  ['arcade', 'Drills', 4],
  ['lab', 'Tools', 1],
  ['stats', 'Progress', 6],
] as const;
function ToolNavigation() {
  const { pathname } = useLocation();
  const links = pathname.startsWith('/lab')
    ? [
        ['/lab', 'Equity'],
        ['/lab/events', 'Event builder'],
        ['/lab/bankroll', 'Bankroll paths'],
        ['/lab/ranges', 'Ranges'],
        ['/lab/shuffle', 'Shuffle Lab'],
        ['/lab/tools/insurance', 'Insurance'],
        ['/lab/tools/push', 'Push/fold'],
        ['/lab/tools/icm', 'ICM'],
        ['/lab/tools/sizing', 'Kelly'],
      ]
    : pathname.startsWith('/arcade')
      ? [
          ['/arcade', 'Outs Rush'],
          ['/arcade/call', 'Call or Fold'],
          ['/arcade/guess', 'Guess the Equity'],
          ['/arcade/combo', 'Combo Counter'],
          ['/arcade/streak', 'Streak Trap'],
          ['/arcade/akq', 'AKQ game'],
        ]
      : [];
  const help = pathname.startsWith('/lab')
    ? 'Tools let you explore a specific poker question. Choose one below, or follow the course for a guided introduction.'
    : pathname.startsWith('/arcade')
      ? 'Drills are short games for practicing one skill at a time. Pick a game below; your scores are saved on this device.'
      : pathname.startsWith('/stats')
        ? 'Your completed hands and forecasts appear here. Play a hand or finish a drill to start building your history.'
        : '';
  return (
    <>
      {help && (
        <div className="mode-guide">
          <p>{help}</p>
          <NavLink to="/learn">Find your next lesson →</NavLink>
        </div>
      )}
      {links.length ? (
        <nav className="tool-nav" aria-label="Tools">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end>
              {label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </>
  );
}
export function App() {
  const [settings, setSettings] = useState(readSettings);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.fourColor = String(settings.fourColor);
    try {
      localStorage.setItem('holdem-settings', JSON.stringify(settings));
    } catch {
      /* Keep settings in memory when storage is blocked. */
    }
  }, [settings]);
  return (
    <HashRouter>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="app-header">
        <NavLink to="/play" className="brand">
          <span className="brand-mark">♠</span>
          <span>
            MONTE CARLO<strong>HOLD'EM</strong>
          </span>
        </NavLink>
        <nav aria-label="Main navigation">
          {modes.map(([path, name]) => (
            <NavLink key={path} to={`/${path}`}>
              {name}
            </NavLink>
          ))}
        </nav>
        <details className="settings">
          <summary>Display</summary>
          <div>
            <label>
              <input
                type="checkbox"
                checked={settings.theme === 'light'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    theme: e.target.checked ? 'light' : 'dark',
                  })
                }
              />{' '}
              Light theme
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.fourColor}
                onChange={(e) =>
                  setSettings({ ...settings, fourColor: e.target.checked })
                }
              />{' '}
              Four-color deck
            </label>
          </div>
        </details>
      </header>
      <div id="main-content" tabIndex={-1}>
        <ToolNavigation />
        <Routes>
          <Route
            path="/lab/shuffle"
            element={
              <Suspense fallback={<p>Loading…</p>}>
                <ShuffleLab />
              </Suspense>
            }
          />
          <Route
            path="/lab/tools/:calculator"
            element={
              <Suspense fallback={<p>Loading…</p>}>
                <FinalCalculators />
              </Suspense>
            }
          />
          <Route
            path="/arcade/streak"
            element={
              <Suspense fallback={<p>Loading…</p>}>
                <StreakTrap />
              </Suspense>
            }
          />
          <Route
            path="/arcade/akq"
            element={
              <Suspense fallback={<p>Loading…</p>}>
                <Akq />
              </Suspense>
            }
          />

          <Route path="/lab" element={<Lab />} />
          <Route
            path="/play"
            element={
              <Suspense fallback={<p>Loading table…</p>}>
                <Play />
              </Suspense>
            }
          />
          <Route
            path="/learn"
            element={
              <Suspense fallback={<p>Loading course…</p>}>
                <Learn />
              </Suspense>
            }
          />
          <Route
            path="/learn/:lessonId"
            element={
              <Suspense fallback={<p>Loading lesson…</p>}>
                <Learn />
              </Suspense>
            }
          />
          <Route
            path="/arcade"
            element={
              <Suspense fallback={<p>Loading Outs Rush…</p>}>
                <Arcade />
              </Suspense>
            }
          />
          <Route
            path="/stats"
            element={
              <Suspense fallback={<p>Loading Stats…</p>}>
                <Stats />
              </Suspense>
            }
          />
          <Route
            path="/arcade/:drill"
            element={
              <Suspense fallback={<p>Loading drill…</p>}>
                <DecisionDrills />
              </Suspense>
            }
          />
          <Route
            path="/lab/events"
            element={
              <Suspense fallback={<p>Loading event builder…</p>}>
                <EventBuilder />
              </Suspense>
            }
          />
          <Route
            path="/lab/bankroll"
            element={
              <Suspense fallback={<p>Loading simulator…</p>}>
                <BankrollLab />
              </Suspense>
            }
          />
          <Route
            path="/lab/ranges"
            element={
              <Suspense fallback={<p>Loading range editor…</p>}>
                <RangeLab />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/play" replace />} />
        </Routes>
      </div>
      <footer className="app-footer">
        <span>MONTE CARLO HOLD'EM</span>
        <span>Count it. Deal it. Understand it.</span>
      </footer>
    </HashRouter>
  );
}
