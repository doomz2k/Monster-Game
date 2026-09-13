import bank from './audio-data/response-bank.json';
/** Session-local rotation. Explicit replay returns the exact previous take. */
export class ResponseRotation {
  private counts = new Map<string, number>();
  private last = new Map<string, string>();
  choose(key: string, replay = false) {
    const choices = (bank as Record<string, string[]>)[key];
    if (!choices?.length) return key;
    if (replay && this.last.has(key)) return this.last.get(key)!;
    const index = this.counts.get(key) ?? 0;
    const chosen = choices[index % choices.length];
    this.counts.set(key, index + 1);
    this.last.set(key, chosen);
    return chosen;
  }
}
