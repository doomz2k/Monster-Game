"""Decode and measure delivered audio. These checks cannot certify pronunciation."""
import hashlib
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]

def measure(path):
    samples, rate = sf.read(path, always_2d=True)
    if not len(samples) or not np.isfinite(samples).all():
        raise ValueError(f'Invalid samples: {path}')
    peak = float(np.abs(samples).max())
    if peak < .001:
        raise ValueError(f'Silent file: {path}')
    mono = samples.mean(axis=1)
    active = np.flatnonzero(np.abs(mono) > max(.008, peak * .035))
    return {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'seconds': round(len(samples) / rate, 3), 'sampleRate': rate, 'channels': samples.shape[1], 'peak': round(peak, 4), 'leadingQuietSeconds': round(int(active[0]) / rate, 3), 'trailingQuietSeconds': round((len(samples) - int(active[-1])) / rate, 3)}

phonemes = json.loads((ROOT / 'lib/audio-data/phonemes.json').read_text(encoding='utf-8'))
order = 'm a s d t i n p g o c k u b f e l h r j v y w z x sh th ch qu ng nk ck'.split()
results = []
for grapheme in order:
    entry = phonemes.get(grapheme)
    result = {'grapheme': grapheme, 'status': 'unverified' if entry else 'missing', 'britishPronunciationVerified': False, 'pureSoundVerified': False}
    if entry:
        result.update({'path': entry['path'], **measure(ROOT / 'public' / entry['path'].lstrip('/'))})
        result['provenance'] = 'Inherited sound-lab snapshot; historical source references do not identify the final speaker or synthesis input.'
    results.append(result)
report = {'auditedOn': '2026-09-12', 'method': 'Decoded actual Ogg files with libsndfile; measured duration, sample rate, peak and quiet boundaries; SHA-256 of delivered bytes. This session cannot receive audio input, so no auditory verification was possible.', 'reference': 'https://home.oxfordowl.co.uk/phonics-videos/', 'teachingDefault': 'Disabled unless explicitly reviewed in the British pure-sound review flow. No TTS phoneme fallback.', 'sounds': results}
(ROOT / 'docs/phonics-audit.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
voices = json.loads((ROOT / 'lib/audio-data/voice-clips.json').read_text(encoding='utf-8'))
duration = 0
for key, entry in voices.items():
    assert entry['voice'].startswith(('bf_', 'bm_')), key
    info = measure(ROOT / 'public' / entry['path'].lstrip('/'))
    assert .05 < info['seconds'] < 60, key
    assert info['peak'] < 1, key
    duration += info['seconds']
print(json.dumps({'phonicsPresent': len(phonemes), 'phonicsMissing': len(order) - len(phonemes), 'phonicsAuditorilyVerified': 0, 'BritishNarrationFilesDecoded': len(voices), 'narrationSeconds': round(duration, 1)}))
