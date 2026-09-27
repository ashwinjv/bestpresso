import type { MilkAssistPillState } from '../../domain/milkAssist'
import { t } from '../../i18n/index.ts'

export interface MilkAssistPillProps {
  state: MilkAssistPillState
  savedSeconds: number | null
  onSet: (seconds: number) => void
  onCalibrate: () => void
  disabled?: boolean
}

const TunerIcon = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M2 5h9M14 5h2M2 13h2M7 13h9" /><circle cx="12" cy="5" r="2.1" /><circle cx="5" cy="13" r="2.1" /></svg>

export function MilkAssistPill({ state, savedSeconds, onSet, onCalibrate, disabled }: MilkAssistPillProps) {
  if (state.kind === 'hidden') return null
  const calibrateButton = <button className="milk-pill__tuner" type="button" aria-label={t('shell.milkAssist.tunerAria')} disabled={disabled} onClick={onCalibrate}><TunerIcon /></button>
  if (state.kind === 'setup') return <div className="milk-pill milk-pill--setup">
    <span className="milk-pill__reading"><span className="milk-pill__label">{t('shell.milkAssist.milk')}</span><span className="milk-pill__value">—</span></span>
    <button className="milk-pill__cta" type="button" disabled={disabled} onClick={onCalibrate}>{t('shell.milkAssist.calibrateCta')} <span aria-hidden="true">›</span></button>
  </div>
  if (state.kind === 'idle') return <div className="milk-pill milk-pill--idle">
    <span className="milk-pill__reading"><span className="milk-pill__label">{t('shell.milkAssist.milk')}</span><span className="milk-pill__value">—</span></span>
    {calibrateButton}
  </div>
  const saved = savedSeconds !== null
  return <div className="milk-pill">
    <span className="milk-pill__dot" aria-hidden="true" />
    <span className="milk-pill__reading"><span className="milk-pill__label">{t('shell.milkAssist.milk')}</span><span className="milk-pill__value">{state.milkGrams}<small>g</small></span></span>
    <span className="milk-pill__arrow" aria-hidden="true">→</span>
    {saved
      ? <span className="milk-pill__set milk-pill__set--saved" role="status" aria-label={t('shell.milkAssist.savedAria', { seconds: savedSeconds })}>✓ {t('shell.milkAssist.saved', { seconds: savedSeconds })}</span>
      : <button className="milk-pill__set" type="button" disabled={disabled} aria-label={t('shell.milkAssist.setAria', { seconds: state.suggestedSeconds, grams: state.milkGrams })} onClick={() => onSet(state.suggestedSeconds)}>{t('shell.milkAssist.set', { seconds: state.suggestedSeconds })}</button>}
    {calibrateButton}
  </div>
}
