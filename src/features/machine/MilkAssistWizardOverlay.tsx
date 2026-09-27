import { useEffect, useRef, useState } from 'react'
import { STEAM_DURATION_MAX_S } from '../../domain/milkAssist'
import { t } from '../../i18n/index.ts'
import { writeMilkAssist, readMilkAssist } from './milkAssistStore'
import { stableWeight, wizardCaptureJug, wizardCaptureMilk, wizardInit, wizardSteamEvent, type WizardStep } from './milkAssistWizard'

interface Props {
  scaleGrams: number | undefined
  scaleConnected: boolean
  steamOperationActive: boolean
  steamElapsedSeconds: number
  currentDurationSeconds: number | null
  onWriteDuration: (seconds: number) => void
  onClose: () => void
}

export function MilkAssistWizardOverlay({ scaleGrams, scaleConnected, steamOperationActive, steamElapsedSeconds, currentDurationSeconds, onWriteDuration, onClose }: Props) {
  const [state, setState] = useState<WizardStep>(() => wizardInit(readMilkAssist().jugGrams))
  const samples = useRef<{ grams: number; atMs: number }[]>([])
  const scaleGramsRef = useRef(scaleGrams)
  const restoreSeconds = useRef<number | null>(null)
  const wroteSafetyNet = useRef(false)
  const [, forceTick] = useState(0)

  useEffect(() => {
    scaleGramsRef.current = scaleGrams
  }, [scaleGrams])

  // Seeds from any restore value a prior mount already persisted, so an unmount (sleep, live brew) mid-flow does not lose it.
  useEffect(() => {
    restoreSeconds.current = readMilkAssist().pendingRestoreSeconds
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const grams = scaleGramsRef.current
      if (grams === undefined) return
      const now = Date.now()
      samples.current = [...samples.current.filter((sample) => sample.atMs > now - 5_000), { grams, atMs: now }]
      forceTick((tick) => tick + 1)
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (state.step !== 'steam' || state.phase !== 'waiting' || wroteSafetyNet.current) return
    wroteSafetyNet.current = true
    if (restoreSeconds.current === null) {
      restoreSeconds.current = currentDurationSeconds ?? null
      writeMilkAssist({ pendingRestoreSeconds: currentDurationSeconds })
    }
    onWriteDuration(STEAM_DURATION_MAX_S)
  }, [state, currentDurationSeconds, onWriteDuration])

  useEffect(() => {
    if (state.step !== 'steam') return
    if (steamOperationActive) {
      setState((current) => wizardSteamEvent(wizardSteamEvent(current, { kind: 'started' }), { kind: 'tick', elapsedSeconds: steamElapsedSeconds }))
    } else {
      setState((current) => wizardSteamEvent(current, { kind: 'ended' }))
    }
  }, [state.step, steamOperationActive, steamElapsedSeconds])

  const cancel = () => {
    if (restoreSeconds.current !== null) onWriteDuration(restoreSeconds.current)
    writeMilkAssist({ pendingRestoreSeconds: null })
    onClose()
  }

  const save = () => {
    if (state.step !== 'steam' || state.phase !== 'captured') return
    writeMilkAssist({ jugGrams: state.jugGrams, calGrams: state.milkGrams, calSeconds: state.elapsedSeconds, pendingRestoreSeconds: null })
    onWriteDuration(state.elapsedSeconds)
    onClose()
  }

  const stable = stableWeight(samples.current, Date.now())
  const stepNumber = state.step === 'jug' ? 1 : state.step === 'milk' ? 2 : 3
  const milkOnScale = state.step === 'milk' && scaleGrams !== undefined ? Math.max(0, Math.round(scaleGrams) - state.jugGrams) : null

  return <div className="milk-wizard" role="dialog" aria-modal="true" aria-labelledby="milk-wizard-title">
    <header className="milk-wizard__head">
      <span className="milk-wizard__step">{t('shell.milkAssist.wizardStep', { step: stepNumber })}</span>
      <button className="milk-dialog__close milk-wizard__cancel" type="button" onClick={cancel}>{t('shell.milkAssist.cancel')}</button>
    </header>
    {!scaleConnected && state.step !== 'steam' ? <p className="milk-wizard__error">{t('shell.milkAssist.scaleLost')}</p> : null}
    {state.step === 'jug' && <div className="milk-wizard__body">
      <h2 id="milk-wizard-title">{t('shell.milkAssist.stepJugTitle')}</h2>
      <p>{t('shell.milkAssist.stepJugInstruction')}</p>
      <div className="milk-wizard__value">{scaleGrams !== undefined ? Math.round(scaleGrams) : '—'}<small>g</small></div>
      <span className={`milk-wizard__stability${stable !== null ? ' is-stable' : ''}`}>{stable !== null ? t('shell.milkAssist.stable') : t('shell.milkAssist.settling')}</span>
      <div className="milk-wizard__actions">
        {state.savedJugGrams !== null && <button className="milk-dialog__close" type="button" onClick={() => setState(wizardCaptureJug(state.savedJugGrams!))}>{t('shell.milkAssist.useSaved', { grams: state.savedJugGrams })}</button>}
        <button className="milk-wizard__primary" type="button" disabled={!scaleConnected || stable === null || stable <= 0} onClick={() => setState(wizardCaptureJug(stable!))}>{t('shell.milkAssist.capture', { grams: stable ?? '—' })}</button>
      </div>
    </div>}
    {state.step === 'milk' && <div className="milk-wizard__body">
      <h2 id="milk-wizard-title">{t('shell.milkAssist.stepMilkTitle')}</h2>
      <p>{t('shell.milkAssist.stepMilkInstruction')}</p>
      <div className="milk-wizard__value">{milkOnScale ?? '—'}<small>g</small></div>
      <span className={`milk-wizard__stability${stable !== null ? ' is-stable' : ''}`}>{stable !== null ? t('shell.milkAssist.stable') : t('shell.milkAssist.settling')}</span>
      <button className="milk-wizard__primary" type="button" disabled={!scaleConnected || stable === null || stable <= state.jugGrams} onClick={() => setState((current) => wizardCaptureMilk(current, stable!))}>{t('shell.milkAssist.capture', { grams: stable !== null ? Math.max(0, stable - state.jugGrams) : '—' })}</button>
    </div>}
    {state.step === 'steam' && <div className="milk-wizard__body">
      <h2 id="milk-wizard-title">{state.phase === 'captured' ? t('shell.milkAssist.captured') : t('shell.milkAssist.stepSteamTitle')}</h2>
      {state.phase === 'waiting' && <><p>{t('shell.milkAssist.stepSteamInstruction')}</p><span className="milk-wizard__stability">{t('shell.milkAssist.steamWaiting')}</span></>}
      {state.phase === 'running' && <div className="milk-wizard__value milk-wizard__value--active">{state.elapsedSeconds.toFixed(1)} <em>/</em> {STEAM_DURATION_MAX_S}<small>s</small></div>}
      {state.phase === 'captured' && <div className="milk-wizard__value">{t('shell.milkAssist.pair', { grams: state.milkGrams, seconds: state.elapsedSeconds })}</div>}
      {state.phase === 'tooShort' && <p className="milk-wizard__error">{t('shell.milkAssist.tooShort')}</p>}
      {state.phase === 'reachedMax' && <p className="milk-wizard__error">{t('shell.milkAssist.reachedMax')}</p>}
      <div className="milk-wizard__actions">
        {(state.phase === 'tooShort' || state.phase === 'reachedMax' || state.phase === 'captured') && <button className="milk-dialog__close" type="button" onClick={() => setState({ ...state, phase: 'waiting', elapsedSeconds: 0 })}>{t('shell.milkAssist.tryAgain')}</button>}
        <button className="milk-wizard__primary" type="button" disabled={state.phase !== 'captured'} onClick={save}>{t('shell.milkAssist.saveCalibration')}</button>
      </div>
    </div>}
    <footer className="milk-wizard__dots" aria-hidden="true">{[1, 2, 3].map((dot) => <i key={dot} className={dot === stepNumber ? 'is-on' : ''} />)}</footer>
  </div>
}
