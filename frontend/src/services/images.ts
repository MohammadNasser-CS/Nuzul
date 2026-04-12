import api from './api'
import type { PropertyImage } from '@/types'

export const imagesService = {
  upload: (params: {
    entity_id: string
    entity_type: 'PROPERTY' | 'ROOM'
    is_primary?: boolean
    file: File
  }) => {
    const formData = new FormData()
    formData.append('entity_id', params.entity_id)
    formData.append('entity_type', params.entity_type)
    if (params.is_primary !== undefined) {
      formData.append('is_primary', String(params.is_primary))
    }
    formData.append('file', params.file)
    return api.post<PropertyImage>('/images/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (id: string) =>
    api.delete(`/images/${id}`),
}
