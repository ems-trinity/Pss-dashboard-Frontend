'use client';
import dynamic from 'next/dynamic';
import type { TelemetrySeries, ThresholdValues } from '@/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

function lineOpt(
  name: string,
  data: [string, number][],
  color: string,
  warnVal?: number,
  critVal?: number,
) {
  const markLines: {
    yAxis: number;
    name: string;
    lineStyle: { color: string; type: 'dashed' };
  }[] = [];
  if (warnVal !== undefined) markLines.push({ yAxis: warnVal, name: 'Warn', lineStyle: { color: '#D97706', type: 'dashed' as const } });
  if (critVal !== undefined) markLines.push({ yAxis: critVal, name: 'Crit', lineStyle: { color: '#DC2626', type: 'dashed' as const } });

  return {
    type: 'line' as const,
    name,
    data,
    smooth: true,
    symbol: 'none',
    lineStyle: { color, width: 1.5 },
    areaStyle: { color, opacity: 0.06 },
    ...(markLines.length > 0 ? {
      markLine: { data: markLines, label: { formatter: '{b}' }, symbol: 'none' },
    } : {}),
  };
}

interface Props {
  series:     TelemetrySeries;
  thresholds: ThresholdValues;
}

export function TelemetryCharts({ series, thresholds: t }: Props) {
  const baseAxis = {
    xAxis: { type: 'time' as const, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { fontSize: 10 } },
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 16, top: 16, bottom: 30 },
  };

  const charts = [
    {
      title: 'HT Load (kW)',
      option: { ...baseAxis, series: [lineOpt('HT kW', series.htKw, '#2563EB')] },
    },
    {
      title: 'Transformer Temperature (°C)',
      option: {
        ...baseAxis,
        legend: { bottom: 0, textStyle: { fontSize: 10 } },
        grid: { left: 40, right: 16, top: 16, bottom: 44 },
        series: [
          lineOpt('Oil Temp',     series.oilT,  '#D97706', t.oilTempWarn,  t.oilTempCrit),
          lineOpt('Winding Temp', series.windT, '#DC2626', t.windTempWarn, t.windTempCrit),
        ],
      },
    },
    {
      title: 'Power Factor',
      option: {
        ...baseAxis,
        legend: { bottom: 0, textStyle: { fontSize: 10 } },
        yAxis: { type: 'value' as const, min: 0.8, max: 1.05, axisLabel: { fontSize: 10 } },
        grid: { left: 44, right: 16, top: 16, bottom: 44 },
        series: [
          lineOpt('Raw PF',   series.pfRaw,  '#9CA3AF', t.pfMin),
          lineOpt('Corr. PF', series.pfCorr, '#16A34A', t.pfMin),
        ],
      },
    },
    {
      title: 'LT Feeder Load (kW)',
      option: {
        ...baseAxis,
        legend: { bottom: 0, textStyle: { fontSize: 10 } },
        grid: { left: 40, right: 16, top: 16, bottom: 44 },
        series: [
          lineOpt('F1', series.f1Kw, '#2563EB'),
          lineOpt('F2', series.f2Kw, '#16A34A'),
          lineOpt('F3', series.f3Kw, '#D97706'),
          lineOpt('F4', series.f4Kw, '#DC2626'),
        ],
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {charts.map(c => (
        <div key={c.title} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">{c.title}</div>
          <ReactECharts option={c.option} style={{ height: 200 }} />
        </div>
      ))}
    </div>
  );
}
