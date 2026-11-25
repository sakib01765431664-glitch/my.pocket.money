import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Category,
  Expense,
  ExpenseFilters,
  HistoryViewMode,
  Language,
} from '../types/expense';
import {
  filterExpenses,
  getAvailableMonths,
  getCalendarDayTotals,
  getDaysInMonth,
  getMonthKey,
  getPreviousMonthKey,
  getTodayDateString,
  groupExpensesByDate,
  pad2,
} from '../utils/calculations';
import {
  TEXT,
  formatCurrency,
  formatDateLabel,
  formatMonthLabel,
  formatNumber,
  formatTime12h,
  getCategoryName,
  getWeekdayHeaders,
} from '../utils/i18n';
import { CategoryIcon } from './CategoryIcon';

interface HistoryViewProps {
  expenses: Expense[];
  categories: Category[];
  lang: Language;
  onAddExpense: (defaultDate?: string) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const INITIAL_FILTERS: ExpenseFilters = {
  searchQuery: '',
  date: '',
  month: '',
  categoryId: '',
  minAmount: '',
  maxAmount: '',
};

function getNextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${pad2(m + 1)}`;
}

export function HistoryView({
  expenses,
  categories,
  lang,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: HistoryViewProps) {
  const t = TEXT[lang];
  const todayStr = getTodayDateString();
  const [viewMode, setViewMode] = useState<HistoryViewMode>('list');
  const [filters, setFilters] = useState<ExpenseFilters>(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState<string>(getMonthKey(todayStr));
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const availableMonths = useMemo(() => getAvailableMonths(expenses), [expenses]);

  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, categories, filters),
    [expenses, categories, filters]
  );

  const groupedList = useMemo(
    () => groupExpensesByDate(filteredExpenses),
    [filteredExpenses]
  );

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
      filters.date ||
      filters.month ||
      filters.categoryId ||
      filters.minAmount ||
      filters.maxAmount
  );

  // Calendar grid calculations
  const calendarDayTotals = useMemo(
    () => getCalendarDayTotals(expenses, calendarMonth),
    [expenses, calendarMonth]
  );

  const calendarCells = useMemo(() => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const firstDayWeekday = new Date(y, m - 1, 1).getDay(); // 0..6
    const daysInMonth = getDaysInMonth(calendarMonth);
    const cells: Array<{ dateStr: string; day: number } | null> = [];
    for (let i = 0; i < firstDayWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        dateStr: `${calendarMonth}-${pad2(d)}`,
        day: d,
      });
    }
    return cells;
  }, [calendarMonth]);

  const selectedDateExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [expenses, selectedDate]);

  const selectedDateTotal = useMemo(
    () => selectedDateExpenses.reduce((sum, e) => sum + e.amount, 0),
    [selectedDateExpenses]
  );

  const weekdayHeaders = getWeekdayHeaders(lang);

  const renderExpenseRow = (exp: Expense) => {
    const cat = catMap.get(exp.categoryId);
    const catName = getCategoryName(cat, lang);
    const label = exp.description.trim() || catName;
    return (
      <li
        key={exp.id}
        className="px-4 py-3.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: cat?.color ?? '#64748B' }}
          >
            <CategoryIcon icon={cat?.icon ?? 'more-horizontal'} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {label}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>{catName}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatTime12h(exp.time, lang)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100 mr-1">
            {formatCurrency(exp.amount, lang)}
          </span>
          <button
            type="button"
            onClick={() => onEditExpense(exp)}
            aria-label={`${t.edit} ${label}`}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteExpense(exp.id)}
            aria-label={`${t.delete} ${label}`}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t.historyTitle}
        </h1>

        <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4" aria-hidden="true" />
            <span>{t.listView}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            <span>{t.calendarView}</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label={t.searchPlaceholder}
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
                  }
                  placeholder={t.searchPlaceholder}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                aria-expanded={showFilters}
                className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  showFilters || hasActiveFilters
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Filter className="w-4 h-4" aria-hidden="true" />
                <span>{lang === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
              </button>
            </div>

            {showFilters && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label
                    htmlFor="filter-month"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {t.filterByMonth}
                  </label>
                  <select
                    id="filter-month"
                    value={filters.month}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, month: e.target.value, date: '' }))
                    }
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">{t.allMonths}</option>
                    {availableMonths.map((mk) => (
                      <option key={mk} value={mk}>
                        {formatMonthLabel(mk, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-date"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {t.filterByDate}
                  </label>
                  <input
                    id="filter-date"
                    type="date"
                    value={filters.date}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, date: e.target.value, month: '' }))
                    }
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono-num text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-category"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {t.filterByCategory}
                  </label>
                  <select
                    id="filter-category"
                    value={filters.categoryId}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">{t.allCategories}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getCategoryName(c, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-min-amt"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {t.minAmount}
                  </label>
                  <input
                    id="filter-min-amt"
                    type="number"
                    min="0"
                    value={filters.minAmount}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, minAmount: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono-num text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-max-amt"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {t.maxAmount}
                  </label>
                  <input
                    id="filter-max-amt"
                    type="number"
                    min="0"
                    value={filters.maxAmount}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))
                    }
                    placeholder="5000"
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono-num text-slate-900 dark:text-slate-100"
                  />
                </div>

                {hasActiveFilters && (
                  <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFilters(INITIAL_FILTERS)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline py-1"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.clearFilters}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Daily Grouped History */}
          {groupedList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {hasActiveFilters ? t.noMatchingExpenses : t.noExpensesYet}
              </p>
              {!hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => onAddExpense()}
                  className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{t.addExpense}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedList.map((group) => (
                <section
                  key={group.date}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
                >
                  <header className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <span>{formatDateLabel(group.date, lang)}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        · {formatNumber(group.entries.length, lang)} {t.entriesCountSuffix}
                      </span>
                    </div>
                    <span className="text-sm font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                      {t.dailyTotal}: {formatCurrency(group.total, lang)}
                    </span>
                  </header>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.entries.map(renderExpenseRow)}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => getPreviousMonthKey(m))}
                aria-label={lang === 'bn' ? 'আগের মাস' : 'Previous month'}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formatMonthLabel(calendarMonth, lang)}
              </h2>
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => getNextMonthKey(m))}
                aria-label={lang === 'bn' ? 'পরের মাস' : 'Next month'}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdayHeaders.map((wd) => (
                <div
                  key={wd}
                  className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-1.5"
                >
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="h-16 sm:h-18" />;
                }
                const info = calendarDayTotals.get(cell.dateStr);
                const isSelected = selectedDate === cell.dateStr;
                const isToday = todayStr === cell.dateStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    aria-label={`${formatDateLabel(cell.dateStr, lang)} ${
                      info ? formatCurrency(info.total, lang) : formatCurrency(0, lang)
                    }`}
                    aria-pressed={isSelected}
                    className={`h-16 sm:h-18 p-1.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-500 ring-1 ring-emerald-500'
                        : isToday
                          ? 'border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold font-mono-num ${
                        isSelected
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {formatNumber(cell.day, lang)}
                    </span>
                    {info ? (
                      <span className="text-[10px] sm:text-[11px] font-mono-num font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-full">
                        {formatCurrency(info.total, lang)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 dark:text-slate-700">—</span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t.selectCalendarDate}
            </p>
          </div>

          {/* Selected Date Details */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <header className="px-4 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.selectedDateExpenses}
                </p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatDateLabel(selectedDate, lang)}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-num text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(selectedDateTotal, lang)}
                </span>
                <button
                  type="button"
                  onClick={() => onAddExpense(selectedDate)}
                  aria-label={`${t.addExpense} (${selectedDate})`}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </header>

            {selectedDateExpenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t.noExpensesOnDate}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedDateExpenses.map(renderExpenseRow)}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
