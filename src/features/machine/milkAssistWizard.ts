import { MIN_CALIBRATION_SECONDS, STEAM_DURATION_MAX_S, milkGramsOnScale } from '../../domain/milkAssist.ts'

export type WizardStep =
  | { step: 'jug'; savedJugGrams: number | null }
  | { step: 'milk'; jugGrams: number }
  | { step: 'steam'; jugGrams: number; milkGrams: number; phase: 'waiting' | 'running' | 'captured' | 'tooShort' | 'reachedMax'; elapsedSeconds: number }

export function wizardInit(savedJugGrams: number | null): WizardStep {
  return { step: 'jug', savedJugGrams }
}

export function wizardCaptureJug(grams: number): WizardStep {
  return { step: 'milk', jugGrams: Math.round(grams) }
}

export function wizardCaptureMilk(state: WizardStep, scaleGrams: number): WizardStep {
  if (state.step !== 'milk') return state
  const milkGrams = milkGramsOnScale(scaleGrams, state.jugGrams)
  if (milkGrams === null || milkGrams <= 0) return state
  return { step: 'steam', jugGrams: state.jugGrams, milkGrams: Math.round(milkGrams), phase: 'waiting', elapsedSeconds: 0 }
}

export function wizardSteamEvent(state: WizardStep, event: { kind: 'started' } | { kind: 'tick'; elapsedSeconds: number } | { kind: 'ended' }): WizardStep {
  if (state.step !== 'steam') return state
  if (event.kind === 'started') return state.phase === 'waiting' ? { ...state, phase: 'running', elapsedSeconds: 0 } : state
  if (state.phase !== 'running') return state
  if (event.kind === 'tick') {
    return event.elapsedSeconds >= STEAM_DURATION_MAX_S
      ? { ...state, phase: 'reachedMax', elapsedSeconds: STEAM_DURATION_MAX_S }
      : { ...state, elapsedSeconds: event.elapsedSeconds }
  }
  const rounded = Math.round(state.elapsedSeconds)
  return rounded < MIN_CALIBRATION_SECONDS ? { ...state, phase: 'tooShort', elapsedSeconds: rounded } : { ...state, phase: 'captured', elapsedSeconds: rounded }
}

const STABILITY_WINDOW_MS = 1500
const STABILITY_TOLERANCE_G = 1

export function stableWeight(samples: { grams: number; atMs: number }[], nowMs: number): number | null {
  if (!samples.length || samples[0].atMs > nowMs - STABILITY_WINDOW_MS) return null
  const window = samples.filter((sample) => sample.atMs >= nowMs - STABILITY_WINDOW_MS)
  const reference = samples.at(-1)!.grams
  if (!window.length || window.some((sample) => Math.abs(sample.grams - reference) > STABILITY_TOLERANCE_G)) return null
  return Math.round(reference)
}
