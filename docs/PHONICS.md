# Phonics design and verification record

Research checked 12 September 2026. This document describes implemented behaviour and unresolved verification, not an accreditation claim.

## Primary references

- [Oxford Owl: Read Write Inc. guide for parents](https://home.oxfordowl.co.uk/reading/reading-schemes-oxford-levels/read-write-inc-phonics-guide/): Set 1 list, sounds rather than letter names, clear pure sounds and blending.
- [Ruth Miskin: parent/carer films](https://www.ruthmiskin.com/parentsandcarers/): pronunciation, stretchy and bouncy sounds, sound blending.
- [Oxford Owl: phonics videos](https://home.oxfordowl.co.uk/phonics-videos/): pure-sound and blending guidance.

Read Write Inc. is a specific teaching programme, not a generic UK standard. This game implements selected principles as practice activities. It does not reproduce the full programme, reading books, letter-formation rhymes, assessments or teaching scripts, and does not claim approval by Ruth Miskin or Oxford University Press.

## Implemented scope

- The published Set 1 list begins m a s d t. The parent guide's ck entry is included at the end of the displayed list. Internal groups of 5/8/12/16/19/25/32 are **game settings**, not claimed official lesson groups.
- Lowercase graphemes. New sounds are modelled and rehearsed before recognition. Only introduced sounds appear in decodable words.
- Every blending word has explicit grapheme segmentation, so sh, ch, ng and nk cannot accidentally be split into individual letters. Blending is offered only when at least three candidate words are decodable.
- The game uses the unvoiced th /θ/ in its current th activity. It explicitly identifies the voiced variant /ð/ in the grown-up note but does not teach or score it as the same sound.
- x /ks/, qu /kw/ and nk /ŋk/ are recorded as sequences, not incorrectly labelled single phonemes. c/k/ck share /k/ and never act as distractors against each other.
- British short vowels are mapped explicitly. In particular, a is /æ/, i is /ɪ/, o is /ɒ/ and u is /ʌ/. The vowel symbols are broad pedagogical transcriptions; local UK accent differences require professional judgement.
- Successful activity completion is practice progress, not proof that a sound is mastered. It never automatically expands the parent's selected phonics range.

## What changed from clover-games

The reference's planet data begins s a t p, which is a Letters and Sounds-style sequence. Its documentation combines references to that sequence and Read Write Inc. This game uses the Oxford Owl Set 1 list instead.

The reference audio pipeline can substitute Piper and eSpeak outputs, including inputs such as `puh`, `tuh`, `duh`, `ing` and `ink`. Those string tokens are unsafe as automatic phoneme pronunciations: an added vowel can interfere with blending. Its historical Wikimedia fetch manifest is not enough to prove the contents of later sound-lab files.

The 26 inherited `__live.ogg` files are therefore **candidates only**, all disabled for teaching at initial load. No claim is made that the candidate clips are pure, are from a single speaker, or have been checked against Read Write Inc. Six correspondences have no supplied clip. Whole-word narrator clips are separate from this bank.

## Runtime audio guarantee

A phoneme is played in an activity only if the local review record explicitly approves that grapheme under the British pure-sound review standard and a clip is available. Otherwise a grown-up is asked to model it. There is no letter-name, word-fragment, synthetic phoneme, or silent-success fallback. Playback errors produce a visible message. Imported audio is decoded, constrained to 0.05–5 seconds and 2 MB, and starts unchecked. Saving an approval can fail visibly if browser storage is full.

The runtime gate is tested; it **does not certify the linguistic quality of an approved file**. Local checking is a parent-controlled preference, not a substitute for a practitioner review.

## Auditory review still required

For every clip, compare it with the official pronunciation film and check:

1. Correct target sound or sequence, and a suitable British English model.
2. A pure onset/continuant with no added schwa; stop consonants remain short.
3. No spoken letter name, lead-in word, extra syllable, or unwanted following vowel.
4. Correct vowel quality and length, no word-stress artefact.
5. For ng/nk, no preceding i; for ng, no added g.
6. Clear beginning/end, comfortable volume, no clipping, background noise or truncation.
7. The same recording remains clear in sequential word blending.

Record the reviewer, date, final file hash and rationale before describing the sound bank as verified. No entries have yet completed this independent review. Instructions and whole words now use the bundled British Kokoro bank. Browser TTS is disabled entirely.

## Tests and limitations

Automated tests confirm order, grapheme integrity, decodability, non-ambiguous options and sound-gate behaviour. They do not listen to audio and cannot assess schwa, articulation or accents. Visual inspection and controller hardware acceptance remain separate from programmatic tests.

## 12 September file audit

[`phonics-audit.json`](phonics-audit.json) records the SHA-256, decoded duration, sample rate, channels, peak and quiet boundaries of every actual inherited file. All 26 decode; six entries are missing. None has passed auditory verification. The current audio tool explicitly reports that audio input is unsupported, so a pronunciation or British-accent assessment could not be performed. Code, waveform and file-header checks do not close that gap.

The historic sound-lab provenance permits generated replacements, so a Wikimedia label is insufficient evidence of the delivered phoneme. These clips stay disabled. Previous approvals predate the British-only requirement and are invalidated; the current review explicitly checks British pronunciation, no letter name, no appended schwa, and no extra syllables. A practitioner or competent British adult must listen against the linked official pure-sounds film and replace inaccurate or missing clips before recorded phonics can be described as ready. No publisher film audio has been copied into the game.

## Read Write Inc. confirmation and exact-source reviews

Clover’s parent confirmed on 12 September that her school uses Read Write Inc. The review desk now stores a named reviewer, parent or UK-specialist role, date, and the exact candidate identity (`rwi-set1-v2`). Bundled identity is the SHA-256 of delivered bytes; imported recordings are compared byte-for-byte as data URLs. Exported imported hashes are explicitly labelled hashes of that data URL. Changing a file or importing a replacement cannot reuse its previous approval. Legacy approvals cannot identify a reviewed source and require checking again.

The existing `nk` candidate has a decoded peak of +0.4 dBFS. It is blocked from teaching even if its checkbox is manipulated: it must be replaced, then reviewed. Twenty-six candidates decode and six remain missing; none has acquired specialist sign-off from automated checks. Parents can audition candidate sequences privately, with no automatic approval. All formal specialist/listening acceptance remains pending.
