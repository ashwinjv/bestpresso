import assert from 'node:assert/strict'
import test from 'node:test'
import { stableWeight, wizardCaptureJug, wizardCaptureMilk, wizardInit, wizardSteamEvent } from '../src/features/machine/milkAssistWizard.ts'

test('wizard walks jug -> milk -> steam and skips jug when saved', () => {
  assert.deepEqual(wizardInit(null), { step: 'jug' })
  assert.deepEqual(wizardInit(412), { step: 'milk', jugGrams: 412 })
  const milk = wizardCaptureJug(412)
  assert.deepEqual(milk, { step: 'milk', jugGrams: 412 })
  assert.deepEqual(wizardCaptureMilk(milk, 626), { step: 'steam', jugGrams: 412, milkGrams: 214, phase: 'waiting', elapsedSeconds: 0 })
})

test('steam phase captures elapsed time and flags too-short and max runs', () => {
  const steam = wizardCaptureMilk(wizardCaptureJug(412), 626)
  const running = wizardSteamEvent(wizardSteamEvent(steam, { kind: 'started' }), { kind: 'tick', elapsedSeconds: 24.3 })
  assert.equal(running.step === 'steam' && running.phase, 'running')
  const done = wizardSteamEvent(running, { kind: 'ended' })
  assert.deepEqual(done, { step: 'steam', jugGrams: 412, milkGrams: 214, phase: 'captured', elapsedSeconds: 24 })
  const short = wizardSteamEvent(wizardSteamEvent(wizardSteamEvent(steam, { kind: 'started' }), { kind: 'tick', elapsedSeconds: 3 }), { kind: 'ended' })
  assert.equal(short.step === 'steam' && short.phase, 'tooShort')
  const capped = wizardSteamEvent(wizardSteamEvent(steam, { kind: 'started' }), { kind: 'tick', elapsedSeconds: 120 })
  assert.equal(capped.step === 'steam' && capped.phase, 'reachedMax')
})

test('stableWeight needs 1500 ms within one gram', () => {
  const base = [{ grams: 412, atMs: 0 }, { grams: 412.4, atMs: 800 }, { grams: 411.8, atMs: 1600 }]
  assert.equal(stableWeight(base, 1600), 412)
  assert.equal(stableWeight([{ grams: 412, atMs: 1400 }], 1600), null)          // not observed long enough
  assert.equal(stableWeight([{ grams: 405, atMs: 100 }, { grams: 412, atMs: 1600 }], 1600), null) // drifting
  assert.equal(stableWeight([], 1600), null)
})
