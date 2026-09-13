import { freshProgress, type ProgressData } from './learning';
import {
  SAVE_KEY,
  BACKUP_KEY,
  loadRecoverableProgress,
  parseSavedProgress,
  readBackups,
  saveRecoverably,
  type SaveStorage,
} from './save-recovery';
export const PROFILES_KEY = 'monster-game-profiles-v1';
export const PROFILE_IDS = [
  'original',
  'friend-1',
  'friend-2',
  'friend-3',
] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];
export type ChildProfile = { id: ProfileId; name: string };
export type ProfileIndex = {
  version: 1;
  activeId: ProfileId;
  profiles: ChildProfile[];
};
const validId = (id: unknown): id is ProfileId =>
  PROFILE_IDS.includes(id as ProfileId);
export const defaultProfiles = (): ProfileIndex => ({
  version: 1,
  activeId: 'original',
  profiles: [{ id: 'original', name: 'Clover' }],
});
const nameFor = (name: unknown, fallback: string) =>
  typeof name === 'string'
    ? name
        // oxlint-disable-next-line no-control-regex -- Profile labels must not contain control characters.
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 24) || fallback
    : fallback;
/** Original keys stay exactly where they were; only additional adventures get prefixes. */
export function profileStorage(
  storage: SaveStorage,
  id: ProfileId,
): SaveStorage {
  if (!validId(id)) throw new Error('Choose a known adventure.');
  const key = (value: string) => {
    if (value !== SAVE_KEY && value !== BACKUP_KEY)
      throw new Error('This is not an adventure save key.');
    return id === 'original'
      ? value
      : 'monster-game-profile-' + id + ':' + value;
  };
  return {
    getItem: (value) => storage.getItem(key(value)),
    setItem: (value, data) => storage.setItem(key(value), data),
  };
}
export function readProfiles(storage: SaveStorage): ProfileIndex {
  const result = defaultProfiles();
  let data: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(storage.getItem(PROFILES_KEY) ?? 'null');
    if (parsed && parsed.version === 1 && !Array.isArray(parsed)) data = parsed;
  } catch {
    /* Known save namespaces below can recover a damaged list. */
  }
  if (data && Array.isArray(data.profiles))
    for (const value of data.profiles.slice(0, 16)) {
      if (!value || !validId(value.id)) continue;
      const index = result.profiles.findIndex((p) => p.id === value.id);
      const profile = {
        id: value.id,
        name: nameFor(
          value.name,
          value.id === 'original'
            ? 'Clover'
            : 'Monster ' + (PROFILE_IDS.indexOf(value.id) + 1),
        ),
      };
      if (index >= 0) result.profiles[index] = profile;
      else result.profiles.push(profile);
    }
  // Recover metadata after a failed list write; never overwrite an existing namespace.
  for (const id of PROFILE_IDS.slice(1)) {
    const scoped = profileStorage(storage, id);
    if (
      !result.profiles.some((p) => p.id === id) &&
      (scoped.getItem(SAVE_KEY) !== null || scoped.getItem(BACKUP_KEY) !== null)
    )
      result.profiles.push({
        id,
        name: 'Monster ' + (PROFILE_IDS.indexOf(id) + 1),
      });
  }
  result.profiles.sort(
    (a, b) => PROFILE_IDS.indexOf(a.id) - PROFILE_IDS.indexOf(b.id),
  );
  if (
    validId(data?.activeId) &&
    result.profiles.some((p) => p.id === data.activeId)
  )
    result.activeId = data.activeId;
  return result;
}
export function loadProfile(storage: SaveStorage, id: ProfileId) {
  const scoped = profileStorage(storage, id),
    raw = scoped.getItem(SAVE_KEY);
  if (raw) {
    try {
      return { progress: parseSavedProgress(raw), recovered: false };
    } catch {
      /* Try that child's recovery copies. */
    }
  }
  const backups = readBackups(scoped);
  if (backups.length) return { progress: backups[0].progress, recovered: true };
  if (raw !== null || scoped.getItem(BACKUP_KEY) !== null)
    throw new Error(
      'This adventure needs a valid recovery copy. Its stored files have been kept.',
    );
  return loadRecoverableProgress(scoped);
}
export function renameProfile(
  storage: SaveStorage,
  id: ProfileId,
  name: string,
) {
  const index = readProfiles(storage),
    profile = index.profiles.find((p) => p.id === id);
  if (!profile) throw new Error('Choose an existing adventure.');
  profile.name = nameFor(name, profile.name);
  storage.setItem(PROFILES_KEY, JSON.stringify(index));
  return index;
}
export function createProfile(storage: SaveStorage, name: string) {
  const index = readProfiles(storage),
    id = PROFILE_IDS.find((id) => !index.profiles.some((p) => p.id === id));
  if (!id) throw new Error('There is room for four adventures on this device.');
  const profile = {
    id,
    name: nameFor(name, 'Monster ' + (PROFILE_IDS.indexOf(id) + 1)),
  };
  saveRecoverably(profileStorage(storage, id), freshProgress());
  index.profiles.push(profile);
  storage.setItem(PROFILES_KEY, JSON.stringify(index));
  return { index, profile };
}
/** Save the current child before changing the selected profile. A failed write never switches. */
export function activateProfile(
  storage: SaveStorage,
  currentId: ProfileId,
  current: ProgressData | null,
  targetId: ProfileId,
) {
  const index = readProfiles(storage);
  if (!index.profiles.some((p) => p.id === targetId))
    throw new Error('Choose an existing adventure.');
  const saved = loadProfile(storage, targetId);
  if (current) saveRecoverably(profileStorage(storage, currentId), current);
  index.activeId = targetId;
  storage.setItem(PROFILES_KEY, JSON.stringify(index));
  return { index, ...saved };
}
