import { useState } from 'react';
import type { CategoryBreakdownItem, Language } from '../types/expense';
import { formatCurrency, formatPercent } from '../utils/i18n';

export interface BarChartDatum {
  id: string;
  label: string;
  value: number;
  sublabel?: string;
  isHighlighted?: boolean;
}

interface BarChartProps {
  data: BarChartDatum[];
  lang: Language;
  accentColor?: string;
  emptyText: string;
  ariaLabel: string;
}

export function BarChart({
  data,
  lang,
  accentColor = '#059669',
  emptyText,
  ariaLabel,
}: BarChartProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 0);

  if (data.length === 0 || maxValue === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-slate-500 dark:text-slate-400">
        {emptyText}
      </div>
    );
  }

  const niceMax = Math.ceil(maxValue / 100) * 100 || maxValue;
  const chartHeight = 200;
  const topPad = 24;
  const bottomPad = 34;
  const plotHeight = chartHeight - topPad - bottomPad;
  const svgWidth = Math.max(data.length * 88, 360);
  const slotWidth = svgWidth / data.length;
  const barWidth = Math.min(44, Math.max(24, slotWidth * 0.48));

  const activeItem = data.find((d) => d.id === activeId) ?? null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between min-h-[24px] mb-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {activeItem
            ? `${activeItem.label}${activeItem.sublabel ? ` · ${activeItem.sublabel}` : ''}`
            : lang === 'bn'
              ? 'বিস্তারিত দেখতে বারে ট্যাপ বা হোভার করুন'
              : 'Hover or tap any bar for exact amount'}
        </span>
        {activeItem && (
          <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(activeItem.value, lang)}
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          className="w-full min-w-[340px] h-56 select-none"
          role="img"
          aria-label={ariaLabel}
        >
          {/* Horizontal reference gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = topPad + plotHeight * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={8}
                y1={y}
                x2={svgWidth - 8}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray={ratio === 0 ? undefined : '4 4'}
                strokeWidth={1}
              />
            );
          })}

          {data.map((item, idx) => {
            const ratio = niceMax > 0 ? item.value / niceMax : 0;
            const barHeight = Math.max(item.value > 0 ? 4 : 0, ratio * plotHeight);
            const x = idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = topPad + plotHeight - barHeight;
            const isActive = activeId === item.id;
            const fill = item.isHighlighted ? '#D97706' : accentColor;

            return (
              <g
                key={item.id}
                className="cursor-pointer"
                onMouseEnter={() => setActiveId(item.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => setActiveId(isActive ? null : item.id)}
              >
                <rect
                  x={x - 6}
                  y={topPad}
                  width={barWidth + 12}
                  height={plotHeight}
                  fill="transparent"
                />
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={fill}
                  opacity={activeId && !isActive ? 0.5 : 1}
                  className="transition-opacity duration-150"
                />
                {item.value > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-slate-700 dark:fill-slate-300 text-[10px] font-mono-num font-medium"
                  >
                    {formatCurrency(item.value, lang)}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[11px] font-medium"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

interface PieDonutChartProps {
  items: CategoryBreakdownItem[];
  total: number;
  lang: Language;
  emptyText: string;
}

export function PieDonutChart({ items, total, lang, emptyText }: PieDonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0 || total <= 0) {
    return (
      <div className="flex items-center justify-center h-56 text-sm text-slate-500 dark:text-slate-400">
        {emptyText}
      </div>
    );
  }

  const size = 220;
  const center = size / 2;
  const radius = 82;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const activeItem = items.find((i) => i.categoryId === hoveredId) ?? null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
      <div className="relative shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={lang === 'bn' ? 'ক্যাটাগরি পাই চার্ট' : 'Category spending donut chart'}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
          />
          {items.map((item) => {
            const pct = item.percentage / 100;
            const dashLength = Math.max(pct * circumference, 2);
            const dashOffset = -cumulativePercent * circumference;
            cumulativePercent += pct;
            const isHovered = hoveredId === item.categoryId;

            return (
              <circle
                key={item.categoryId}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                opacity={hoveredId && !isHovered ? 0.45 : 1}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredId(item.categoryId)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setHoveredId(isHovered ? null : item.categoryId)}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
            {activeItem
              ? lang === 'bn'
                ? activeItem.nameBn
                : activeItem.nameEn
              : lang === 'bn'
                ? 'মোট খরচ'
                : 'Total'}
          </span>
          <span className="text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
            {formatCurrency(activeItem ? activeItem.total : total, lang)}
          </span>
          {activeItem && (
            <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
              {formatPercent(activeItem.percentage, lang)}
            </span>
          )}
        </div>
      </div>

      <div className="w-full md:max-w-lg flex-1 space-y-2.5">
        {items.map((item) => {
          const isHovered = hoveredId === item.categoryId;
          return (
            <button
              key={item.categoryId}
              type="button"
              onMouseEnter={() => setHoveredId(item.categoryId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(isHovered ? null : item.categoryId)}
              className={`w-full text-left flex items-center justify-between gap-3 py-2 px-3 rounded-xl transition-colors ${
                isHovered
                  ? 'bg-slate-100 dark:bg-slate-800/80'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {lang === 'bn' ? item.nameBn : item.nameEn}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 font-mono-num text-sm">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(item.total, lang)}
                </span>
                <span className="w-14 text-right text-xs text-slate-500 dark:text-slate-400">
                  {formatPercent(item.percentage, lang)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
