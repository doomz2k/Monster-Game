import { freshProgress, readProgress, type ProgressData } from './learning';
export const SAVE_KEY = 'monster-game-progress-v1';
export const BACKUP_KEY = 'monster-game-backups-v1';
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type SaveBackup = { savedAt: string; progress: ProgressData };
/** Reject incompatible or broken files before migration can turn them into a fresh game. */
export function parseSavedProgress(raw: string): ProgressData {
  if (raw.length > 1_000_000) throw new Error('This save is too large.');
  const data = JSON.parse(raw);
  const p = data?.format === 'monster-game-save' ? data.progress : data;
  if (
    !p ||
    typeof p !== 'object' ||
    Array.isArray(p) ||
    p.version !== 1 ||
    !Array.isArray(p.completed) ||
    !p.rounds ||
    typeof p.rounds !== 'object'
  )
    throw new Error('Choose a Monster & Friends save file.');
  return readProgress(JSON.stringify(p));
}
export function readBackups(storage: SaveStorage): SaveBackup[] {
  try {
    const data = JSON.parse(storage.getItem(BACKUP_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.slice(0, 3).flatMap((v) => {
      try {
        if (
          typeof v.savedAt !== 'string' ||
          !Number.isFinite(Date.parse(v.savedAt))
        )
          return [];
        return [
          {
            savedAt: v.savedAt,
            progress: parseSavedProgress(JSON.stringify(v.progress)),
          },
        ];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
export function loadRecoverableProgress(storage: SaveStorage): {
  progress: ProgressData;
  recovered: boolean;
} {
  const raw = storage.getItem(SAVE_KEY);
  if (raw) {
    try {
      return { progress: parseSavedProgress(raw), recovered: false };
    } catch {
      /* Try the newest valid automatic copy. */
    }
  }
  const backup = readBackups(storage)[0];
  return backup
    ? { progress: backup.progress, recovered: true }
    : { progress: freshProgress(), recovered: false };
}
export function saveRecoverably(
  storage: SaveStorage,
  progress: ProgressData,
  now = new Date().toISOString(),
) {
  const next = JSON.stringify(progress),
    current = storage.getItem(SAVE_KEY);
  if (next === current) return;
  // Write the old valid state to recovery before replacing the primary save.
  // On quota failure, the existing primary remains untouched.
  if (current) {
    let old: ProgressData | null = null;
    try {
      old = parseSavedProgress(current);
    } catch {
      /* Never back up corruption. */
    }
    if (old) {
      const previous = readBackups(storage);
      const serial = JSON.stringify(old);
      const snapshots = [
        { savedAt: now, progress: old },
        ...previous.filter((v) => JSON.stringify(v.progress) !== serial),
      ].slice(0, 3);
      storage.setItem(BACKUP_KEY, JSON.stringify(snapshots));
    }
  }
  storage.setItem(SAVE_KEY, next);
}
export function exportSave(progress: ProgressData) {
  return JSON.stringify(
    {
      format: 'monster-game-save',
      exportedAt: new Date().toISOString(),
      progress,
    },
    null,
    2,
  );
}
