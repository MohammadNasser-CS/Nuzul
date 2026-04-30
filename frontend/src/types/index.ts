// ── Shared enums ──────────────────────────────────────────────────────────────
/** Mirrors backend UniversityName enum — single source of truth for both
 *  student profiles and property nearby_university field. */
export type UniversityName =
  | 'An-Najah National University'
// | 'Birzeit University'
// | 'Palestine Polytechnic University'
// | 'Al-Quds University'
// | 'Arab American University'
// | 'Hebron University'
// | 'Bethlehem University'
// | 'Al-Azhar University Gaza'
// | 'Islamic University of Gaza'
// | 'Al-Quds Open University'
// | 'Palestine Technical University - Kadoorie'

/** All university names as a const array — use for dropdowns. */
export const UNIVERSITY_NAMES: UniversityName[] = [
  'An-Najah National University',
  // 'Birzeit University',
  // 'Palestine Polytechnic University',
  // 'Al-Quds University',
  // 'Arab American University',
  // 'Hebron University',
  // 'Bethlehem University',
  // 'Al-Azhar University Gaza',
  // 'Islamic University of Gaza',
  // 'Al-Quds Open University',
  // 'Palestine Technical University - Kadoorie',
]

// ── User ─────────────────────────────────────────────────────────────────────
export interface StudentProfile {
  id: string
  user_id: string
  date_of_birth: string
  gender: 'MALE' | 'FEMALE'
  university_name: UniversityName
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
  university_name: UniversityName
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
  /** Landlord's brand/portfolio name, e.g. "إسكان الريان" */
  group_name: string | null
  building_name: string | null
  building_number: string | null
  floor_number: number | null
  city: string
  country: string
  latitude: number
  longitude: number
  google_place_id: string | null
  formatted_address: string | null
  /** Nearest university — validated against UniversityName enum */
  nearby_university: UniversityName | null
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
  group_name?: string
  building_name?: string
  building_number?: string
  floor_number?: number
  city: string
  country?: string
  latitude: number
  longitude: number
  google_place_id?: string
  formatted_address?: string
  nearby_university?: UniversityName
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

// ── Inquiries ─────────────────────────────────────────────────────────────────
export type InquiryStatus = 'PENDING' | 'CONTACTED' | 'BOOKED' | 'CANCELLED'

export interface Inquiry {
  id: string
  student_id: string
  room_id: string
  property_id: string
  // Contact info snapshot (captured at creation time)
  student_name: string
  student_phone: string
  landlord_name: string
  landlord_phone: string
  message: string | null
  status: InquiryStatus
  handled_by: string | null
  handled_at: string | null
  created_at: string
  // Enriched fields (attached by backend _enrich helper)
  room?: { id: string; room_type: string; price_per_bed: string } | null
  property?: { id: string; title: string; city: string } | null
}

export interface InquiryCreate {
  room_id: string
  message?: string
}

export interface InquiryStatusUpdate {
  status: InquiryStatus
}

/** Shape returned by GET /admin/inquiries */
export interface InquiryListResponse {
  data: Inquiry[]
  counts: Record<InquiryStatus, number>
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminDashboardStats {
  total_users: number
  active_users: number
  total_students: number
  total_landlords: number
  total_properties: number
  pending_properties: number
  approved_properties: number
  rejected_properties: number
  total_rooms: number
  total_inquiries: number
  pending_inquiries: number
  contacted_inquiries: number
  booked_inquiries: number
  cancelled_inquiries: number
}

/** Property as returned by admin endpoints — includes landlord contact fields. */
export interface AdminProperty extends Property {
  landlord_name: string | null
  landlord_phone: string | null
  landlord_email: string | null
}

/** User as returned by admin endpoints — includes derived counts and role-specific sub-records. */
export interface AdminUser {
  id: string
  supabase_user_id: string
  email: string
  full_name: string | null
  phone_number: string | null
  role: 'STUDENT' | 'LANDLORD' | 'ADMIN'
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  property_count: number
  inquiry_count: number
  // LANDLORD detail
  properties?: AdminProperty[]
  // STUDENT detail
  student_profile?: StudentProfile | null
  inquiries?: Inquiry[]
}

// ── Filters & Pagination ──────────────────────────────────────────────────────
export interface ListingFilters {
  city?: string
  property_type?: Property['property_type']
  gender_preference?: Property['gender_preference']
  room_type?: Room['room_type']
  min_price?: number
  max_price?: number
  nearby_university?: UniversityName
  group_name?: string
}

/** Shape returned by GET /listings (paginated) */
export interface PaginatedListings {
  items: Property[]
  total: number   // total matching properties across all pages
  page: number    // current page (1-based)
  limit: number   // page size used
  pages: number   // total number of pages
}
