import { useState } from 'react';
import { Link } from 'react-router';
import { chapters, lessons } from '../../content/lessons';
import { mastered, type Progress } from './progress';
import type { Journey } from './journey';
export function CourseContents({
  chapter = 1,
  current,
  progress,
  journey,
}: {
  chapter?: number;
  current?: string;
  progress: Progress;
  journey: Journey;
}) {
  const [search, setSearch] = useState(''),
    [open, setOpen] = useState(false);
  const matches = lessons.filter((l) =>
    `${l.id.replace('-', '.')} ${l.title} ${chapters[l.chapter]}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <aside className="course-contents" aria-label="Course contents">
      <div className="contents-heading">
        <h2>Course contents</h2>
        <Link to="/learn">Overview</Link>
      </div>
      <button
        className="contents-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide chapter list' : 'Browse chapters & lessons'}
      </button>
      <div className={`contents-body ${open ? 'contents-open' : ''}`}>
        <label htmlFor="find-lesson">Find a lesson</label>
        <input
          id="find-lesson"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Try “outs” or “1.1”"
        />
        {[...chapters.keys()]
          .filter((c) => c > 0)
          .concat(0)
          .map((c) => {
            const found = matches.filter((l) => l.chapter === c);
            return found.length ? (
              <details
                key={`${c}-${chapter}-${!!search}`}
                open={!!search || c === chapter}
              >
                <summary>
                  {c === 0 ? 'Optional: poker basics' : `${c}. ${chapters[c]}`}
                </summary>
                {found.map((l) => (
                  <Link
                    key={l.id}
                    to={`/learn/${l.id}`}
                    aria-current={current === l.id ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span>
                      {l.id.replace('-', '.')} · {l.title}
                    </span>
                    <small>
                      {mastered(progress.results[l.id])
                        ? 'Quiz passed'
                        : journey.read.includes(l.id)
                          ? 'Read'
                          : ''}
                      {journey.played.includes(l.id) ? ' · Hand played' : ''}
                    </small>
                  </Link>
                ))}
              </details>
            ) : null;
          })}
        {!matches.length && <p>No lessons match. Try another word.</p>}
        <p className="hint">
          Read in order, or open any lesson. You can always come back.
        </p>
      </div>
    </aside>
  );
}
