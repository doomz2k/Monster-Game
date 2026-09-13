"""Reproducible technical checks, never a substitute for a phonics/listening review."""
import hashlib
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
def inspect(path):
    file = ROOT / 'public' / path.lstrip('/')
    samples, rate = sf.read(file, always_2d=True)
    if not len(samples) or not np.isfinite(samples).all():
        raise ValueError('Empty or non-finite audio: ' + path)
    envelope = np.max(np.abs(samples), axis=1)
    peak = float(envelope.max())
    active = np.flatnonzero(envelope > max(.001, peak * .01))
    if not len(active): raise ValueError('Silent audio: ' + path)
    sounding = samples[active]
    rms = float(np.sqrt(np.mean(sounding ** 2)))
    warnings = []
    if peak >= .99: warnings.append('near-clipping')
    if rms < .015: warnings.append('quiet: listen and compare')
    if active[0] / rate > .4: warnings.append('long lead-in')
    if (len(samples) - active[-1] - 1) / rate > .75: warnings.append('long tail')
    return {'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'seconds': round(len(samples)/rate,3), 'sampleRate': rate, 'channels': samples.shape[1], 'peakDbfs': round(20*np.log10(max(peak,1e-9)),1), 'activeRmsDbfs': round(20*np.log10(max(rms,1e-9)),1), 'leadingSilenceMs': round(active[0]/rate*1000), 'trailingSilenceMs': round((len(samples)-active[-1]-1)/rate*1000), 'warnings': warnings}

report = {'method': 'Decoded PCM; active RMS uses samples above max(0.001, 1% peak), not LUFS. Technical checks cannot establish pronunciation, accent or warmth.', 'voices': {}, 'phonemes': {}}
manifests = {}
for kind, filename in [('voices','voice-clips.json'),('phonemes','phonemes.json')]:
    manifest = json.loads((ROOT/'lib/audio-data'/filename).read_text(encoding='utf-8'))
    manifests[kind] = manifest
    for key, value in manifest.items():
        if kind == 'voices':
            assert value['voice'].startswith(('bf_', 'bm_')), 'Non-British voice profile: ' + key
        report[kind][key] = inspect(value['path'])
        if kind == 'voices':
            assert .05 < report[kind][key]['seconds'] < 60, 'Unexpected narration duration: ' + key
out = ROOT/'lib/audio-data/audio-audit.json'
out.write_text(json.dumps(report, indent=2)+'\n',encoding='utf-8')
runtime = {'voices': {key: clip['path'] for key, clip in manifests['voices'].items()}, 'phonemes': {key: {'path': clip['path'], 'sha256': report['phonemes'][key]['sha256'], 'blocked': 'near-clipping' in report['phonemes'][key]['warnings']} for key, clip in manifests['phonemes'].items()}}
(ROOT/'lib/audio-data/audio-runtime.json').write_text(json.dumps(runtime, indent=2)+'\n',encoding='utf-8')
order = 'm a s d t i n p g o c k u b f e l h r j v y w z x sh th ch qu ng nk ck'.split()
phonics = {'auditedOn': '2026-09-12', 'programme': 'Read Write Inc. Set 1, confirmed by Clover’s parent', 'method': report['method'], 'reference': 'https://home.oxfordowl.co.uk/phonics-videos/', 'teachingDefault': 'Disabled without a named local review tied to the exact source. Built-in nk requires replacement because its decoded peak exceeds full scale. No synthetic phoneme fallback.', 'sounds': [{'grapheme':g,'status':'unverified' if g in report['phonemes'] else 'missing','britishPronunciationVerified':False,'pureSoundVerified':False,**report['phonemes'].get(g,{})} for g in order]}
(ROOT/'docs/phonics-audit.json').write_text(json.dumps(phonics,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for kind in ['voices','phonemes']:
    values = report[kind]
    print(f'{kind}: {len(values)} decoded files; {sum(bool(v["warnings"]) for v in values.values())} need technical attention; all require human listening review.')
