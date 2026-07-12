/**
 * Fluid and volume balance during CPB.
 *
 * The perfusionist tracks everything in and out of the circuit and the patient:
 * prime, cardioplegia, IV fluids, blood products in; urine, ultrafiltration,
 * blood loss, and residual circuit volume out. Net balance guides ultrafiltration
 * and post-bypass volume management.
 */

export interface FluidLedger {
  /** Volumes added to the patient/circuit (mL) */
  in: {
    primeVolume?: number;
    cardioplegia?: number;
    crystalloid?: number;
    colloid?: number;
    bloodProducts?: number;
    other?: number;
  };
  /** Volumes removed (mL) */
  out: {
    urine?: number;
    ultrafiltration?: number;
    bloodLoss?: number;
    residualCircuit?: number;
    other?: number;
  };
}

function sum(record: Record<string, number | undefined>): number {
  return Object.values(record).reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

/** Total input volume (mL). */
export function totalIn(ledger: FluidLedger): number {
  return sum(ledger.in);
}

/** Total output volume (mL). */
export function totalOut(ledger: FluidLedger): number {
  return sum(ledger.out);
}

/**
 * Net fluid balance (mL). Positive = net gain (patient volume up),
 * negative = net loss. Perfusionists usually aim for a modestly negative
 * or neutral balance by end of bypass.
 */
export function netFluidBalance(ledger: FluidLedger): number {
  return totalIn(ledger) - totalOut(ledger);
}

/** Ultrafiltration balance is simply the volume removed by the hemoconcentrator. */
export function ultrafiltrationBalance(ultrafiltrationMl: number): number {
  if (ultrafiltrationMl < 0) throw new RangeError('ultrafiltration must be >= 0');
  return -ultrafiltrationMl;
}
