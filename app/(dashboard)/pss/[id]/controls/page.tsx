'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { requestShutoff } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

export default function ControlsPage() {
  const { id }   = useParams<{ id: string }>();
  const { user } = useAuth();
  const [open,    setOpen]    = useState(false);
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  const canShutoff = user?.role === 'admin' || user?.role === 'super_admin';

  if (!canShutoff) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[#6B7280]">
        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        Remote shutoff requires Admin or Super Admin role.
      </div>
    );
  }

  async function handleShutoff() {
    if (!reason.trim()) { setError('Reason is required'); return; }
    setLoading(true); setError('');
    try {
      await requestShutoff(id, reason);
      setDone(true);
      setOpen(false);
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Shutoff request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-md space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-700">Remote Shutoff</div>
            <div className="text-xs text-red-600 mt-1 leading-relaxed">
              This will disconnect the PSS from the HV supply. A technician must re-energise on-site.
              There is no remote power-on.
            </div>
          </div>
        </div>
      </div>

      {done ? (
        <div className="text-sm text-green-700 font-medium bg-green-50 border border-green-200 rounded-lg p-3">
          Shutoff request submitted. Awaiting technician confirmation.
        </div>
      ) : (
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Request Shutoff
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Remote Shutoff</DialogTitle>
            <DialogDescription>
              This action is irreversible remotely. A technician must physically re-energise the unit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Reason *
            </label>
            <textarea
              className="w-full border border-[#E5E7EB] rounded-md p-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="State the reason for shutoff…"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setError(''); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleShutoff} disabled={loading}>
              {loading ? 'Submitting…' : 'Confirm Shutoff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
