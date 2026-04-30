import api from './api'
import type { Inquiry, InquiryCreate, InquiryListResponse, InquiryStatus } from '@/types'

export const inquiriesService = {
  /** Student — submit a new inquiry for a room */
  create: (data: InquiryCreate) =>
    api.post<Inquiry>('/inquiries', data),

  /** Student — list own inquiries */
  myInquiries: () =>
    api.get<Inquiry[]>('/my-inquiries'),

  /**
   * Admin — list inquiries (optionally filtered by status).
   * Always returns { data, counts } so tab badges stay accurate
   * even when a filtered tab has zero results.
   */
  adminList: (status?: InquiryStatus) =>
    api.get<InquiryListResponse>('/admin/inquiries', {
      params: status ? { status } : {},
    }),

  /** Admin — update inquiry status */
  updateStatus: (id: string, status: InquiryStatus) =>
    api.patch<Inquiry>(`/admin/inquiries/${id}/status`, { status }),
}
