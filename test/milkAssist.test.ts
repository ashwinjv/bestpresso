import assert from 'node:assert/strict'
import test from 'node:test'
import { MILK_PRESENCE_THRESHOLD_G, milkAssistPillState, milkGramsOnScale, ratePer150Ml, suggestedSteamSeconds } from '../src/domain/milkAssist.ts'

test('milkGramsOnScale subtracts the jug and floors at zero', () => {
  assert.equal(milkGramsOnScale(626, 412), 214)
  assert.equal(milkGramsOnScale(400, 412), 0)
  assert.equal(milkGramsOnScale(undefined, 412), null)
  assert.equal(milkGramsOnScale(626, null), null)
  assert.equal(milkGramsOnScale(Number.NaN, 412), null)
})

test('suggestedSteamSeconds scales linearly, rounds, and clamps to 10-120', () => {
  assert.equal(suggestedSteamSeconds(214, 150, 18), 26) // 214*18/150 = 25.68
  assert.equal(suggestedSteamSeconds(150, 150, 18), 18)
  assert.equal(suggestedSteamSeconds(20, 150, 18), 10)  // 2.4 clamps up
  assert.equal(suggestedSteamSeconds(2000, 150, 18), 120)
  assert.equal(suggestedSteamSeconds(214, null, 18), null)
  assert.equal(suggestedSteamSeconds(214, 150, null), null)
  assert.equal(suggestedSteamSeconds(214, 0, 18), null)
})

test('ratePer150Ml derives the display rate', () => {
  assert.equal(ratePer150Ml(214, 24), 17) // 24*150/214 = 16.82
})

test('pill state machine', () => {
  const base = { enabled: true, scaleConnected: true, scaleGrams: 626, jugGrams: 412, calGrams: 214, calSeconds: 24 }
  assert.deepEqual(milkAssistPillState(base), { kind: 'live', milkGrams: 214, suggestedSeconds: 24 })
  assert.deepEqual(milkAssistPillState({ ...base, enabled: false }), { kind: 'hidden' })
  assert.deepEqual(milkAssistPillState({ ...base, scaleConnected: false }), { kind: 'hidden' })
  assert.deepEqual(milkAssistPillState({ ...base, calGrams: null }), { kind: 'setup' })
  assert.deepEqual(milkAssistPillState({ ...base, jugGrams: null }), { kind: 'setup' })
  assert.deepEqual(milkAssistPillState({ ...base, scaleGrams: 412 + MILK_PRESENCE_THRESHOLD_G }), { kind: 'idle' })
  assert.deepEqual(milkAssistPillState({ ...base, scaleGrams: undefined }), { kind: 'idle' })
})
