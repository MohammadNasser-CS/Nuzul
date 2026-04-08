// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  supabase_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'student' | 'landlord' | 'admin'
  is_active: boolean
  created_at: string
}

// ── Property ──────────────────────────────────────────────────────────────────
export interface Property {
  id: string
  owner_id: string
  title: string
  description: string | null
  address: string
  city: string
  price_per_month: number
  rooms: number
  is_available: boolean
  near_university: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export type PropertyCreate = Omit<Property, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
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
