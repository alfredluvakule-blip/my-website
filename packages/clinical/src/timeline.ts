/**
 * Bypass and cross-clamp timing.
 *
 * CPB time and aortic cross-clamp time are the two headline durations of every
 * pump run, reported on the perfusion record and strongly associated with
 * outcome. Computed from event timestamps so they can never disagree with the
 * timeline the user sees.
 */

/** Elapsed minutes between two ISO timestamps or Date objects. */
export function elapsedMinutes(start: Date | string, end: Date | string): number {
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  const sMs = s.getTime();
  const eMs = e.getTime();
  if (Number.isNaN(sMs) || Number.isNaN(eMs)) throw new TypeError('invalid timestamp');
  if (eMs < sMs) throw new RangeError('end precedes start');
  return (eMs - sMs) / 60000;
}

/**
 * Total CPB time (min) — from "CPB started" to "CPB ended", summed across
 * multiple runs if the patient came off and back on bypass.
 */
export function totalBypassMinutes(runs: Array<{ start: Date | string; end: Date | string }>): number {
  return runs.reduce((acc, r) => acc + elapsedMinutes(r.start, r.end), 0);
}

/**
 * Total cross-clamp time (min) — summed across clamp/unclamp cycles.
 */
export function totalCrossClampMinutes(
  clamps: Array<{ applied: Date | string; removed: Date | string }>,
): number {
  return clamps.reduce((acc, c) => acc + elapsedMinutes(c.applied, c.removed), 0);
}

/** Format minutes as H:MM for display on the record. */
export function formatDuration(minutes: number): string {
  if (minutes < 0) throw new RangeError('minutes must be >= 0');
  const whole = Math.floor(minutes);
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}
