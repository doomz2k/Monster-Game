'use client';
import {
  PRACTICE_SKILLS,
  type PracticeLog,
  type PracticeSkill,
  type PracticeRecord,
} from '@/lib/practice';
import script from '@/lib/audio-data/adventure-script.json';

function detail(q: PracticeRecord) {
  if (q.skill === 'addition' || q.skill === 'subtraction')
    return q.concept.replace(/([+−])/g, ' $1 ');
  if (q.skill === 'counting') return 'Count ' + q.concept.replace('count-', '');
  if (q.skill === 'patterns') return q.concept.toUpperCase() + ' pattern';
  if (q.skill === 'sounds') return 'Sound: ' + q.concept;
  if (q.skill === 'blending') return 'Word: ' + q.concept;
  return (
    (script as Record<string, { text: string }>)[q.concept]?.text ??
    'Space picture question'
  );
}

export function PracticeSummary({ log }: { log: PracticeLog }) {
  const skills = (Object.keys(PRACTICE_SKILLS) as PracticeSkill[]).filter(
      (id) => log.skills[id].attempts > 0,
    ),
    finished = skills.reduce((n, id) => n + log.skills[id].finished, 0),
    recent = log.questions
      .filter((q) => q.attempts > 0)
      .slice(-8)
      .reverse();
  return (
    <details className="practice-summary" data-parent-controls>
      <summary>
        Practice on this device <span>{finished} finished</span>
      </summary>
      <p className="practice-explanation">
        Answers recorded during play, with the pictures, examples and sound
        prompts that the game provides. Earlier play is not included. This
        record stays in this browser and is included in your adventure backups.
      </p>
      {skills.length === 0 ? (
        <p className="practice-empty">
          The next activity will start this record. Pizza toppings count as
          separate questions; a finished pizza still earns its usual reward.
        </p>
      ) : (
        <>
          <div className="practice-skills">
            {skills.map((id) => {
              const s = log.skills[id],
                info = PRACTICE_SKILLS[id];
              return (
                <section
                  key={id}
                  className="practice-skill"
                  aria-label={info.name + ' practice'}
                >
                  <h4>{info.name}</h4>
                  <dl>
                    <div>
                      <dt>Questions finished</dt>
                      <dd>{s.finished}</dd>
                    </div>
                    <div>
                      <dt>Matched on first answer</dt>
                      <dd>{s.firstTry}</dd>
                    </div>
                    <div>
                      <dt>Matched after another try</dt>
                      <dd>{s.finished - s.firstTry}</dd>
                    </div>
                    {s.examples > 0 && (
                      <div>
                        <dt>With an example replay</dt>
                        <dd>{s.examples}</dd>
                      </div>
                    )}
                    {s.adultModel > 0 && (
                      <div>
                        <dt>Adult sound prompt shown</dt>
                        <dd>{s.adultModel}</dd>
                      </div>
                    )}
                  </dl>
                  <p>Practise with {info.where}.</p>
                </section>
              );
            })}
          </div>
          <h4>Recent questions</h4>
          <ol className="practice-recent">
            {recent.map((q) => (
              <li key={q.key}>
                <div>
                  <strong>{q.title}</strong>
                  <span>{detail(q)}</span>
                </div>
                <p>
                  {q.complete
                    ? q.attempts === 1
                      ? 'Matched on first answer'
                      : 'Matched after another try'
                    : 'Still exploring'}
                  {(!q.complete || q.attempts > 1) &&
                    ` · ${q.attempts} answer ${q.attempts === 1 ? 'attempt' : 'attempts'}`}
                  {q.example ? ' · Example replayed' : ''}
                  {q.adultModel ? ' · Adult sound prompt shown' : ''}
                </p>
              </li>
            ))}
          </ol>
          <p className="practice-explanation">
            “Adult sound prompt” means the game asked a grown-up to model a
            sound. First-answer matches may use the pictures and examples.
            Repeated confirm presses on the same unchanged answer count once. A
            pizza recipe records three topping questions.
          </p>
        </>
      )}
    </details>
  );
}
