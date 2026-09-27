/** Milk Assist math: milk weight from the scale, linear steam-time scaling, pill state. 1 g of milk is treated as 1 ml. */

// Mirrors SETTINGS_PROTOCOL.steam.duration; domain stays browser- and feature-independent.
export const STEAM_DURATION_MIN_S = 10
export const STEAM_DURATION_MAX_S = 120
export const MILK_PRESENCE_THRESHOLD_G = 10
export const SAVED_REVERT_THRESHOLD_G = 5
export const MIN_CALIBRATION_SECONDS = 5

export function milkGramsOnScale(scaleGrams: number | undefined, jugGrams: number | null): number | null {
  if (jugGrams === null || scaleGrams === undefined || !Number.isFinite(scaleGrams)) return null
  return Math.max(0, scaleGrams - jugGrams)
}

export function suggestedSteamSeconds(milkGrams: number, calGrams: number | null, calSeconds: number | null): number | null {
  if (!calGrams || !calSeconds || calGrams <= 0 || calSeconds <= 0) return null
  const scaled = Math.round(milkGrams * calSeconds / calGrams)
  return Math.max(STEAM_DURATION_MIN_S, Math.min(STEAM_DURATION_MAX_S, scaled))
}

export function ratePer150Ml(calGrams: number, calSeconds: number): number {
  return Math.round(calSeconds * 150 / calGrams)
}

export type MilkAssistPillState =
  | { kind: 'hidden' }
  | { kind: 'setup' }
  | { kind: 'idle' }
  | { kind: 'live'; milkGrams: number; suggestedSeconds: number }

export function milkAssistPillState(input: { enabled: boolean; scaleConnected: boolean; scaleGrams: number | undefined; jugGrams: number | null; calGrams: number | null; calSeconds: number | null }): MilkAssistPillState {
  if (!input.enabled || !input.scaleConnected) return { kind: 'hidden' }
  if (input.jugGrams === null || input.calGrams === null || input.calSeconds === null) return { kind: 'setup' }
  const milkGrams = milkGramsOnScale(input.scaleGrams, input.jugGrams)
  if (milkGrams === null || milkGrams <= MILK_PRESENCE_THRESHOLD_G) return { kind: 'idle' }
  const suggestedSeconds = suggestedSteamSeconds(milkGrams, input.calGrams, input.calSeconds)
  if (suggestedSeconds === null) return { kind: 'idle' }
  return { kind: 'live', milkGrams, suggestedSeconds }
}
