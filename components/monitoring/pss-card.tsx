import Link from 'next/link';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/brand';
import type { Pss } from '@/types';

export function PssCard({ unit }: { unit: Pss }) {
  const s = STATUS[unit.status] ?? STATUS.offline;

  return (
    <Link href={`/pss/${unit.id}`}
      className="block bg-white rounded-xl border border-[#E5E7EB] p-4 hover:shadow-md hover:border-[#2563EB] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-[#111827]">{unit.code}</div>
          <div className="text-xs text-[#6B7280] mt-0.5">{unit.locCode}</div>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: s.bg, color: s.color }}>
          {s.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-[#6B7280]">Load</div>
          <div className="text-sm font-mono font-semibold text-[#111827]">
            {unit.htKw.toLocaleString('en-IN')} kW
          </div>
        </div>
        <div>
          <div className="text-xs text-[#6B7280]">Oil Temp</div>
          <div className={cn('text-sm font-mono font-semibold',
            unit.oilT >= 85 ? 'text-red-600' : unit.oilT >= 75 ? 'text-yellow-600' : 'text-[#111827]')}>
            {unit.oilT.toFixed(1)}°C
          </div>
        </div>
        <div>
          <div className="text-xs text-[#6B7280]">PF</div>
          <div className={cn('text-sm font-mono font-semibold',
            unit.pf < 0.92 ? 'text-red-600' : 'text-[#111827]')}>
            {unit.pf.toFixed(2)}
          </div>
        </div>
      </div>
      {unit.faults > 0 && (
        <div className="mt-2 text-xs text-red-600 font-medium">
          {unit.faults} active fault{unit.faults > 1 ? 's' : ''}
        </div>
      )}
      {unit.seen && (
        <div className="mt-1 text-xs text-[#9CA3AF]">
          Seen {new Date(unit.seen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </Link>
  );
}
