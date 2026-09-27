import { ratePer150Ml } from '../../domain/milkAssist'
import { t } from '../../i18n/index.ts'
import { useMilkAssist } from './milkAssistStore'

export function MilkAssistDialog({ onClose, onRecalibrate }: { onClose: () => void; onRecalibrate: () => void }) {
  const { milkAssist } = useMilkAssist()
  const calibrated = milkAssist.jugGrams !== null && milkAssist.calGrams !== null && milkAssist.calSeconds !== null
  return <div className="milk-dialog-backdrop" onClick={onClose}>
    <section className="milk-dialog" role="dialog" aria-modal="true" aria-labelledby="milk-dialog-title" onClick={(event) => event.stopPropagation()}>
      <h2 id="milk-dialog-title">{t('shell.milkAssist.title')}</h2>
      <p>{t('shell.milkAssist.dialogSubtitle')}</p>
      <div className="milk-dialog__row"><span>{t('shell.milkAssist.jugWeight')}</span><strong>{milkAssist.jugGrams ?? '—'}<small>g</small></strong></div>
      <div className="milk-dialog__row"><span>{t('shell.milkAssist.calibration')}</span><strong>{calibrated ? t('shell.milkAssist.pair', { grams: milkAssist.calGrams!, seconds: milkAssist.calSeconds! }) : '—'}</strong></div>
      <div className="milk-dialog__row"><span>{t('shell.milkAssist.rate')}</span><strong>{calibrated ? t('shell.milkAssist.ratePer150', { seconds: ratePer150Ml(milkAssist.calGrams!, milkAssist.calSeconds!) }) : '—'}</strong></div>
      <div className="milk-dialog__actions">
        <button className="milk-dialog__close" type="button" onClick={onClose}>{t('shell.milkAssist.close')}</button>
        <button className="milk-dialog__recalibrate" type="button" onClick={onRecalibrate}>{t('shell.milkAssist.recalibrate')} <span aria-hidden="true">›</span></button>
      </div>
    </section>
  </div>
}
