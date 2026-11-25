import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../constants/defaults';
import type {
  AppDataBackup,
  AppSettings,
  BudgetSummary,
  Category,
  CategoryBreakdownItem,
  DailyHistoryGroup,
  DashboardMetrics,
  DaySummary,
  Expense,
  ExpenseFilters,
  IncomeEntry,
  MonthlyComparisonData,
  MonthlyComparisonItem,
  MonthlyReportData,
  WeeklyBucket,
  WeeklyReportData,
} from '../types/expense';

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getTodayDateString(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function getCurrentTimeString(now: Date = new Date()): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getPreviousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${pad2(m - 1)}`;
}

export function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return getTodayDateString(dt);
}

export function getWeekBounds(dateStr: string): { start: string; end: string } {
  // Week starts Saturday (standard in Bangladesh) or Sunday? Let's use Saturday–Friday or Sunday–Saturday?
  // Using Sunday–Saturday (0..6) aligns with standard Calendar grid Sunday–Saturday.
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayOfWeek = dt.getDay(); // 0 = Sun ... 6 = Sat
  const start = addDays(dateStr, -dayOfWeek);
  const end = addDays(start, 6);
  return { start, end };
}

export function computeDashboardMetrics(
  expenses: Expense[],
  now: Date = new Date()
): DashboardMetrics {
  const todayStr = getTodayDateString(now);
  const currentMonthKey = getMonthKey(todayStr);
  const prevMonthKey = getPreviousMonthKey(currentMonthKey);
  const currentDay = now.getDate();
  const daysInMonth = getDaysInMonth(currentMonthKey);
  const { start: weekStart, end: weekEnd } = getWeekBounds(todayStr);

  let monthTotal = 0;
  let todayTotal = 0;
  let weekTotal = 0;
  let entryCount = 0;
  let lastMonthTotal = 0;

  for (const exp of expenses) {
    const expMonth = getMonthKey(exp.date);
    if (expMonth === currentMonthKey) {
      monthTotal += exp.amount;
      entryCount += 1;
    } else if (expMonth === prevMonthKey) {
      lastMonthTotal += exp.amount;
    }

    if (exp.date === todayStr) {
      todayTotal += exp.amount;
    }

    if (exp.date >= weekStart && exp.date <= weekEnd) {
      weekTotal += exp.amount;
    }
  }

  const dailyAverage = currentDay > 0 ? monthTotal / currentDay : 0;
  const monthDiffAmount = monthTotal - lastMonthTotal;
  const monthDiffPercent =
    lastMonthTotal > 0 ? (monthDiffAmount / lastMonthTotal) * 100 : null;

  return {
    monthTotal,
    todayTotal,
    weekTotal,
    dailyAverage,
    entryCount,
    lastMonthTotal,
    monthDiffAmount,
    monthDiffPercent,
    calculatedUpToDay: currentDay,
    daysInMonth,
    currentMonthKey,
  };
}

export function computeBudgetSummary(
  monthTotal: number,
  monthlyBudget: number
): BudgetSummary {
  if (!Number.isFinite(monthlyBudget) || monthlyBudget <= 0) {
    return {
      budget: 0,
      spent: monthTotal,
      remaining: 0,
      percentUsed: 0,
      status: 'unset',
    };
  }

  const remaining = monthlyBudget - monthTotal;
  const percentUsed = Math.round(((monthTotal / monthlyBudget) * 100) * 100) / 100;

  let status: BudgetSummary['status'] = 'normal';
  if (percentUsed >= 100) {
    status = 'exceeded';
  } else if (percentUsed >= 80) {
    status = 'warning';
  }

  return {
    budget: monthlyBudget,
    spent: monthTotal,
    remaining,
    percentUsed,
    status,
  };
}

export function computeWeeklyReport(
  expenses: Expense[],
  monthKey: string,
  now: Date = new Date()
): WeeklyReportData {
  const daysInMonth = getDaysInMonth(monthKey);
  const ranges: Array<{ startDay: number; endDay: number }> = [
    { startDay: 1, endDay: 7 },
    { startDay: 8, endDay: 14 },
    { startDay: 15, endDay: 21 },
    { startDay: 22, endDay: Math.min(28, daysInMonth) },
  ];
  if (daysInMonth > 28) {
    ranges.push({ startDay: 29, endDay: daysInMonth });
  }

  const weeks: WeeklyBucket[] = ranges.map((r, idx) => {
    const startDate = `${monthKey}-${pad2(r.startDay)}`;
    const endDate = `${monthKey}-${pad2(r.endDay)}`;
    const daysCount = r.endDay - r.startDay + 1;

    let total = 0;
    let entryCount = 0;
    for (const exp of expenses) {
      if (exp.date >= startDate && exp.date <= endDate) {
        total += exp.amount;
        entryCount += 1;
      }
    }

    return {
      weekIndex: idx + 1,
      labelEn: `Week ${idx + 1} (${r.startDay}–${r.endDay})`,
      labelBn: `সপ্তাহ ${idx + 1} (${r.startDay}–${r.endDay})`,
      startDate,
      endDate,
      total,
      entryCount,
      daysCount,
      dailyAverage: daysCount > 0 ? total / daysCount : 0,
    };
  });

  const nonZeroWeeks = weeks.filter((w) => w.total > 0);
  const pool = nonZeroWeeks.length > 0 ? nonZeroWeeks : weeks;

  let highestWeek: WeeklyBucket | null = null;
  let lowestWeek: WeeklyBucket | null = null;

  if (weeks.some((w) => w.total > 0)) {
    highestWeek = pool.reduce((best, cur) => (cur.total > best.total ? cur : best), pool[0]);
    lowestWeek = pool.reduce((best, cur) => (cur.total < best.total ? cur : best), pool[0]);
  }

  // Current week vs previous week (rolling 7-day calendar weeks using today if current month, else last two weeks of month)
  const todayStr = getTodayDateString(now);
  const currentMonthKey = getMonthKey(todayStr);

  let currentWeekTotal = 0;
  let previousWeekTotal = 0;

  if (monthKey === currentMonthKey) {
    const { start: curStart, end: curEnd } = getWeekBounds(todayStr);
    const prevStart = addDays(curStart, -7);
    const prevEnd = addDays(curEnd, -7);
    for (const exp of expenses) {
      if (exp.date >= curStart && exp.date <= curEnd) {
        currentWeekTotal += exp.amount;
      } else if (exp.date >= prevStart && exp.date <= prevEnd) {
        previousWeekTotal += exp.amount;
      }
    }
  } else {
    const lastWeek = weeks[weeks.length - 1];
    const prevWeek = weeks[weeks.length - 2];
    currentWeekTotal = lastWeek ? lastWeek.total : 0;
    previousWeekTotal = prevWeek ? prevWeek.total : 0;
  }

  const weekDiffAmount = currentWeekTotal - previousWeekTotal;
  const weekDiffPercent =
    previousWeekTotal > 0 ? (weekDiffAmount / previousWeekTotal) * 100 : null;

  const totalMonth = weeks.reduce((sum, w) => sum + w.total, 0);
  const overallWeeklyDailyAvg = daysInMonth > 0 ? totalMonth / daysInMonth : 0;

  return {
    monthKey,
    weeks,
    highestWeek,
    lowestWeek,
    currentWeekTotal,
    previousWeekTotal,
    weekDiffAmount,
    weekDiffPercent,
    overallWeeklyDailyAvg,
  };
}

export function computeCategoryBreakdown(
  expenses: Expense[],
  categories: Category[]
): CategoryBreakdownItem[] {
  const catMap = new Map<string, Category>();
  for (const c of categories) {
    catMap.set(c.id, c);
  }
  const fallbackCat =
    categories.find((c) => c.id === 'cat_other') ?? categories[0] ?? DEFAULT_CATEGORIES[7];

  const totals = new Map<string, { total: number; entryCount: number }>();
  let grandTotal = 0;

  for (const exp of expenses) {
    grandTotal += exp.amount;
    const targetId = catMap.has(exp.categoryId) ? exp.categoryId : fallbackCat.id;
    const prev = totals.get(targetId) ?? { total: 0, entryCount: 0 };
    totals.set(targetId, {
      total: prev.total + exp.amount,
      entryCount: prev.entryCount + 1,
    });
  }

  const items: CategoryBreakdownItem[] = [];
  for (const [categoryId, stats] of totals.entries()) {
    const cat = catMap.get(categoryId) ?? fallbackCat;
    items.push({
      categoryId,
      nameBn: cat.nameBn,
      nameEn: cat.nameEn,
      color: cat.color,
      icon: cat.icon,
      total: stats.total,
      percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0,
      entryCount: stats.entryCount,
    });
  }

  items.sort((a, b) => b.total - a.total);
  return items;
}

export function computeMonthlyReport(
  expenses: Expense[],
  categories: Category[],
  monthKey: string,
  now: Date = new Date()
): MonthlyReportData {
  const daysInMonth = getDaysInMonth(monthKey);
  const startDate = `${monthKey}-01`;
  const endDate = `${monthKey}-${pad2(daysInMonth)}`;

  const monthExpenses = expenses.filter((e) => e.date >= startDate && e.date <= endDate);
  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayStr = getTodayDateString(now);
  const isCurrentMonth = getMonthKey(todayStr) === monthKey;
  const elapsedDays = isCurrentMonth ? now.getDate() : daysInMonth;
  const dailyAverage = elapsedDays > 0 ? total / elapsedDays : 0;

  const byDay = new Map<string, DaySummary>();
  for (const exp of monthExpenses) {
    const prev = byDay.get(exp.date) ?? { date: exp.date, total: 0, entryCount: 0 };
    byDay.set(exp.date, {
      date: exp.date,
      total: prev.total + exp.amount,
      entryCount: prev.entryCount + 1,
    });
  }

  const dayList = Array.from(byDay.values());
  let highestDay: DaySummary | null = null;
  let lowestDay: DaySummary | null = null;

  if (dayList.length > 0) {
    highestDay = dayList.reduce((best, cur) => (cur.total > best.total ? cur : best), dayList[0]);
    lowestDay = dayList.reduce((best, cur) => (cur.total < best.total ? cur : best), dayList[0]);
  }

  const categoryBreakdown = computeCategoryBreakdown(monthExpenses, categories);

  return {
    monthKey,
    startDate,
    endDate,
    total,
    dailyAverage,
    entryCount: monthExpenses.length,
    highestDay,
    lowestDay,
    categoryBreakdown,
  };
}

export function getRecentMonthKeys(count: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  let cur = getMonthKey(getTodayDateString(now));
  for (let i = 0; i < count; i++) {
    keys.unshift(cur);
    cur = getPreviousMonthKey(cur);
  }
  return keys;
}

export function computeMonthlyComparison(
  expenses: Expense[],
  monthKeys: string[]
): MonthlyComparisonData {
  const sortedKeys = [...monthKeys].sort();
  const totalsByMonth = new Map<string, { total: number; entryCount: number }>();

  for (const exp of expenses) {
    const mk = getMonthKey(exp.date);
    const prev = totalsByMonth.get(mk) ?? { total: 0, entryCount: 0 };
    totalsByMonth.set(mk, {
      total: prev.total + exp.amount,
      entryCount: prev.entryCount + 1,
    });
  }

  const items: MonthlyComparisonItem[] = sortedKeys.map((monthKey, idx) => {
    const curStats = totalsByMonth.get(monthKey) ?? { total: 0, entryCount: 0 };
    const prevKey = idx > 0 ? sortedKeys[idx - 1] : getPreviousMonthKey(monthKey);
    const prevTotal = totalsByMonth.get(prevKey)?.total ?? 0;
    const diffAmount = curStats.total - prevTotal;
    const diffPercent = prevTotal > 0 ? (diffAmount / prevTotal) * 100 : null;

    return {
      monthKey,
      total: curStats.total,
      entryCount: curStats.entryCount,
      diffAmount,
      diffPercent,
    };
  });

  const nonZero = items.filter((i) => i.total > 0);
  let highestMonth: MonthlyComparisonItem | null = null;
  let lowestMonth: MonthlyComparisonItem | null = null;

  if (nonZero.length > 0) {
    highestMonth = nonZero.reduce((b, c) => (c.total > b.total ? c : b), nonZero[0]);
    lowestMonth = nonZero.reduce((b, c) => (c.total < b.total ? c : b), nonZero[0]);
  }

  return {
    items,
    highestMonth,
    lowestMonth,
  };
}

export function filterExpenses(
  expenses: Expense[],
  categories: Category[],
  filters: ExpenseFilters
): Expense[] {
  const query = filters.searchQuery.trim().toLowerCase();
  const minAmt = filters.minAmount.trim() !== '' ? Number(filters.minAmount) : null;
  const maxAmt = filters.maxAmount.trim() !== '' ? Number(filters.maxAmount) : null;

  const catMap = new Map<string, Category>();
  for (const c of categories) catMap.set(c.id, c);

  return expenses.filter((exp) => {
    if (filters.date && exp.date !== filters.date) {
      return false;
    }
    if (filters.month && getMonthKey(exp.date) !== filters.month) {
      return false;
    }
    if (filters.categoryId && exp.categoryId !== filters.categoryId) {
      return false;
    }
    if (minAmt !== null && Number.isFinite(minAmt) && exp.amount < minAmt) {
      return false;
    }
    if (maxAmt !== null && Number.isFinite(maxAmt) && exp.amount > maxAmt) {
      return false;
    }
    if (query) {
      const cat = catMap.get(exp.categoryId);
      const haystack = `${exp.description} ${cat?.nameBn ?? ''} ${cat?.nameEn ?? ''} ${exp.amount}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

export function groupExpensesByDate(expenses: Expense[]): DailyHistoryGroup[] {
  const groups = new Map<string, Expense[]>();
  for (const exp of expenses) {
    const arr = groups.get(exp.date) ?? [];
    arr.push(exp);
    groups.set(exp.date, arr);
  }

  const result: DailyHistoryGroup[] = [];
  for (const [date, entries] of groups.entries()) {
    const sorted = [...entries].sort((a, b) => {
      if (a.time !== b.time) return b.time.localeCompare(a.time);
      return b.createdAt - a.createdAt;
    });
    const total = sorted.reduce((sum, e) => sum + e.amount, 0);
    result.push({ date, total, entries: sorted });
  }

  result.sort((a, b) => b.date.localeCompare(a.date));
  return result;
}

export function getCalendarDayTotals(
  expenses: Expense[],
  monthKey: string
): Map<string, { total: number; count: number }> {
  const map = new Map<string, { total: number; count: number }>();
  for (const exp of expenses) {
    if (getMonthKey(exp.date) === monthKey) {
      const prev = map.get(exp.date) ?? { total: 0, count: 0 };
      map.set(exp.date, {
        total: prev.total + exp.amount,
        count: prev.count + 1,
      });
    }
  }
  return map;
}

export function getAvailableMonths(expenses: Expense[], now: Date = new Date()): string[] {
  const set = new Set<string>();
  set.add(getMonthKey(getTodayDateString(now)));
  for (const exp of expenses) {
    set.add(getMonthKey(exp.date));
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

function escapeCsvCell(val: string | number): string {
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildExpensesCsv(
  expenses: Expense[],
  categories: Category[],
  lang: 'bn' | 'en'
): string {
  const catMap = new Map<string, Category>();
  for (const c of categories) catMap.set(c.id, c);

  const headers =
    lang === 'bn'
      ? ['তারিখ', 'সময়', 'ক্যাটাগরি', 'বিবরণ', 'টাকার পরিমাণ (BDT)']
      : ['Date', 'Time', 'Category', 'Description', 'Amount (BDT)'];

  const sorted = [...expenses].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.time.localeCompare(a.time);
  });

  const rows = sorted.map((exp) => {
    const cat = catMap.get(exp.categoryId);
    const catName = cat ? (lang === 'bn' ? cat.nameBn : cat.nameEn) : 'Other';
    return [
      escapeCsvCell(exp.date),
      escapeCsvCell(exp.time),
      escapeCsvCell(catName),
      escapeCsvCell(exp.description || '-'),
      escapeCsvCell(exp.amount),
    ].join(',');
  });

  // UTF-8 BOM ensures Excel opens Bengali characters cleanly
  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
}

export function computeMonthlyIncomeTotal(
  incomes: IncomeEntry[],
  monthKey: string
): number {
  let total = 0;
  for (const inc of incomes) {
    if (getMonthKey(inc.date) === monthKey) {
      total += inc.amount;
    }
  }
  return total;
}

export function createBackupPayload(
  expenses: Expense[],
  categories: Category[],
  settings: AppSettings,
  incomes: IncomeEntry[] = []
): AppDataBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    expenses,
    incomes,
    categories,
    settings,
  };
}

export function parseAndValidateBackup(rawText: string): AppDataBackup | null {
  try {
    const parsed = JSON.parse(rawText) as Partial<AppDataBackup>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.expenses)) return null;

    const validExpenses: Expense[] = [];
    for (const item of parsed.expenses) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.amount === 'number' &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        typeof item.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.date)
      ) {
        validExpenses.push({
          id: item.id,
          amount: item.amount,
          categoryId: typeof item.categoryId === 'string' ? item.categoryId : 'cat_other',
          description: typeof item.description === 'string' ? item.description : '',
          date: item.date,
          time: typeof item.time === 'string' && /^\d{2}:\d{2}$/.test(item.time) ? item.time : '12:00',
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
          updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
        });
      }
    }

    const validIncomes: IncomeEntry[] = [];
    if (Array.isArray(parsed.incomes)) {
      for (const item of parsed.incomes) {
        if (
          item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.amount === 'number' &&
          Number.isFinite(item.amount) &&
          item.amount > 0 &&
          typeof item.date === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(item.date)
        ) {
          validIncomes.push({
            id: item.id,
            amount: item.amount,
            source: typeof item.source === 'string' ? item.source : 'Other',
            note: typeof item.note === 'string' ? item.note : '',
            date: item.date,
            time: typeof item.time === 'string' && /^\d{2}:\d{2}$/.test(item.time) ? item.time : '12:00',
            createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
            updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
          });
        }
      }
    }

    const validCategories: Category[] =
      Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories.filter(
            (c): c is Category =>
              Boolean(c) &&
              typeof c.id === 'string' &&
              typeof c.nameBn === 'string' &&
              typeof c.nameEn === 'string' &&
              typeof c.color === 'string'
          )
        : DEFAULT_CATEGORIES;

    const validSettings: AppSettings = {
      monthlyBudget:
        parsed.settings &&
        typeof parsed.settings.monthlyBudget === 'number' &&
        parsed.settings.monthlyBudget >= 0
          ? parsed.settings.monthlyBudget
          : DEFAULT_SETTINGS.monthlyBudget,
      language:
        parsed.settings?.language === 'en' || parsed.settings?.language === 'bn'
          ? parsed.settings.language
          : DEFAULT_SETTINGS.language,
      theme:
        parsed.settings?.theme === 'dark' || parsed.settings?.theme === 'light'
          ? parsed.settings.theme
          : DEFAULT_SETTINGS.theme,
    };

    return {
      version: 1,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      expenses: validExpenses,
      incomes: validIncomes,
      categories: validCategories.length > 0 ? validCategories : DEFAULT_CATEGORIES,
      settings: validSettings,
    };
  } catch {
    return null;
  }
}
