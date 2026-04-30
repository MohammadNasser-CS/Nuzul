import api from './api'
import type { AdminDashboardStats, AdminProperty, AdminUser } from '@/types'

export const adminService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: () =>
    api.get<AdminDashboardStats>('/admin/dashboard'),

  // ── Properties ─────────────────────────────────────────────────────────────
  listProperties: (status?: 'PENDING' | 'APPROVED' | 'REJECTED') =>
    api.get<AdminProperty[]>('/admin/properties', status ? { params: { status } } : undefined),

  getProperty: (id: string) =>
    api.get<AdminProperty>(`/admin/properties/${id}`),

  approveProperty: (id: string) =>
    api.patch<AdminProperty>(`/admin/properties/${id}/approve`),

  rejectProperty: (id: string, rejection_reason: string, admin_notes?: string) =>
    api.patch<AdminProperty>(`/admin/properties/${id}/reject`, { rejection_reason, admin_notes }),

  updatePropertyNotes: (id: string, admin_notes: string) =>
    api.patch<AdminProperty>(`/admin/properties/${id}/notes`, { admin_notes }),

  // ── Users ──────────────────────────────────────────────────────────────────
  listUsers: (role?: 'STUDENT' | 'LANDLORD' | 'ADMIN') =>
    api.get<AdminUser[]>('/admin/users', role ? { params: { role } } : undefined),

  getUser: (id: string) =>
    api.get<AdminUser>(`/admin/users/${id}`),

  toggleUserActivation: (id: string) =>
    api.patch<AdminUser & { message: string }>(`/admin/users/${id}/deactivate`),
}
