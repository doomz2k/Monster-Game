"""Generate reusable narration locally. Never use this script for phoneme teaching clips."""
import hashlib
import json
from pathlib import Path
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'work' / 'voice-model'
OUT = ROOT / 'public' / 'audio' / 'voices'
OUT.mkdir(parents=True, exist_ok=True)
PROFILES = {'narrator': ('bf_emma', 0.96), 'bramble': ('bm_george', 0.98), 'olive': ('bf_isabella', 0.96), 'marina': ('bf_emma', 1.04), 'tilly': ('bf_lily', 0.98), 'poppy': ('bf_alice', 1.0), 'pip': ('bm_fable', 1.02), 'nova': ('bf_isabella', 1.04)}
assert all(voice.startswith(('bf_', 'bm_')) for voice, _ in PROFILES.values()), 'Only British voices are permitted.'
options = ort.SessionOptions()
options.intra_op_num_threads = 4
options.inter_op_num_threads = 1
session = ort.InferenceSession(str(MODELS / 'kokoro-v1.0.onnx'), sess_options=options, providers=['CPUExecutionProvider'])
engine = Kokoro.from_session(session, str(MODELS / 'voices-v1.0.bin'))
script = json.loads((ROOT / 'lib/audio-data/adventure-script.json').read_text(encoding='utf-8'))
manifest = {}
for index, (key, line) in enumerate(script.items(), 1):
    voice, speed = PROFILES[line['voice']]
    fingerprint = hashlib.sha256((voice + str(speed) + line['text'] + 'kokoro-v1-headroom2').encode()).hexdigest()[:16]
    filename = key + '-' + fingerprint + '.ogg'
    destination = OUT / filename
    if not destination.exists():
        samples, rate = engine.create(line['text'], voice=voice, speed=speed, lang='en-gb')
        if not np.isfinite(samples).all() or len(samples) < rate * 0.05 or len(samples) > rate * 60:
            raise ValueError('Invalid generated audio: ' + key)
        peak = float(np.max(np.abs(samples)))
        if peak < 0.001:
            raise ValueError('Silent generated audio: ' + key)
        samples = samples * min(1.5, 0.65 / peak)
        fade = min(240, len(samples) // 10)
        samples[:fade] *= np.linspace(0, 1, fade)
        samples[-fade:] *= np.linspace(1, 0, fade)
        sf.write(destination, samples, rate, format='OGG', subtype='VORBIS')
    manifest[key] = {'path': '/audio/voices/' + filename, 'voice': voice, 'text': line['text']}
    print(f'{index}/{len(script)} {key}', flush=True)
(ROOT / 'lib/audio-data/voice-clips.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print('Recorded voice bank complete.', flush=True)
