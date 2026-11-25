import { useEffect } from 'react';
import { CalendarCheck2, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Category, Expense, Language } from '../types/expense';
import { getTodayDateString } from '../utils/calculations';
import {
  TEXT,
  formatCurrency,
  formatDateLabel,
  formatNumber,
  formatTime12h,
  getCategoryName,
} from '../utils/i18n';
import { CategoryIcon } from './CategoryIcon';

interface TodaysExpensesModalProps {
  isOpen: boolean;
  expenses: Expense[];
  categories: Category[];
  lang: Language;
  onClose: () => void;
  onAddTodayExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export function TodaysExpensesModal({
  isOpen,
  expenses,
  categories,
  lang,
  onClose,
  onAddTodayExpense,
  onEditExpense,
  onDeleteExpense,
}: TodaysExpensesModalProps) {
  const t = TEXT[lang];
  const todayStr = getTodayDateString();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const todaysEntries = expenses
    .filter((e) => e.date === todayStr)
    .sort((a, b) => {
      if (a.time !== b.time) return b.time.localeCompare(a.time);
      return b.createdAt - a.createdAt;
    });
  const todaysTotal = todaysEntries.reduce((sum, e) => sum + e.amount, 0);

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
        aria-labelledby="todays-modal-title"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="todays-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t.todaysExpensesTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDateLabel(todayStr, lang)}
              </p>
            </div>
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

        <div className="p-5 space-y-5">
          {/* Today's Total Banner */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-violet-100">{t.todayTotal}</p>
              <p className="text-3xl font-extrabold font-mono-num mt-0.5">
                {formatCurrency(todaysTotal, lang)}
              </p>
              <p className="text-xs text-violet-100 mt-1 tabular-nums">
                {formatNumber(todaysEntries.length, lang)} {t.entriesCountSuffix}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddTodayExpense();
              }}
              className="min-h-[42px] px-4 rounded-xl bg-white text-violet-700 hover:bg-violet-50 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{t.qaAddExpense}</span>
            </button>
          </div>

          {todaysEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.noExpensesToday}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {todaysEntries.map((exp) => {
                const cat = catMap.get(exp.categoryId);
                const catName = getCategoryName(cat, lang);
                const label = exp.description.trim() || catName;
                return (
                  <li
                    key={exp.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat?.color ?? '#64748B' }}
                      >
                        <CategoryIcon icon={cat?.icon ?? 'more-horizontal'} className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {catName} · {formatTime12h(exp.time, lang)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100 mr-1">
                        {formatCurrency(exp.amount, lang)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditExpense(exp);
                        }}
                        aria-label={`${t.edit} ${label}`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        aria-label={`${t.delete} ${label}`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
