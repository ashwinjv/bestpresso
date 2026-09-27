import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_MILK_ASSIST, normalizeMilkAssist } from '../src/features/machine/milkAssistStore.ts'

test('defaults are disabled and uncalibrated', () => {
  assert.deepEqual(DEFAULT_MILK_ASSIST, { enabled: false, jugGrams: null, calGrams: null, calSeconds: null, pendingRestoreSeconds: null })
  assert.deepEqual(normalizeMilkAssist(undefined), DEFAULT_MILK_ASSIST)
  assert.deepEqual(normalizeMilkAssist('garbage'), DEFAULT_MILK_ASSIST)
})

test('normalize keeps valid values and rejects invalid ones', () => {
  const valid = { enabled: true, jugGrams: 412, calGrams: 214, calSeconds: 24, pendingRestoreSeconds: 17 }
  assert.deepEqual(normalizeMilkAssist(valid), valid)
  assert.equal(normalizeMilkAssist({ jugGrams: -5 }).jugGrams, null)
  assert.equal(normalizeMilkAssist({ jugGrams: Number.NaN }).jugGrams, null)
  assert.equal(normalizeMilkAssist({ calGrams: 0 }).calGrams, null)
  assert.equal(normalizeMilkAssist({ calSeconds: 3 }).calSeconds, null)   // below MIN_CALIBRATION_SECONDS
  assert.equal(normalizeMilkAssist({ calSeconds: 500 }).calSeconds, null) // above STEAM_DURATION_MAX_S
  assert.equal(normalizeMilkAssist({ enabled: 'yes' }).enabled, false)
  assert.equal(normalizeMilkAssist({ jugGrams: 412.6 }).jugGrams, 413)
})
