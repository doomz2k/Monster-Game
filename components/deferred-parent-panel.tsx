'use client';
import {
  useEffect,
  useState,
  type ComponentProps,
  type ComponentType,
} from 'react';
type Props = ComponentProps<typeof import('./parent-panel').ParentPanel>;

/** Keep the listening desk's full measurements out of the child's initial download. */
export function DeferredParentPanel(props: Props) {
  const [Panel, setPanel] = useState<ComponentType<Props> | null>(null),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void import('./parent-panel')
      .then((module) => {
        if (active) setPanel(() => module.ParentPanel);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (Panel) return <Panel {...props} />;
  return (
    <div className="parent-studio-loading">
      {failed ? (
        <>
          <output>
            The sound studio couldn’t open. Your adventure stays open.
          </output>
          <button
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try opening it again
          </button>
        </>
      ) : (
        <output>Opening the sound studio…</output>
      )}
    </div>
  );
}
