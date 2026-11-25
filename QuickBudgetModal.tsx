import { useEffect, useState } from 'react';
import { Target, X } from 'lucide-react';
import type { Language } from '../types/expense';
import { TEXT, formatCurrency } from '../utils/i18n';

interface QuickBudgetModalProps {
  isOpen: boolean;
  currentBudget: number;
  lang: Language;
  onClose: () => void;
  onSaveBudget: (budget: number) => void;
}

const BUDGET_PRESETS = [2000, 3000, 5000, 8000, 10000];

export function QuickBudgetModal({
  isOpen,
  currentBudget,
  lang,
  onClose,
  onSaveBudget,
}: QuickBudgetModalProps) {
  const t = TEXT[lang];
  const [value, setValue] = useState(String(currentBudget || ''));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValue(String(currentBudget || ''));
    setError(null);
  }, [isOpen, currentBudget]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      setError(t.amountError);
      return;
    }
    onSaveBudget(Math.round(num));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-budget-title"
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl"
      >
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Target className="w-4 h-4" aria-hidden="true" />
            </span>
            <h2 id="quick-budget-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.quickBudgetTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.quickBudgetHint}</p>

          {error && (
            <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="quick-budget-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              {t.monthlyBudget} (BDT ৳)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-num text-xl font-bold text-slate-400">
                ৳
              </span>
              <input
                id="quick-budget-input"
                type="number"
                inputMode="numeric"
                min="0"
                autoFocus
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="5000"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono-num text-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setValue(String(preset));
                    if (error) setError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono-num font-semibold text-slate-700 dark:text-slate-200"
                >
                  {formatCurrency(preset, lang)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-2 min-h-[44px] px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
            >
              {t.saveBudget}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
