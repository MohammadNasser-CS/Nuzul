// ── User ─────────────────────────────────────────────────────────────────────
export interface StudentProfile {
  id: string
  user_id: string
  date_of_birth: string
  gender: 'MALE' | 'FEMALE'
  university_name: string
  college: string
  degree: 'Diploma' | 'Bachelor' | 'Master' | 'Doctorate'
  specialization: string
  budget_min: number
  budget_max: number
  preferred_room_type: 'SINGLE' | 'SHARED' | 'STUDIO' | 'NO_PREFERENCE'
  created_at: string
}

export interface User {
  id: string
  supabase_user_id: string
  email: string
  full_name: string | null
  phone_number: string | null
  role: 'STUDENT' | 'LANDLORD' | 'ADMIN' | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  student_profile?: StudentProfile | null
}

// ── Auth payloads ─────────────────────────────────────────────────────────────
export interface CompleteProfilePayload {
  full_name: string
  phone_number: string
  role: 'STUDENT' | 'LANDLORD'
}

export interface CompleteStudentProfilePayload {
  date_of_birth: string
  gender: 'MALE' | 'FEMALE'
  university_name: 'An-Najah National University'
  college: string
  degree: 'Diploma' | 'Bachelor' | 'Master' | 'Doctorate'
  specialization: string
  budget_min: number
  budget_max: number
  preferred_room_type: 'SINGLE' | 'SHARED' | 'STUDIO' | 'NO_PREFERENCE'
}

// ── Images ────────────────────────────────────────────────────────────────────
export interface PropertyImage {
  id: string
  entity_id: string
  entity_type: 'PROPERTY' | 'ROOM'
  image_url: string
  storage_path: string
  is_primary: boolean
  created_at: string
}

// ── Rooms ─────────────────────────────────────────────────────────────────────
export interface Room {
  id: string
  property_id: string
  description: string | null
  price_per_bed: string // Decimal string from backend e.g. "500.00"
  available_from: string | null
  room_type: 'SINGLE' | 'SHARED' | 'STUDIO'
  number_of_beds: number
  available_beds: number
  is_available: boolean
  has_internal_bathroom: boolean
  has_internal_balcony: boolean
  has_ac: boolean
  has_office: boolean
  is_active: boolean
  created_at: string
  images?: PropertyImage[]
}

export interface RoomCreate {
  property_id: string
  description?: string
  price_per_bed: number
  available_from?: string
  room_type: 'SINGLE' | 'SHARED' | 'STUDIO'
  number_of_beds?: number
  available_beds?: number
  has_internal_bathroom?: boolean
  has_internal_balcony?: boolean
  has_ac?: boolean
  has_office?: boolean
}

export type RoomUpdate = Partial<Omit<RoomCreate, 'property_id'>>

// ── Property ──────────────────────────────────────────────────────────────────
export interface Property {
  id: string
  landlord_id: string
  title: string
  description: string | null
  building_name: string | null
  building_number: string | null
  floor_number: number | null
  city: string
  country: string
  latitude: number
  longitude: number
  google_place_id: string | null
  formatted_address: string | null
  property_type: 'APARTMENT' | 'HOUSE' | 'STUDIO'
  gender_preference: 'MALE' | 'FEMALE' | 'ANY'
  has_gas: boolean
  has_electricity: boolean
  has_water: boolean
  has_internet: boolean
  is_active: boolean
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  verified_at: string | null
  verified_by: string | null
  rejection_reason: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  rooms?: Room[]
  images?: PropertyImage[]
  cover_image?: string | null
}

export interface PropertyCreate {
  title: string
  description?: string
  building_name?: string
  building_number?: string
  floor_number?: number
  city: string
  country?: string
  latitude: number
  longitude: number
  google_place_id?: string
  formatted_address?: string
  property_type: 'APARTMENT' | 'HOUSE' | 'STUDIO'
  gender_preference?: 'MALE' | 'FEMALE' | 'ANY'
  has_gas?: boolean
  has_electricity?: boolean
  has_water?: boolean
  has_internet?: boolean
}

export type PropertyUpdate = Partial<PropertyCreate>

// ── Booking ───────────────────────────────────────────────────────────────────
export interface Booking {
  id: string
  property_id: string
  student_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  move_in_date: string
  move_out_date: string | null
  message: string | null
  created_at: string
}

export type BookingCreate = Pick<Booking, 'property_id' | 'move_in_date' | 'move_out_date' | 'message'>
export type BookingUpdate = Partial<Pick<Booking, 'status' | 'move_out_date'>>

// ── Filters ───────────────────────────────────────────────────────────────────
export interface ListingFilters {
  city?: string
  property_type?: Property['property_type']
  gender_preference?: Property['gender_preference']
  room_type?: Room['room_type']
  min_price?: number
  max_price?: number
}
