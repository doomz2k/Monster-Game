/** Counts visible playing time; completion is emitted once, never by a stale timeout. */
export class ActiveCountdown {
  elapsed = 0;
  private finished = false;
  constructor(readonly duration: number) {}
  advance(milliseconds: number, active: boolean) {
    if (
      !active ||
      this.finished ||
      !Number.isFinite(milliseconds) ||
      milliseconds <= 0
    )
      return false;
    this.elapsed = Math.min(
      this.duration,
      this.elapsed + Math.min(100, milliseconds),
    );
    if (this.elapsed < this.duration) return false;
    this.finished = true;
    return true;
  }
}
