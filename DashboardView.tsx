import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  CalendarCheck2,
  Coins,
  Pencil,
  Plus,
  PlusCircle,
  ReceiptText,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type {
  BudgetSummary,
  Category,
  DashboardMetrics,
  Expense,
  Language,
} from '../types/expense';
import {
  TEXT,
  formatCurrency,
  formatDateLabel,
  formatMonthLabel,
  formatNumber,
  formatPercent,
  formatTime12h,
  getCategoryName,
} from '../utils/i18n';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  monthIncomeTotal: number;
  budgetSummary: BudgetSummary;
  recentExpenses: Expense[];
  categories: Category[];
  lang: Language;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onViewTodaysExpenses: () => void;
  onOpenQuickBudget: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onViewHistory: () => void;
}

export function DashboardView({
  metrics,
  monthIncomeTotal,
  budgetSummary,
  recentExpenses,
  categories,
  lang,
  onAddExpense,
  onAddIncome,
  onViewTodaysExpenses,
  onOpenQuickBudget,
  onEditExpense,
  onDeleteExpense,
  onViewHistory,
}: DashboardViewProps) {
  const t = TEXT[lang];
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const monthLabel = formatMonthLabel(metrics.currentMonthKey, lang);
  const upToText =
    lang === 'bn'
      ? `১ – ${formatNumber(metrics.calculatedUpToDay, lang)} তারিখ`
      : `Day 1 – ${metrics.calculatedUpToDay} of ${metrics.daysInMonth}`;

  const pocketBalance = monthIncomeTotal - metrics.monthTotal;

  const renderMoMText = () => {
    if (metrics.lastMonthTotal === 0 && metrics.monthTotal === 0) {
      return {
        primary: formatCurrency(0, lang),
        sub: t.noLastMonthData,
        tone: 'neutral' as const,
      };
    }
    if (metrics.lastMonthTotal === 0 && metrics.monthTotal > 0) {
      return {
        primary: `+${formatCurrency(metrics.monthTotal, lang)}`,
        sub: t.noLastMonthData,
        tone: 'up' as const,
      };
    }
    if (metrics.monthDiffAmount === 0) {
      return {
        primary: formatCurrency(0, lang),
        sub: t.sameAsLastMonth,
        tone: 'neutral' as const,
      };
    }
    const isUp = metrics.monthDiffAmount > 0;
    const pctText =
      metrics.monthDiffPercent !== null
        ? ` (${formatPercent(Math.abs(metrics.monthDiffPercent), lang)})`
        : '';
    return {
      primary: `${isUp ? '+' : '-'}${formatCurrency(Math.abs(metrics.monthDiffAmount), lang)}`,
      sub: `${isUp ? t.increasedBy : t.decreasedBy}${pctText}`,
      tone: isUp ? ('up' as const) : ('down' as const),
    };
  };

  const mom = renderMoMText();
  const clampedPercent = Math.min(Math.max(budgetSummary.percentUsed, 0), 100);

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {monthLabel}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5 text-balance">
            {t.dashboardTitle}
          </h1>
        </div>
        <button
          type="button"
          onClick={onAddExpense}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-semibold text-sm shadow-sm shadow-emerald-600/20 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* Dedicated Quick Action Section (4 Requested Working Shortcuts) */}
      <section aria-label={t.quickActionsTitle} className="space-y-3">
        <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
          {t.quickActionsTitle}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Add Expense */}
          <button
            type="button"
            onClick={onAddExpense}
            className="min-h-[68px] p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 active:scale-[0.98] transition-all text-left flex items-center gap-3 shadow-xs"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
                {t.qaAddExpense}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t.qaAddExpenseSub}
              </p>
            </div>
          </button>

          {/* 2. Add Income */}
          <button
            type="button"
            onClick={onAddIncome}
            className="min-h-[68px] p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/60 hover:border-sky-400 dark:hover:border-sky-700 hover:bg-sky-50/40 dark:hover:bg-sky-950/30 active:scale-[0.98] transition-all text-left flex items-center gap-3 shadow-xs"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
                {t.qaAddIncome}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                {monthIncomeTotal > 0
                  ? formatCurrency(monthIncomeTotal, lang)
                  : t.qaAddIncomeSub}
              </p>
            </div>
          </button>

          {/* 3. Today's Expense */}
          <button
            type="button"
            onClick={onViewTodaysExpenses}
            className="min-h-[68px] p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200/80 dark:border-violet-900/60 hover:border-violet-400 dark:hover:border-violet-700 hover:bg-violet-50/40 dark:hover:bg-violet-950/30 active:scale-[0.98] transition-all text-left flex items-center gap-3 shadow-xs"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
                {t.qaTodaysExpense}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                {formatCurrency(metrics.todayTotal, lang)}
              </p>
            </div>
          </button>

          {/* 4. Set Monthly Budget */}
          <button
            type="button"
            onClick={onOpenQuickBudget}
            className="min-h-[68px] p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 active:scale-[0.98] transition-all text-left flex items-center gap-3 shadow-xs"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
                {t.qaSetBudget}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                {budgetSummary.budget > 0
                  ? formatCurrency(budgetSummary.budget, lang)
                  : t.qaSetBudgetSub}
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Primary KPI Grid — 7 Requested Dashboard Metrics with Vibrant Colorful Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. This Month Total (Featured Gradient Hero Card) */}
        <div className="sm:col-span-2 rounded-2xl p-5 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white shadow-sm shadow-emerald-700/15 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-emerald-50">
              {t.thisMonthTotal}
            </span>
            <span className="text-xs font-medium text-emerald-100 tabular-nums">
              {upToText}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p
              data-testid="metric-month-total"
              className="text-3xl sm:text-4xl font-extrabold font-mono-num tracking-tight text-white"
            >
              {formatCurrency(metrics.monthTotal, lang)}
            </p>
            <span className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-white" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-50">
            <span className="tabular-nums">
              {t.monthEntries}:{' '}
              <strong className="font-bold text-white">
                {formatNumber(metrics.entryCount, lang)} {t.entriesCountSuffix}
              </strong>
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-emerald-200">
              ·
            </span>
            <span className="tabular-nums">
              {t.calculatedUpTo}:{' '}
              <strong className="font-bold text-white">
                {formatNumber(metrics.calculatedUpToDay, lang)} {t.dayLabel}
              </strong>
            </span>
          </div>
        </div>

        {/* 2. Today's Total */}
        <div className="bg-sky-50/75 dark:bg-sky-950/25 border border-sky-200/80 dark:border-sky-900/60 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-sky-900 dark:text-sky-200">
              {t.todayTotal}
            </span>
            <span className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <p
            data-testid="metric-today-total"
            className="mt-3 text-2xl sm:text-3xl font-bold font-mono-num text-slate-900 dark:text-slate-100"
          >
            {formatCurrency(metrics.todayTotal, lang)}
          </p>
          <p className="mt-3 text-xs font-medium text-sky-800/80 dark:text-sky-300/80">
            {formatDateLabel(
              `${metrics.currentMonthKey}-${String(metrics.calculatedUpToDay).padStart(2, '0')}`,
              lang
            )}
          </p>
        </div>

        {/* 3. This Week's Total */}
        <div className="bg-violet-50/75 dark:bg-violet-950/25 border border-violet-200/80 dark:border-violet-900/60 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-violet-900 dark:text-violet-200">
              {t.thisWeekTotal}
            </span>
            <span className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <p
            data-testid="metric-week-total"
            className="mt-3 text-2xl sm:text-3xl font-bold font-mono-num text-slate-900 dark:text-slate-100"
          >
            {formatCurrency(metrics.weekTotal, lang)}
          </p>
          <p className="mt-3 text-xs font-medium text-violet-800/80 dark:text-violet-300/80">
            {lang === 'bn' ? 'রবিবার – শনিবার' : 'Sun – Sat'}
          </p>
        </div>

        {/* 4. Daily Average */}
        <div className="bg-amber-50/75 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {t.dailyAverage}
            </span>
            <span className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <p
            data-testid="metric-daily-avg"
            className="mt-3 text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100"
          >
            {formatCurrency(metrics.dailyAverage, lang)}
          </p>
          <p className="mt-2 text-xs font-medium text-amber-800/80 dark:text-amber-300/80 tabular-nums">
            {upToText}
          </p>
        </div>

        {/* 5. Month Entries Count */}
        <div className="bg-teal-50/75 dark:bg-teal-950/25 border border-teal-200/80 dark:border-teal-900/60 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-teal-900 dark:text-teal-200">
              {t.monthEntries}
            </span>
            <span className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <ReceiptText className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <p
            data-testid="metric-entry-count"
            className="mt-3 text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100"
          >
            {formatNumber(metrics.entryCount, lang)}
          </p>
          <p className="mt-2 text-xs font-medium text-teal-800/80 dark:text-teal-300/80">
            {t.entriesCountSuffix}
          </p>
        </div>

        {/* 6. vs Last Month Comparison */}
        <div
          className={`rounded-2xl p-5 border flex flex-col justify-between ${
            mom.tone === 'up'
              ? 'bg-rose-50/75 dark:bg-rose-950/25 border-rose-200/80 dark:border-rose-900/60'
              : mom.tone === 'down'
                ? 'bg-emerald-50/75 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-900/60'
                : 'bg-slate-100/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.vsLastMonth}
            </span>
            <span
              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 ${
                mom.tone === 'up'
                  ? 'bg-rose-600'
                  : mom.tone === 'down'
                    ? 'bg-emerald-600'
                    : 'bg-slate-600'
              }`}
            >
              {mom.tone === 'down' ? (
                <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              )}
            </span>
          </div>
          <p
            className={`mt-3 text-2xl font-bold font-mono-num ${
              mom.tone === 'up'
                ? 'text-rose-700 dark:text-rose-400'
                : mom.tone === 'down'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {mom.primary}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            {mom.sub}
          </p>
        </div>

        {/* 7. Calculated Up To Date */}
        <div className="bg-indigo-50/75 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              {t.calculatedUpTo}
            </span>
            <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
            {formatNumber(metrics.calculatedUpToDay, lang)} /{' '}
            {formatNumber(metrics.daysInMonth, lang)}
          </p>
          <p className="mt-2 text-xs font-medium text-indigo-800/80 dark:text-indigo-300/80">
            {monthLabel}
          </p>
        </div>
      </div>

      {/* Pocket Income & Balance Strip (shown whenever income entries exist for this month) */}
      {monthIncomeTotal > 0 && (
        <section
          aria-label={t.thisMonthIncome}
          className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-sky-50 via-blue-50/70 to-indigo-50 dark:from-sky-950/35 dark:via-blue-950/25 dark:to-indigo-950/30 border border-sky-200 dark:border-sky-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs font-medium text-sky-800 dark:text-sky-300">
                {t.thisMonthIncome}
              </p>
              <p
                data-testid="metric-month-income"
                className="text-xl font-bold font-mono-num text-sky-700 dark:text-sky-300 mt-0.5"
              >
                {formatCurrency(monthIncomeTotal, lang)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {t.pocketBalance}
              </p>
              <p
                data-testid="metric-pocket-balance"
                className={`text-xl font-bold font-mono-num mt-0.5 ${
                  pocketBalance < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(pocketBalance, lang)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAddIncome}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <Banknote className="w-4 h-4" aria-hidden="true" />
            <span>{t.qaAddIncome}</span>
          </button>
        </section>
      )}

      {/* Budget System Status Card */}
      <section
        aria-label={t.monthlyBudget}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Target className="w-4 h-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.monthlyBudget}
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenQuickBudget}
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 min-h-[36px] px-2"
          >
            {budgetSummary.status === 'unset' ? t.setBudget : t.editBudget}
          </button>
        </div>

        {budgetSummary.status === 'unset' ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t.budgetUnset}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {budgetSummary.status === 'warning' && (
              <div
                role="alert"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-sm font-medium"
              >
                <AlertTriangle
                  className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                <span>{t.budgetWarning80}</span>
              </div>
            )}
            {budgetSummary.status === 'exceeded' && (
              <div
                role="alert"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-sm font-medium"
              >
                <AlertTriangle
                  className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400"
                  aria-hidden="true"
                />
                <span>{t.budgetExceeded}</span>
              </div>
            )}

            <div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    budgetSummary.status === 'exceeded'
                      ? 'bg-gradient-to-r from-rose-500 to-red-600'
                      : budgetSummary.status === 'warning'
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                  style={{ width: `${clampedPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.totalBudget}</p>
                <p className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(budgetSummary.budget, lang)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.spentSoFar}</p>
                <p className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(budgetSummary.spent, lang)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {budgetSummary.remaining >= 0 ? t.remainingBudget : t.overspentBy}
                </p>
                <p
                  className={`mt-0.5 font-mono-num font-semibold ${
                    budgetSummary.remaining < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {formatCurrency(Math.abs(budgetSummary.remaining), lang)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.budgetUsed}</p>
                <p className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                  {formatPercent(budgetSummary.percentUsed, lang)}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Recent Expenses / Empty State */}
      <section
        aria-label={t.recentExpenses}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.recentExpenses}
          </h2>
          {recentExpenses.length > 0 && (
            <button
              type="button"
              onClick={onViewHistory}
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>{t.viewAllHistory}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {t.noExpensesYet}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {t.noExpensesHint}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onAddExpense}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{t.addFirstExpense}</span>
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentExpenses.map((exp) => {
              const cat = catMap.get(exp.categoryId);
              const catName = getCategoryName(cat, lang);
              const label = exp.description.trim() || catName;
              return (
                <li
                  key={exp.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: cat?.color ?? '#64748B' }}
                    >
                      <CategoryIcon icon={cat?.icon ?? 'more-horizontal'} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{catName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateLabel(exp.date, lang)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatTime12h(exp.time, lang)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono-num text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mr-1">
                      {formatCurrency(exp.amount, lang)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditExpense(exp)}
                      aria-label={`${t.edit} ${label}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp.id)}
                      aria-label={`${t.delete} ${label}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
