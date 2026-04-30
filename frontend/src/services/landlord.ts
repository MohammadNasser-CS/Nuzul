import api from './api'
import type { Property, PropertyUpdate, Room, RoomCreate, RoomUpdate, Inquiry } from '@/types'

export interface LandlordDashboardStats {
  total_properties: number
  total_rooms:      number
  total_inquiries:  number
}

export const landlordService = {
  /** GET /landlord/dashboard — summary stats for current landlord */
  dashboard: () =>
    api.get<LandlordDashboardStats>('/landlord/dashboard'),

  /** GET /landlord/properties — all properties with rooms + images */
  myProperties: () =>
    api.get<Property[]>('/landlord/properties'),

  /** PUT /landlord/properties/:id — edit owned property (resets to PENDING if APPROVED) */
  updateProperty: (id: string, data: PropertyUpdate) =>
    api.put<Property>(`/landlord/properties/${id}`, data),

  /** DELETE /landlord/properties/:id — cascades rooms + cleans up images */
  deleteProperty: (id: string) =>
    api.delete(`/landlord/properties/${id}`),

  /** GET /landlord/rooms?property_id=:id — rooms with images for one property */
  getRooms: (propertyId: string) =>
    api.get<Room[]>('/landlord/rooms', { params: { property_id: propertyId } }),

  /** POST /landlord/rooms — add room (resets parent property if APPROVED) */
  createRoom: (data: RoomCreate) =>
    api.post<Room>('/landlord/rooms', data),

  /** PUT /landlord/rooms/:id — update room */
  updateRoom: (roomId: string, data: RoomUpdate) =>
    api.put<Room>(`/landlord/rooms/${roomId}`, data),

  /** DELETE /landlord/rooms/:id — remove room + images */
  deleteRoom: (roomId: string) =>
    api.delete(`/landlord/rooms/${roomId}`),

  /** GET /landlord/inquiries — all inquiries for landlord's properties */
  myInquiries: () =>
    api.get<Inquiry[]>('/landlord/inquiries'),
}
