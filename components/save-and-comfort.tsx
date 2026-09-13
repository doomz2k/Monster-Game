'use client';
import { useState } from 'react';
import type { ProgressData } from '@/lib/learning';
import {
  exportSave,
  parseSavedProgress,
  readBackups,
  saveRecoverably,
  type SaveBackup,
} from '@/lib/save-recovery';
import type { GamePreferences } from '@/lib/preferences';
import { GRAPHICS, type GraphicsSnapshot } from '@/lib/graphics-quality';
export function SaveAndComfort({
  progress,
  onProgress,
  graphics,
}: {
  progress: ProgressData;
  onProgress: (p: ProgressData) => void;
  graphics?: GraphicsSnapshot;
}) {
  const [message, setMessage] = useState(''),
    [preview, setPreview] = useState<ProgressData | null>(null),
    [backups, setBackups] = useState<SaveBackup[]>([]);
  const set = <K extends keyof GamePreferences>(
    key: K,
    value: GamePreferences[K],
  ) =>
    onProgress({
      ...progress,
      preferences: { ...progress.preferences, [key]: value },
    });
  const exportFile = () => {
    const url = URL.createObjectURL(
      new Blob([exportSave(progress)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clovers-monster-save.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importFile = async (file: File) => {
    try {
      if (file.size > 1_000_000)
        throw new Error('Choose a save smaller than 1 MB.');
      setPreview(parseSavedProgress(await file.text()));
      setMessage(
        'Check this copy before restoring. Your current progress will be kept as a recovery copy.',
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : 'This save could not be opened.',
      );
    }
  };
  const restore = () => {
    if (!preview) return;
    try {
      saveRecoverably(localStorage, preview);
      onProgress(preview);
      setPreview(null);
      setMessage('Your adventure has been restored.');
      setBackups(readBackups(localStorage));
    } catch {
      setMessage(
        'There was not enough storage to keep a recovery copy. Nothing was restored.',
      );
    }
  };
  return (
    <section className="save-comfort" data-parent-controls>
      <h3>Comfort and sound</h3>
      <div className="comfort-grid">
        <label>
          Motion
          <select
            value={progress.preferences.motion}
            onChange={(e) =>
              set('motion', e.target.value as GamePreferences['motion'])
            }
          >
            <option value="system">Follow device preference</option>
            <option value="reduced">Reduce motion</option>
          </select>
        </label>
        <label>
          Contrast
          <select
            value={progress.preferences.contrast}
            onChange={(e) =>
              set('contrast', e.target.value as GamePreferences['contrast'])
            }
          >
            <option value="standard">Storybook colours</option>
            <option value="high">Stronger contrast</option>
          </select>
        </label>
        <label>
          Activity text
          <select
            value={progress.preferences.textSize}
            onChange={(e) =>
              set('textSize', e.target.value as GamePreferences['textSize'])
            }
          >
            <option value="standard">Standard</option>
            <option value="large">Larger</option>
          </select>
        </label>
        <label>
          Camera
          <select
            value={progress.preferences.camera}
            onChange={(e) =>
              set('camera', e.target.value as GamePreferences['camera'])
            }
          >
            <option value="gentle">Gently avoid scenery</option>
            <option value="fixed">Fixed direction</option>
          </select>
        </label>
        <label>
          Graphics
          <select
            value={progress.preferences.graphics}
            onChange={(e) =>
              set('graphics', e.target.value as GamePreferences['graphics'])
            }
          >
            <option value="auto">Automatic — adapt while playing</option>
            <option value="rich">More detail</option>
            <option value="balanced">Balanced</option>
            <option value="simple">Simpler graphics</option>
          </select>
        </label>
        <label>
          Island light
          <select
            value={progress.preferences.daylight}
            onChange={(e) =>
              set('daylight', e.target.value as GamePreferences['daylight'])
            }
          >
            <option value="cycle">Gentle daylight cycle</option>
            <option value="day">Always daytime</option>
            <option value="sunset">Warm sunset</option>
            <option value="evening">Cosy evening</option>
          </select>
        </label>
        <label>
          Island weather
          <select
            value={progress.preferences.weather}
            onChange={(e) =>
              set('weather', e.target.value as GamePreferences['weather'])
            }
          >
            <option value="cycle">Sunshine, gentle rain and rainbows</option>
            <option value="sunny">Always sunny</option>
            <option value="drizzle">Gentle drizzle and puddles</option>
            <option value="rainbow">Rainbow and puddles</option>
          </select>
        </label>
        <label>
          Speech volume · {Math.round(progress.preferences.speechVolume * 100)}%
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress.preferences.speechVolume * 100}
            onChange={(e) => set('speechVolume', Number(e.target.value) / 100)}
          />
        </label>
        <label>
          Environment volume ·{' '}
          {Math.round(progress.preferences.environmentVolume * 100)}%
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress.preferences.environmentVolume * 100}
            onChange={(e) =>
              set('environmentVolume', Number(e.target.value) / 100)
            }
          />
        </label>
      </div>
      <label className="calm-toggle">
        <input
          type="checkbox"
          checked={progress.preferences.calm}
          onChange={(e) => set('calm', e.target.checked)}
        />{' '}
        Calm play: less motion, quieter surroundings and smaller celebrations
      </label>
      {graphics && (
        <details className="graphics-info">
          <summary>Graphics information</summary>
          <p>
            Last world view: {GRAPHICS[graphics.tier].label}.{' '}
            {graphics.fps === null
              ? 'Still measuring.'
              : Math.round(graphics.fps) + ' frames per second.'}
          </p>
          <p>
            {graphics.drawCalls.toLocaleString()} draw calls ·{' '}
            {graphics.triangles.toLocaleString()} triangles ·{' '}
            {graphics.geometries} geometries · {graphics.textures} textures ·
            render scale {graphics.pixelRatio.toFixed(2)}.
          </p>
          <p>
            Automatic mode changes scenery density, shadows and render
            resolution. Activities, discoveries and rewards are the same in
            every setting. Measurements stay on this device.
          </p>
        </details>
      )}
      <h3>Save and recovery</h3>
      <p>
        Keep a copy of Monster’s stars, clothes, house, garden and learning
        progress. Recordings and listening approvals stay separately on this
        device.
      </p>
      <div className="review-actions">
        <button className="secondary-button" onClick={exportFile}>
          Export adventure
        </button>
        <label className="upload-button">
          Choose a saved adventure
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFile(file);
              e.target.value = '';
            }}
          />
        </label>
        <button
          className="secondary-button"
          onClick={() => {
            const copies = readBackups(localStorage);
            setBackups(copies);
            setMessage(
              copies.length
                ? 'Choose a recovery copy to preview.'
                : 'No earlier copies yet. Copies are made as progress changes.',
            );
          }}
        >
          Show recovery copies
        </button>
      </div>
      {backups.map((b, i) => (
        <button
          key={b.savedAt + '-' + i}
          className="recovery-copy secondary-button"
          onClick={() => setPreview(b.progress)}
        >
          {new Date(b.savedAt).toLocaleString('en-GB')} ·{' '}
          {b.progress.adventure.wallet} stars ·{' '}
          {b.progress.adventure.region === 'moon' ? 'Moon' : 'Island'}
        </button>
      ))}
      {preview && (
        <div className="save-preview">
          <strong>Restore this adventure?</strong>
          <p>
            {preview.adventure.wallet} stars · {preview.knownSounds.length}{' '}
            introduced sounds · {preview.adventure.inventory.length} owned items
          </p>
          <button className="secondary-button" onClick={restore}>
            Restore this copy
          </button>
          <button className="secondary-button" onClick={() => setPreview(null)}>
            Keep current adventure
          </button>
        </div>
      )}
      <output>{message}</output>
    </section>
  );
}
