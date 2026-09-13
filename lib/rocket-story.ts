export const ROCKET_CHAPTERS = [
  { title: 'Mend the control panel', picture: '🔩', line: 'pip-chapter-panel' },
  { title: 'Fill the fuel tank', picture: '💎', line: 'pip-chapter-fuel' },
  {
    title: 'Connect the star battery',
    picture: '🔋',
    line: 'pip-chapter-battery',
  },
  { title: 'Ready for the Moon!', picture: '🚀', line: 'pip-repaired' },
] as const;
export const repairStage = (rounds: number) =>
  Number.isFinite(rounds) ? Math.min(3, Math.max(0, Math.floor(rounds))) : 0;
export const rocketChapter = (rounds: number) =>
  ROCKET_CHAPTERS[repairStage(rounds)];

export const FLIGHT_DURATION = 6800;
export class FlightJourney {
  elapsed = 0;
  status: 'flying' | 'arrived' | 'cancelled' = 'flying';
  advance(milliseconds: number, active: boolean) {
    if (
      active &&
      this.status === 'flying' &&
      Number.isFinite(milliseconds) &&
      milliseconds > 0
    )
      this.elapsed = Math.min(
        FLIGHT_DURATION,
        this.elapsed + Math.min(milliseconds, 100),
      );
    return this.elapsed / FLIGHT_DURATION;
  }
  arrive() {
    if (this.status !== 'flying') return false;
    this.status = 'arrived';
    this.elapsed = FLIGHT_DURATION;
    return true;
  }
  cancel() {
    if (this.status === 'flying') this.status = 'cancelled';
  }
}
const smooth = (t: number) => {
  const p = Math.min(1, Math.max(0, t));
  return p * p * (3 - 2 * p);
};
export function flightPose(progress: number, reduced: boolean) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const phase = p < 0.2 ? 0 : p < 0.48 ? 1 : p < 0.8 ? 2 : 3;
  if (reduced)
    return {
      phase,
      x: 0,
      y: 0.5,
      tilt: 0,
      flame: 0,
      sourceY: -10,
      destinationY: -10,
    };
  const lift = smooth((p - 0.16) / 0.34),
    land = smooth((p - 0.76) / 0.24);
  return {
    phase,
    x: -1.7 + smooth((p - 0.35) / 0.55) * 3.4,
    y: lift * 2.5 - land * 2.5,
    tilt: -Math.sin(smooth((p - 0.2) / 0.65) * Math.PI) * 0.35,
    flame: p > 0.16 && p < 0.97 ? 1 - land * 0.65 : 0,
    sourceY: -3 - lift * 7,
    destinationY: -10 + land * 7,
  };
}
