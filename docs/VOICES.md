# Recorded British voices

The adventure uses 174 pre-generated Ogg Vorbis recordings. Narration is generated locally on CPU with [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) and [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M). No model or voice service is used by the deployed game. The model is Apache-2.0; the ONNX wrapper is MIT. Model downloads are development dependencies and are not distributed with the game.

Every configured voice is from the model’s [British English voice group](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md); the generator also forces `en-gb` pronunciation. American profiles are rejected. Profiles: narrator bf_emma; Bramble bm_george; Olive bf_isabella; Marina bf_emma at a quicker pace; Tilly bf_lily; Poppy bf_alice; Pip bm_fable; Nova bf_isabella at a quicker pace. No voice is presented as an imitation of a named person. Profiles and pace distinguish characters; the bank has six distinct voice profiles.

## Reproduce

1. Create a Python virtual environment and install `scripts/voice-requirements.txt`.
2. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the wrapper’s official [model-files-v1.0 release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0) into ignored `work/voice-model/`.
3. Edit `lib/audio-data/adventure-script.json`, then run `python scripts/generate-voices.py`.
4. The generator writes reusable content-named files and `lib/audio-data/voice-clips.json`. Remove only superseded files absent from that completed manifest. Run `python scripts/audit-audio.py`, then the project checks.

The generator validates finite, non-silent samples, limits duration, leaves peak headroom and fades the ends. The audit decodes every delivered file, tests peak/duration and voice profiles, and writes the phonics audit. These are media integrity checks, not a listening assessment of naturalness or accent. The voice profiles are documented British models; there is no claim that every generated utterance has been independently listened to in this session.

## Phoneme boundary

Never run isolated teaching phonemes through this narrator generator. Whole words and instructions use this bank; pure sounds must be independently recorded and checked. `AudioDirector.lines` puts a spoken instruction and its approved phonemes in one cancellable sequence, so leaving a lesson or repeating cannot restart an old sound queue. Browser TTS is not used anywhere in the current game.
