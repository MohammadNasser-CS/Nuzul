import api from './api'
import type { Room, RoomCreate, RoomUpdate } from '@/types'

export const roomsService = {
  create: (data: RoomCreate) =>
    api.post<Room>('/rooms/', data),

  getById: (id: string) =>
    api.get<Room>(`/rooms/${id}`),

  update: (id: string, data: RoomUpdate) =>
    api.put<Room>(`/rooms/${id}`, data),

  delete: (id: string) =>
    api.delete(`/rooms/${id}`),
}
