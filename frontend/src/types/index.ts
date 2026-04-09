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
  student_profile?: StudentProfile | null  // ← only present when role == STUDENT
}

// ── Auth payloads ─────────────────────────────────────────────────────────────
export interface CompleteProfilePayload {
  full_name: string
  phone_number: string
  role: 'STUDENT' | 'LANDLORD'
}

export interface CompleteStudentProfilePayload {
  date_of_birth: string          // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE'
  university_name: 'An-Najah National University'
  college: string
  degree: 'Diploma' | 'Bachelor' | 'Master' | 'Doctorate'
  specialization: string
  budget_min: number
  budget_max: number
  preferred_room_type: 'SINGLE' | 'SHARED' | 'STUDIO' | 'NO_PREFERENCE'
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