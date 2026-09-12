'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { defaultPreferences, type GamePreferences } from '@/lib/preferences';
export const PreferencesContext = createContext({
  preferences: defaultPreferences(),
  reducedMotion: false,
});
export const useGamePreferences = () => useContext(PreferencesContext);
export function useMotionPreference(preferences: GamePreferences) {
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setSystemReduced(media.matches);
    change();
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return systemReduced || preferences.motion === 'reduced' || preferences.calm;
}
