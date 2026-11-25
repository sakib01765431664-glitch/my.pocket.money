import { useMemo, useState } from 'react';
import type { Category, Expense, Language, ReportSubTab } from '../types/expense';
import {
  computeMonthlyComparison,
  computeMonthlyReport,
  computeWeeklyReport,
  getAvailableMonths,
  getMonthKey,
  getRecentMonthKeys,
  getTodayDateString,
} from '../utils/calculations';
import {
  TEXT,
  formatCurrency,
  formatDateLabel,
  formatMonthLabel,
  formatNumber,
  formatPercent,
} from '../utils/i18n';
import { CategoryIcon } from './CategoryIcon';
import { BarChart, PieDonutChart } from './Charts';

interface ReportsViewProps {
  expenses: Expense[];
  categories: Category[];
  lang: Language;
}

export function ReportsView({ expenses, categories, lang }: ReportsViewProps) {
  const t = TEXT[lang];
  const currentMonthKey = getMonthKey(getTodayDateString());
  const availableMonths = useMemo(() => getAvailableMonths(expenses), [expenses]);

  const [subTab, setSubTab] = useState<ReportSubTab>('weekly');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  const weeklyReport = useMemo(
    () => computeWeeklyReport(expenses, selectedMonth),
    [expenses, selectedMonth]
  );

  const monthlyReport = useMemo(
    () => computeMonthlyReport(expenses, categories, selectedMonth),
    [expenses, categories, selectedMonth]
  );

  const comparisonMonths = useMemo(() => {
    const recent = getRecentMonthKeys(6);
    const merged = new Set([...recent, ...availableMonths]);
    return Array.from(merged).sort().slice(-6);
  }, [availableMonths]);

  const comparisonData = useMemo(
    () => computeMonthlyComparison(expenses, comparisonMonths),
    [expenses, comparisonMonths]
  );

  const tabs: Array<{ id: ReportSubTab; label: string }> = [
    { id: 'weekly', label: t.tabWeekly },
    { id: 'monthly', label: t.tabMonthly },
    { id: 'comparison', label: t.tabComparison },
    { id: 'categories', label: t.tabCategories },
  ];

  const weeklyChartData = weeklyReport.weeks.map((w) => ({
    id: `w-${w.weekIndex}`,
    label: lang === 'bn' ? `সপ্তাহ ${formatNumber(w.weekIndex, lang)}` : `Wk ${w.weekIndex}`,
    sublabel: lang === 'bn' ? w.labelBn : w.labelEn,
    value: w.total,
    isHighlighted: weeklyReport.highestWeek?.weekIndex === w.weekIndex && w.total > 0,
  }));

  const comparisonChartData = comparisonData.items.map((item) => ({
    id: item.monthKey,
    label: formatMonthLabel(item.monthKey, lang, true),
    sublabel: formatMonthLabel(item.monthKey, lang),
    value: item.total,
    isHighlighted: comparisonData.highestMonth?.monthKey === item.monthKey && item.total > 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header + Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t.reportsTitle}
        </h1>

        {subTab !== 'comparison' && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label
              htmlFor="report-month-select"
              className="text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {t.filterByMonth}:
            </label>
            <select
              id="report-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              {availableMonths.map((mk) => (
                <option key={mk} value={mk}>
                  {formatMonthLabel(mk, lang)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Report Sub-Tabs */}
      <div
        role="tablist"
        aria-label={t.reportsTitle}
        className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Weekly Report */}
      {subTab === 'weekly' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.highestWeek}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {weeklyReport.highestWeek
                  ? formatCurrency(weeklyReport.highestWeek.total, lang)
                  : formatCurrency(0, lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {weeklyReport.highestWeek
                  ? lang === 'bn'
                    ? weeklyReport.highestWeek.labelBn
                    : weeklyReport.highestWeek.labelEn
                  : '—'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.lowestWeek}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {weeklyReport.lowestWeek
                  ? formatCurrency(weeklyReport.lowestWeek.total, lang)
                  : formatCurrency(0, lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {weeklyReport.lowestWeek
                  ? lang === 'bn'
                    ? weeklyReport.lowestWeek.labelBn
                    : weeklyReport.lowestWeek.labelEn
                  : '—'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.weeklyDailyAvg}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {formatCurrency(weeklyReport.overallWeeklyDailyAvg, lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatMonthLabel(selectedMonth, lang)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.vsPrevWeek}</p>
              <p
                className={`mt-2 text-xl font-bold font-mono-num ${
                  weeklyReport.weekDiffAmount > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : weeklyReport.weekDiffAmount < 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {weeklyReport.weekDiffAmount > 0 ? '+' : weeklyReport.weekDiffAmount < 0 ? '-' : ''}
                {formatCurrency(Math.abs(weeklyReport.weekDiffAmount), lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {weeklyReport.weekDiffPercent !== null
                  ? `${weeklyReport.weekDiffAmount >= 0 ? t.increasedBy : t.decreasedBy} (${formatPercent(Math.abs(weeklyReport.weekDiffPercent), lang)})`
                  : `${formatCurrency(weeklyReport.currentWeekTotal, lang)} vs ${formatCurrency(weeklyReport.previousWeekTotal, lang)}`}
              </p>
            </div>
          </div>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {t.weeklyReportTitle}
            </h2>
            <BarChart
              data={weeklyChartData}
              lang={lang}
              emptyText={t.noDataForReport}
              ariaLabel={t.weeklyReportTitle}
            />

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">
                      {lang === 'bn' ? 'সপ্তাহ' : 'Week'}
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right">
                      {lang === 'bn' ? 'এন্ট্রি' : 'Entries'}
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right">{t.dailyAverage}</th>
                    <th className="py-2.5 pl-4 font-medium text-right">
                      {lang === 'bn' ? 'মোট খরচ' : 'Total'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {weeklyReport.weeks.map((w) => (
                    <tr key={w.weekIndex}>
                      <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">
                        {lang === 'bn' ? w.labelBn : w.labelEn}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-600 dark:text-slate-400">
                        {formatNumber(w.entryCount, lang)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-600 dark:text-slate-400">
                        {formatCurrency(w.dailyAverage, lang)}
                      </td>
                      <td className="py-3 pl-4 text-right font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(w.total, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* 2. Monthly Report */}
      {subTab === 'monthly' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.thisMonthTotal}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {formatCurrency(monthlyReport.total, lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {monthlyReport.startDate} – {monthlyReport.endDate}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.dailyAverage}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {formatCurrency(monthlyReport.dailyAverage, lang)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.monthEntries}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {formatNumber(monthlyReport.entryCount, lang)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.highestDay}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {monthlyReport.highestDay
                  ? formatCurrency(monthlyReport.highestDay.total, lang)
                  : formatCurrency(0, lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {monthlyReport.highestDay
                  ? formatDateLabel(monthlyReport.highestDay.date, lang)
                  : '—'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.lowestDay}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {monthlyReport.lowestDay
                  ? formatCurrency(monthlyReport.lowestDay.total, lang)
                  : formatCurrency(0, lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {monthlyReport.lowestDay
                  ? formatDateLabel(monthlyReport.lowestDay.date, lang)
                  : '—'}
              </p>
            </div>
          </div>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {t.categoryBreakdown}
            </h2>
            {monthlyReport.categoryBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t.noDataForReport}
              </p>
            ) : (
              <div className="space-y-4">
                {monthlyReport.categoryBreakdown.map((item) => (
                  <div key={item.categoryId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: item.color }}
                        >
                          <CategoryIcon icon={item.icon} className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {lang === 'bn' ? item.nameBn : item.nameEn}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          · {formatNumber(item.entryCount, lang)} {t.entriesCountSuffix}
                        </span>
                      </div>
                      <div className="font-mono-num flex items-center gap-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.total, lang)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right">
                          {formatPercent(item.percentage, lang)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(item.percentage, 100)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 3. Monthly Comparison */}
      {subTab === 'comparison' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.highestMonth}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {comparisonData.highestMonth
                  ? formatCurrency(comparisonData.highestMonth.total, lang)
                  : formatCurrency(0, lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {comparisonData.highestMonth
                  ? formatMonthLabel(comparisonData.highestMonth.monthKey, lang)
                  : '—'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.lowestMonth}</p>
              <p className="mt-2 text-xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                {comparisonData.lowestMonth
                  ? formatCurrency(comparisonData.lowestMonth.total, lang)
                  : formatCurrency(0, lang)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {comparisonData.lowestMonth
                  ? formatMonthLabel(comparisonData.lowestMonth.monthKey, lang)
                  : '—'}
              </p>
            </div>
          </div>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {t.monthComparisonTitle}
            </h2>
            <BarChart
              data={comparisonChartData}
              lang={lang}
              emptyText={t.noDataForReport}
              ariaLabel={t.monthComparisonTitle}
            />

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">
                      {lang === 'bn' ? 'মাস' : 'Month'}
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right">
                      {lang === 'bn' ? 'মোট খরচ' : 'Total Spent'}
                    </th>
                    <th className="py-2.5 pl-4 font-medium text-right">{t.monthOverMonth}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comparisonData.items.map((item) => (
                    <tr key={item.monthKey}>
                      <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">
                        {formatMonthLabel(item.monthKey, lang)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.total, lang)}
                      </td>
                      <td
                        className={`py-3 pl-4 text-right font-mono-num text-xs font-semibold ${
                          item.diffAmount > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.diffAmount < 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.diffAmount === 0
                          ? '—'
                          : `${item.diffAmount > 0 ? '+' : '-'}${formatCurrency(Math.abs(item.diffAmount), lang)}${
                              item.diffPercent !== null
                                ? ` (${formatPercent(Math.abs(item.diffPercent), lang)})`
                                : ''
                            }`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* 4. Category Analysis (Pie Chart + Percentages) */}
      {subTab === 'categories' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">
            {t.categoryAnalysisTitle} · {formatMonthLabel(selectedMonth, lang)}
          </h2>
          <PieDonutChart
            items={monthlyReport.categoryBreakdown}
            total={monthlyReport.total}
            lang={lang}
            emptyText={t.noDataForReport}
          />
        </section>
      )}
    </div>
  );
}
