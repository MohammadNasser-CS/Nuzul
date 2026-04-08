import api from './api'
import type { Property, PropertyCreate, PropertyUpdate } from '@/types'

export const propertiesService = {
  list: (params?: {
    city?: string
    min_price?: number
    max_price?: number
    rooms?: number
    available_only?: boolean
  }) => api.get<Property[]>('/properties', { params }),

  getById: (id: string) =>
    api.get<Property>(`/properties/${id}`),

  create: (data: PropertyCreate) =>
    api.post<Property>('/properties', data),

  update: (id: string, data: PropertyUpdate) =>
    api.patch<Property>(`/properties/${id}`, data),

  delete: (id: string) =>
    api.delete(`/properties/${id}`),
}
