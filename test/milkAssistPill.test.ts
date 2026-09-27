import assert from 'node:assert/strict'
import test from 'node:test'
import { savedStateHolds } from '../src/domain/milkAssist.ts'

test('saved confirmation reverts only on a meaningful weight change', () => {
  assert.equal(savedStateHolds(214, 214), true)
  assert.equal(savedStateHolds(214, 218), true)   // within 5 g
  assert.equal(savedStateHolds(214, 220), false)  // above 5 g
  assert.equal(savedStateHolds(214, 208), false)
})
