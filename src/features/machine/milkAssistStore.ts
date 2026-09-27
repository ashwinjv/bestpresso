import { useEffect, useState } from 'react'
import { MIN_CALIBRATION_SECONDS, STEAM_DURATION_MAX_S } from '../../domain/milkAssist.ts'

export interface MilkAssistState {
  enabled: boolean
  jugGrams: number | null
  calGrams: number | null
  calSeconds: number | null
  pendingRestoreSeconds: number | null
}

export const MILK_ASSIST_KEY = 'bestpresso.milkAssist.v1'
const changeEvent = 'bestpresso:milk-assist-changed'

export const DEFAULT_MILK_ASSIST: MilkAssistState = { enabled: false, jugGrams: null, calGrams: null, calSeconds: null, pendingRestoreSeconds: null }

const grams = (value: unknown): number | null => {
  const number = typeof value === 'number' ? value : Number.NaN
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null
}

const calibrationSeconds = (value: unknown): number | null => {
  const rounded = grams(value)
  return rounded !== null && rounded >= MIN_CALIBRATION_SECONDS && rounded <= STEAM_DURATION_MAX_S ? rounded : null
}

export function normalizeMilkAssist(value: unknown): MilkAssistState {
  const candidate = value && typeof value === 'object' ? value as Partial<MilkAssistState> : {}
  return {
    enabled: candidate.enabled === true,
    jugGrams: grams(candidate.jugGrams),
    calGrams: grams(candidate.calGrams),
    calSeconds: calibrationSeconds(candidate.calSeconds),
    pendingRestoreSeconds: calibrationSeconds(candidate.pendingRestoreSeconds),
  }
}

export function readMilkAssist(): MilkAssistState {
  if (typeof window === 'undefined') return DEFAULT_MILK_ASSIST
  try {
    const stored = window.localStorage.getItem(MILK_ASSIST_KEY)
    return normalizeMilkAssist(stored ? JSON.parse(stored) : undefined)
  } catch {
    return DEFAULT_MILK_ASSIST
  }
}

export function writeMilkAssist(patch: Partial<MilkAssistState>): MilkAssistState {
  const next = normalizeMilkAssist({ ...readMilkAssist(), ...patch })
  try {
    window.localStorage.setItem(MILK_ASSIST_KEY, JSON.stringify(next))
  } catch {
    // The current session can still use the values when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: next }))
  return next
}

export function useMilkAssist() {
  const [milkAssist, setMilkAssist] = useState(readMilkAssist)
  useEffect(() => {
    const onChange = (event: Event) => setMilkAssist((event as CustomEvent<MilkAssistState>).detail ?? readMilkAssist())
    const onStorage = (event: StorageEvent) => {
      if (event.key === MILK_ASSIST_KEY || event.key === null) setMilkAssist(readMilkAssist())
    }
    window.addEventListener(changeEvent, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(changeEvent, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return { milkAssist, updateMilkAssist: writeMilkAssist }
}
