import api from './api'
import type { Property, PropertyCreate, PropertyUpdate, ListingFilters, PaginatedListings } from '@/types'

export const PAGE_SIZE = 6

// Public listings (APPROVED only, no auth required)
export const listingsService = {
  list: (filters?: ListingFilters, page = 1, limit = PAGE_SIZE) =>
    api.get<PaginatedListings>('/listings', {
      params: { ...filters, page, limit },
    }),

  getById: (id: string) =>
    api.get<Property>(`/listings/${id}`),
}

// Landlord property management (requires LANDLORD auth)
export const propertiesService = {
  myProperties: () =>
    api.get<Property[]>('/properties/my'),

  create: (data: PropertyCreate) =>
    api.post<Property>('/properties/', data),

  update: (id: string, data: PropertyUpdate) =>
    api.put<Property>(`/properties/${id}`, data),

  delete: (id: string) =>
    api.delete(`/properties/${id}`),
}
