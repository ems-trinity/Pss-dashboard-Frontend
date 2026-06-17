import type { PssEvent } from '@/types';

const SEV_STYLE: Record<string, string> = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  warning:  'bg-yellow-50 border-yellow-200 text-yellow-700',
  info:     'bg-blue-50 border-blue-200 text-blue-700',
};

export function FaultLog({ events }: { events: PssEvent[] }) {
  if (events.length === 0) {
    return <div className="p-4 text-sm text-[#9CA3AF] text-center">No events</div>;
  }

  return (
    <div className="divide-y divide-[#E5E7EB] overflow-y-auto">
      {events.map(e => (
        <div key={e.id} className="px-4 py-3 hover:bg-gray-50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#6B7280] mb-0.5">
                {new Date(e.ts).toLocaleString('en-IN')} · {e.comp}
              </div>
              <div className="text-sm text-[#111827] leading-snug">{e.msg}</div>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border flex-shrink-0 ${SEV_STYLE[e.sev] ?? SEV_STYLE.info}`}>
              {e.sev}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
