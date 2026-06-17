'use client';
import dynamic from 'next/dynamic';
import type { Pss } from '@/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export function StatusPie({ pss }: { pss: Pss[] }) {
  const counts = pss.reduce(
    (acc, u) => { acc[u.status] = (acc[u.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    graphic: [{
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: `${pss.length}\nTotal`,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#111827',
        lineHeight: 20,
      },
    }],
    series: [{
      type: 'pie',
      radius: ['48%', '70%'],
      center: ['50%', '45%'],
      label: { show: false },
      data: [
        { name: 'Normal',   value: counts.normal   ?? 0, itemStyle: { color: '#16A34A' } },
        { name: 'Warning',  value: counts.warning  ?? 0, itemStyle: { color: '#D97706' } },
        { name: 'Critical', value: counts.critical ?? 0, itemStyle: { color: '#DC2626' } },
        { name: 'Offline',  value: counts.offline  ?? 0, itemStyle: { color: '#9CA3AF' } },
      ].filter(d => d.value > 0),
    }],
  };

  if (pss.length === 0) return <div className="h-[220px] flex items-center justify-center text-sm text-[#9CA3AF]">No PSS units</div>;

  return <ReactECharts option={option} style={{ height: 220 }} />;
}
