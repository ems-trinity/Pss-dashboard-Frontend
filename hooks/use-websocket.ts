'use client';
import { useEffect, useCallback } from 'react';
import { getSocket, disconnectSocket } from '@/lib/ws';
import type { Notification } from '@/types';

interface Options {
  locationCode:   string | null;
  onNewEvent:     (n: Omit<Notification, 'id' | 'at' | 'read'>) => void;
  onStatusChange: (status: 'live' | 'reconnecting') => void;
}

export function useWebSocket({ locationCode, onNewEvent, onStatusChange }: Options) {
  const handleFaultLog = useCallback((payload: { events: Record<string, unknown>[] }) => {
    const seenIds = new Set<string>();
    for (const e of payload.events ?? []) {
      const id = e.id as string;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        if (e.severity === 'critical' || e.severity === 'warning') {
          onNewEvent({
            pssId:   e.pss_id as string,
            pssCode: e.pss_code as string,
            sev:     e.severity as 'critical' | 'warning',
            msg:     e.summary as string,
          });
        }
      }
    }
  }, [onNewEvent]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect',          () => onStatusChange('live'));
    socket.on('disconnect',       () => onStatusChange('reconnecting'));
    socket.on('connect_error',    () => onStatusChange('reconnecting'));
    socket.on('fault_log_update', handleFaultLog);

    if (locationCode) {
      socket.emit('join', { location_code: locationCode });
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('fault_log_update', handleFaultLog);
    };
  }, [locationCode, handleFaultLog, onStatusChange]);

  useEffect(() => {
    return () => disconnectSocket();
  }, []);
}
