'use client';
import { useState, useEffect } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getTickets, createTicket, updateTicket, getTicketComments, addTicketComment } from '@/lib/admin-api';
import type { Ticket, TicketComment } from '@/lib/admin-api';

const PRIORITY_COLOR: Record<string, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-[#6B7280]',
};
const STATUS_COLOR: Record<string, string> = {
  open:        'text-[#2563EB]',
  in_progress: 'text-yellow-600',
  resolved:    'text-green-600',
  closed:      'text-[#9CA3AF]',
};

export default function TicketsPage() {
  const [items,    setItems]    = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [open,     setOpen]     = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing,  setViewing]  = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [form,     setForm]     = useState({ title: '', description: '', priority: 'medium' });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    load();
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    try {
      const data = await getTickets(filterStatus ? { status: filterStatus } : undefined);
      setItems(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function openView(t: Ticket) {
    setViewing(t);
    const c = await getTicketComments(t.id).catch(() => []);
    setComments(c);
    setViewOpen(true);
  }

  async function handleCreate() {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const created = await createTicket(form);
      setItems(prev => [{ ...created, reporter_name: null, assignee_name: null, pss_code: null, updated_at: created.created_at }, ...prev]);
      setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Create failed'); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: string) {
    await updateTicket(id, { status }).catch(console.error);
    setItems(prev => prev.map(t => t.id === id ? { ...t, status: status as Ticket['status'] } : t));
    if (viewing?.id === id) setViewing(v => v ? { ...v, status: status as Ticket['status'] } : v);
  }

  async function handleComment() {
    if (!viewing || !newComment.trim()) return;
    const c = await addTicketComment(viewing.id, newComment.trim()).catch(() => null);
    if (c) { setComments(prev => [...prev, c]); setNewComment(''); }
    load();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-[#111827]">Tickets</h1><p className="text-sm text-[#6B7280]">{items.length} ticket{items.length !== 1 ? 's' : ''}</p></div>
        <div className="flex gap-2">
          <select className="border border-[#E5E7EB] rounded-md px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <Button size="sm" onClick={() => { setForm({ title: '', description: '', priority: 'medium' }); setError(''); setOpen(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Ticket
          </Button>
        </div>
      </div>

      {loading ? <div className="text-sm text-[#6B7280]">Loading…</div> : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#E5E7EB]">
              <tr>{['Title','Priority','Status','PSS','Reporter','Created',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No tickets</td></tr>}
              {items.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#111827] max-w-xs truncate">{t.title}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${STATUS_COLOR[t.status]}`}>{t.status.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-xs text-[#6B7280]">{t.pss_code ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#6B7280]">{t.reporter_name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#6B7280]">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3"><button onClick={() => openView(t)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"><MessageSquare className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} autoFocus /></div>
            <div className="space-y-1"><Label>Description</Label>
              <textarea className="w-full border border-[#E5E7EB] rounded-md p-2.5 text-sm resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Ticket'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLOR[viewing.priority]}`}>{viewing.priority}</span>
                <select className="text-xs border border-[#E5E7EB] rounded px-2 py-0.5" value={viewing.status} onChange={e => handleStatusChange(viewing.id, e.target.value)}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-[#E5E7EB] rounded-md p-2">
                {comments.length === 0 && <p className="text-xs text-[#9CA3AF] text-center py-2">No comments yet</p>}
                {comments.map(c => (
                  <div key={c.id} className={`p-2 rounded text-xs ${c.is_internal ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    <div className="flex justify-between text-[#6B7280] mb-0.5">
                      <span>{c.author ?? 'Unknown'}{c.is_internal && ' (internal)'}</span>
                      <span>{new Date(c.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-[#111827]">{c.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment…" className="flex-1" onKeyDown={e => e.key === 'Enter' && handleComment()} />
                <Button size="sm" onClick={handleComment} disabled={!newComment.trim()}>Send</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
