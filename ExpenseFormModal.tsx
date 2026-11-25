import { useEffect, useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import type { Category, Expense, Language } from '../types/expense';
import { getCurrentTimeString, getTodayDateString } from '../utils/calculations';
import { TEXT, formatCurrency, getCategoryName } from '../utils/i18n';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseFormModalProps {
  isOpen: boolean;
  editingExpense: Expense | null;
  categories: Category[];
  lang: Language;
  defaultDate?: string;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    amount: number;
    categoryId: string;
    description: string;
    date: string;
    time: string;
  }) => void;
  onOpenCategoryManager: () => void;
}

const PRESET_AMOUNTS = [20, 50, 100, 250, 500];

export function ExpenseFormModal({
  isOpen,
  editingExpense,
  categories,
  lang,
  defaultDate,
  onClose,
  onSave,
  onOpenCategoryManager,
}: ExpenseFormModalProps) {
  const t = TEXT[lang];

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 'cat_food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingExpense) {
      setAmount(String(editingExpense.amount));
      setCategoryId(editingExpense.categoryId);
      setDescription(editingExpense.description);
      setDate(editingExpense.date);
      setTime(editingExpense.time);
    } else {
      setAmount('');
      setCategoryId(categories[0]?.id ?? 'cat_food');
      setDescription('');
      setDate(defaultDate || getTodayDateString());
      setTime(getCurrentTimeString());
    }
    setError(null);
  }, [isOpen, editingExpense, categories, defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(t.amountError);
      return;
    }
    if (!categoryId) {
      setError(t.categoryError);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError(t.dateError);
      return;
    }

    onSave({
      id: editingExpense?.id,
      amount: Math.round(numericAmount * 100) / 100,
      categoryId,
      description: description.trim(),
      date,
      time: /^\d{2}:\d{2}$/.test(time) ? time : '12:00',
    });
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
        aria-labelledby="expense-modal-title"
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <h2
            id="expense-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            {editingExpense ? t.editExpenseTitle : t.newExpenseTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div
              role="alert"
              className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-sm font-medium"
            >
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label
              htmlFor="expense-amount-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              {t.amountLabel}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-num text-xl font-bold text-slate-400">
                ৳
              </span>
              <input
                id="expense-amount-input"
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
                placeholder={t.amountPlaceholder}
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(String(preset));
                    if (error) setError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono-num font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  {formatCurrency(preset, lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t.categoryLabel}
              </span>
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <FolderPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.newCategoryBtn}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const selected = categoryId === cat.id;
                const name = getCategoryName(cat, lang);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    aria-pressed={selected}
                    className={`min-h-[48px] px-2.5 py-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 dark:border-emerald-500 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon icon={cat.icon} className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="expense-description-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              {t.descriptionLabel}
            </label>
            <input
              id="expense-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              maxLength={120}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="expense-date-input"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                {t.dateLabel}
              </label>
              <input
                id="expense-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="expense-time-input"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                {t.timeLabel}
              </label>
              <input
                id="expense-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-2 min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors"
            >
              {editingExpense ? t.updateExpense : t.saveExpense}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
