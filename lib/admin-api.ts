'use client';
import { apiFetch } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Org {
  id: string; name: string; created_at: string;
  location_count: number; pss_count: number;
}

export interface Customer {
  id: string; full_name: string | null; email: string;
  mobile: string | null; role: string; is_active: boolean;
  created_at: string; last_login_at: string | null; org_name: string | null;
}

export interface TeamMember {
  id: string; full_name: string | null; email: string;
  mobile: string | null; role: string; is_active: boolean;
  created_at: string; last_login_at: string | null;
}

export interface Project {
  id: string; name: string; status: 'active' | 'on_hold' | 'completed';
  customer_id: string | null; customer_name: string | null;
  customer_email: string | null; org_name: string | null; created_at: string;
}

export interface Group {
  id: string; name: string; description: string | null;
  created_at: string; member_count: number; pss_count: number;
}

export interface GroupMember {
  id: string; full_name: string | null; email: string; role: string; joined_at: string;
}

export interface Ticket {
  id: string; title: string; priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporter_name: string | null; assignee_name: string | null;
  pss_code: string | null; created_at: string; updated_at: string;
}

export interface TicketComment {
  id: string; body: string; is_internal: boolean;
  created_at: string; author: string | null;
}

export interface EnergyRow {
  pss_code: string; day: string; avg_kw: number; peak_kw: number; avg_pf: number;
}

export interface FaultRow {
  pss_code: string; day: string; severity: string; event_type: string; event_count: number;
}

export interface AuditEntry {
  id: string; ts: string; action: string;
  target_type: string | null; details: Record<string, unknown> | null;
  user_name: string | null; user_email: string | null;
}

// ── Organisations ─────────────────────────────────────────────────────────────

export const getOrgs = () => apiFetch<Org[]>('/admin/organisations');
export const createOrg = (name: string) =>
  apiFetch<Org>('/admin/organisations', { method: 'POST', body: JSON.stringify({ name }) });
export const updateOrg = (id: string, name: string) =>
  apiFetch<Org>(`/admin/organisations/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });

// ── Customers ─────────────────────────────────────────────────────────────────

export const getCustomers = () => apiFetch<Customer[]>('/admin/customers');
export const createCustomer = (data: { full_name: string; email: string; mobile: string; org_id?: string }) =>
  apiFetch<{ user: Customer; temp_password: string }>('/admin/customers', {
    method: 'POST', body: JSON.stringify(data),
  });
export const updateCustomer = (id: string, data: { full_name?: string; email?: string; mobile?: string }) =>
  apiFetch<Customer>(`/admin/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const setCustomerStatus = (id: string, is_active: boolean) =>
  apiFetch(`/admin/customers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active }) });

// ── Team ──────────────────────────────────────────────────────────────────────

export const getTeam = () => apiFetch<TeamMember[]>('/admin/team');
export const createTeamMember = (data: { full_name: string; email: string; mobile: string; role: string }) =>
  apiFetch<{ user: TeamMember; temp_password: string }>('/admin/team', {
    method: 'POST', body: JSON.stringify(data),
  });
export const updateTeamMember = (id: string, data: { full_name?: string; email?: string; mobile?: string; role?: string }) =>
  apiFetch<TeamMember>(`/admin/team/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const setTeamMemberStatus = (id: string, is_active: boolean) =>
  apiFetch(`/admin/team/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active }) });

// ── Projects ──────────────────────────────────────────────────────────────────

export const getProjects = () => apiFetch<Project[]>('/admin/projects');
export const createProject = (data: { name: string; customer_id?: string; status?: string }) =>
  apiFetch<Project>('/admin/projects', { method: 'POST', body: JSON.stringify(data) });
export const updateProject = (id: string, data: { name?: string; customer_id?: string; status?: string }) =>
  apiFetch<Project>(`/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// ── Groups ────────────────────────────────────────────────────────────────────

export const getGroups = () => apiFetch<Group[]>('/admin/groups');
export const createGroup = (data: { name: string; description?: string }) =>
  apiFetch<Group>('/admin/groups', { method: 'POST', body: JSON.stringify(data) });
export const updateGroup = (id: string, data: { name?: string; description?: string }) =>
  apiFetch<Group>(`/admin/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const getGroupMembers = (id: string) => apiFetch<GroupMember[]>(`/admin/groups/${id}/members`);
export const addGroupMember = (groupId: string, user_id: string) =>
  apiFetch(`/admin/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ user_id }) });
export const removeGroupMember = (groupId: string, userId: string) =>
  apiFetch(`/admin/groups/${groupId}/members/${userId}`, { method: 'DELETE' });

// ── Tickets ───────────────────────────────────────────────────────────────────

export const getTickets = (filters?: { status?: string; priority?: string; pss_id?: string }) => {
  const qs = filters ? '?' + new URLSearchParams(Object.entries(filters).filter(([,v]) => v) as [string,string][]).toString() : '';
  return apiFetch<Ticket[]>(`/admin/tickets${qs}`);
};
export const createTicket = (data: { title: string; description?: string; pss_id?: string; priority?: string }) =>
  apiFetch<Ticket>('/admin/tickets', { method: 'POST', body: JSON.stringify(data) });
export const updateTicket = (id: string, data: { status?: string; assignee_id?: string; priority?: string }) =>
  apiFetch<Ticket>(`/admin/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const getTicketComments = (id: string) => apiFetch<TicketComment[]>(`/admin/tickets/${id}/comments`);
export const addTicketComment = (id: string, body: string, is_internal = false) =>
  apiFetch<TicketComment>(`/admin/tickets/${id}/comments`, {
    method: 'POST', body: JSON.stringify({ body, is_internal }),
  });

// ── Reports ───────────────────────────────────────────────────────────────────

export const getEnergyReport = (params: { from?: string; to?: string; pss_id?: string }) => {
  const qs = '?' + new URLSearchParams(Object.entries(params).filter(([,v]) => v) as [string,string][]).toString();
  return apiFetch<EnergyRow[]>(`/admin/reports/energy${qs}`);
};
export const getFaultReport = (params: { from?: string; to?: string; pss_id?: string }) => {
  const qs = '?' + new URLSearchParams(Object.entries(params).filter(([,v]) => v) as [string,string][]).toString();
  return apiFetch<FaultRow[]>(`/admin/reports/faults${qs}`);
};

// ── Audit ─────────────────────────────────────────────────────────────────────

export const getAuditLog = (params?: { user_id?: string; action?: string; from?: string; to?: string; limit?: number }) => {
  const entries = Object.entries(params ?? {}).filter(([,v]) => v !== undefined) as [string,string][];
  const qs = entries.length ? '?' + new URLSearchParams(entries).toString() : '';
  return apiFetch<AuditEntry[]>(`/admin/audit${qs}`);
};
