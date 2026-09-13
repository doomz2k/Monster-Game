'use client';
import { useState } from 'react';
import { Check, UserRound, Plus } from 'lucide-react';
import type { ProgressData } from '@/lib/learning';
import {
  readProfiles,
  defaultProfiles,
  renameProfile,
  createProfile,
  activateProfile,
  type ProfileId,
} from '@/lib/profiles';
export function ProfilePanel({
  currentId,
  progress,
  onRestart,
}: {
  currentId: ProfileId;
  progress: ProgressData | null;
  onRestart: () => void;
}) {
  const [index, setIndex] = useState(() => {
    try {
      return readProfiles(localStorage);
    } catch {
      return defaultProfiles();
    }
  });
  const [name, setName] = useState(''),
    [rename, setRename] = useState(
      index.profiles.find((p) => p.id === currentId)?.name ?? '',
    ),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const action = (run: () => void) => {
    try {
      run();
    } catch (e) {
      setBusy(false);
      setMessage(
        e instanceof Error
          ? e.message
          : 'This device could not save the change.',
      );
      try {
        setIndex(readProfiles(localStorage));
      } catch {
        /* Keep the current view when storage is unavailable. */
      }
    }
  };
  const open = (id: ProfileId) =>
    action(() => {
      setBusy(true);
      activateProfile(localStorage, currentId, progress, id);
      onRestart();
    });
  return (
    <details className="profile-panel" data-parent-controls>
      <summary>
        Adventures on this device ·{' '}
        {index.profiles.find((p) => p.id === currentId)?.name ??
          'Current adventure'}
      </summary>
      <p>
        Each child has their own monster, stars, house, garden and practice.
        Opening another adventure saves this one and returns to the welcome
        screen. Sound-recording approvals and master mute are shared on this
        device.
      </p>
      <div className="profile-list">
        {index.profiles.map((profile, i) => (
          <div className="profile-row" key={profile.id}>
            <span className={'profile-badge profile-colour-' + i}>
              <UserRound />
            </span>
            <strong>{profile.name}</strong>
            {profile.id === currentId ? (
              <span className="profile-current">
                <Check />
                Playing now
              </span>
            ) : (
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => open(profile.id)}
              >
                Open {profile.name}
              </button>
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          action(() => {
            setIndex(renameProfile(localStorage, currentId, rename));
            setMessage('Adventure name saved.');
          });
        }}
      >
        <label>
          Current adventure name
          <input
            maxLength={24}
            value={rename}
            onChange={(e) => setRename(e.target.value)}
          />
        </label>
        <button
          className="secondary-button"
          disabled={busy || !rename.trim()}
          type="submit"
        >
          Save name
        </button>
      </form>
      {index.profiles.length < 4 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            action(() => {
              const created = createProfile(localStorage, name);
              setIndex(created.index);
              setName('');
              setMessage(
                created.profile.name +
                  ' is ready. Choose Open when you want to play.',
              );
            });
          }}
        >
          <label>
            Another adventure name
            <input
              maxLength={24}
              value={name}
              placeholder={'Monster ' + (index.profiles.length + 1)}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button className="secondary-button" type="submit" disabled={busy}>
            <Plus />
            Add adventure
          </button>
        </form>
      )}
      <p className="profile-local-note">
        Up to four adventures, stored in this browser. Export a save from each
        adventure to keep a separate copy.
      </p>
      {message && <output className="profile-message">{message}</output>}
    </details>
  );
}
