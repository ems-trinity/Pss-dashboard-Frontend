'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart2, Settings, AlertCircle } from 'lucide-react';
import { Sld } from '@/components/monitoring/sld/sld';
import { FaultLog } from '@/components/monitoring/events/fault-log';
import { usePss } from '@/hooks/use-pss';
import { getEvents, getPssDetail } from '@/lib/api';
import type { PssDetail } from '@/lib/api';
import type { PssEvent } from '@/types';

export default function PssDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const { pss } = usePss();
  const unit    = pss.find(p => p.id === id);

  const [events,       setEvents]       = useState<PssEvent[]>([]);
  const [detail,       setDetail]       = useState<PssDetail | null>(null);
  const [selectedComp, setSelectedComp] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEvents(id, 50).then(setEvents).catch(console.error);
    getPssDetail(id).then(setDetail).catch(console.error);
    const interval = setInterval(
      () => getEvents(id, 50).then(setEvents).catch(console.error),
      15_000,
    );
    return () => clearInterval(interval);
  }, [id]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-[#E5E7EB] bg-white flex-shrink-0">
        <Link href="/" className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111827]">
          <ArrowLeft className="w-3.5 h-3.5" />
          All PSS
        </Link>
        <div className="h-4 w-px bg-[#E5E7EB]" />
        <span className="text-sm font-medium text-[#111827]">{detail?.code ?? unit?.code ?? id}</span>
        <div className="ml-auto flex items-center gap-1">
          <Link href={`/pss/${id}/graphs`}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 rounded">
            <BarChart2 className="w-3.5 h-3.5" /> Graphs
          </Link>
          <Link href={`/pss/${id}/config`}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 rounded">
            <Settings className="w-3.5 h-3.5" /> Config
          </Link>
          <Link href={`/pss/${id}/controls`}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 rounded">
            <AlertCircle className="w-3.5 h-3.5" /> Controls
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* SLD area */}
        <div className="flex-1 overflow-auto p-4 bg-[#F9FAFB]">
          <Sld
            detail={detail}
            selectedComp={selectedComp}
            onSelectComp={setSelectedComp}
          />
        </div>
        {/* Fault log sidebar */}
        <div className="w-80 border-l border-[#E5E7EB] bg-white flex flex-col">
          <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex-shrink-0">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Fault Log</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FaultLog events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
