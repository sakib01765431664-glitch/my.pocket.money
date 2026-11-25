import { useEffect, useState } from 'react';
import { Banknote, Trash2, X } from 'lucide-react';
import type { IncomeEntry, Language } from '../types/expense';
import {
  getCurrentTimeString,
  getMonthKey,
  getTodayDateString,
} from '../utils/calculations';
import {
  TEXT,
  formatCurrency,
  formatDateLabel,
  formatTime12h,
} from '../utils/i18n';

interface IncomeFormModalProps {
  isOpen: boolean;
  incomes: IncomeEntry[];
  lang: Language;
  onClose: () => void;
  onSaveIncome: (data: {
    amount: number;
    source: string;
    note: string;
    date: string;
    time: string;
  }) => void;
  onDeleteIncome: (incomeId: string) => void;
}

const INCOME_PRESETS = [500, 1000, 2000, 5000];

const INCOME_SOURCES = [
  { bn: 'পকেট মানি', en: 'Pocket Money' },
  { bn: 'টিউশন', en: 'Tuition' },
  { bn: 'বেতন', en: 'Salary' },
  { bn: 'বোনাস', en: 'Bonus' },
  { bn: 'উপহার', en: 'Gift' },
  { bn: 'অন্যান্য', en: 'Other' },
];

export function IncomeFormModal({
  isOpen,
  incomes,
  lang,
  onClose,
  onSaveIncome,
  onDeleteIncome,
}: IncomeFormModalProps) {
  const t = TEXT[lang];
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState(lang === 'bn' ? INCOME_SOURCES[0].bn : INCOME_SOURCES[0].en);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAmount('');
    setSource(lang === 'bn' ? INCOME_SOURCES[0].bn : INCOME_SOURCES[0].en);
    setNote('');
    setDate(getTodayDateString());
    setTime(getCurrentTimeString());
    setError(null);
  }, [isOpen, lang]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentMonthKey = getMonthKey(getTodayDateString());
  const monthIncomes = incomes
    .filter((inc) => getMonthKey(inc.date) === currentMonthKey)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError(t.amountError);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError(t.dateError);
      return;
    }
    onSaveIncome({
      amount: Math.round(num * 100) / 100,
      source: source.trim() || (lang === 'bn' ? 'অন্যান্য' : 'Other'),
      note: note.trim(),
      date,
      time: /^\d{2}:\d{2}$/.test(time) ? time : '12:00',
    });
    setAmount('');
    setNote('');
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
        aria-labelledby="income-modal-title"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" aria-hidden="true" />
            </span>
            <h2 id="income-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.addIncomeTitle}
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

        <div className="p-5 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-sm font-medium"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="income-amount-input"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                {t.amountLabel}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-num text-xl font-bold text-slate-400">
                  ৳
                </span>
                <input
                  id="income-amount-input"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  autoFocus
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={lang === 'bn' ? 'যেমন: ২০০০' : 'e.g. 2000'}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num text-xl font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {INCOME_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(String(preset));
                      if (error) setError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono-num font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {formatCurrency(preset, lang)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                {t.incomeSourceLabel}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {INCOME_SOURCES.map((item) => {
                  const label = lang === 'bn' ? item.bn : item.en;
                  const active = source === label;
                  return (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => setSource(label)}
                      aria-pressed={active}
                      className={`min-h-[42px] px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all truncate ${
                        active
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="income-note-input"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                {t.incomeNoteLabel}
              </label>
              <input
                id="income-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.incomeNotePlaceholder}
                maxLength={120}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="income-date-input"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {t.dateLabel}
                </label>
                <input
                  id="income-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono-num text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="income-time-input"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {t.timeLabel}
                </label>
                <input
                  id="income-time-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono-num text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-2 min-h-[46px] px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-sm font-semibold text-white transition-colors"
              >
                {t.saveIncome}
              </button>
            </div>
          </form>

          {/* This Month Income Entries */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              {t.recentIncomes}
            </h3>
            {monthIncomes.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.noIncomesYet}</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {monthIncomes.map((inc) => (
                  <li
                    key={inc.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/40"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {inc.note || inc.source}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {inc.source} · {formatDateLabel(inc.date, lang)} · {formatTime12h(inc.time, lang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-num text-sm font-bold text-sky-700 dark:text-sky-400">
                        +{formatCurrency(inc.amount, lang)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteIncome(inc.id)}
                        aria-label={`${t.delete} ${inc.note || inc.source}`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
