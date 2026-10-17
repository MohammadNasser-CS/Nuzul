import type { IconType } from 'react-icons'
import {
  LuAirVent,
  LuBath,
  LuBuilding2,
  LuDroplet,
  LuFlame,
  LuHouse,
  LuLampDesk,
  LuSun,
  LuDoorOpen,
  LuUsers,
  LuUser,
  LuWifi,
  LuZap,
  LuSparkles,
} from 'react-icons/lu'
import type { Property, Room } from '@/types'

/** Property-level utilities — key matches `property.amenities.<key>` */
export const PROPERTY_AMENITIES: { field: keyof Pick<Property, 'has_gas' | 'has_electricity' | 'has_water' | 'has_internet'>; key: string; icon: IconType }[] = [
  { field: 'has_electricity', key: 'electricity', icon: LuZap },
  { field: 'has_water', key: 'water', icon: LuDroplet },
  { field: 'has_gas', key: 'gas', icon: LuFlame },
  { field: 'has_internet', key: 'internet', icon: LuWifi },
]

/** Room-level features — key matches `property.amenities.<key>` */
export const ROOM_AMENITIES: { field: keyof Pick<Room, 'has_internal_bathroom' | 'has_internal_balcony' | 'has_ac' | 'has_office'>; key: string; icon: IconType }[] = [
  { field: 'has_internal_bathroom', key: 'bathroom', icon: LuBath },
  { field: 'has_ac', key: 'ac', icon: LuAirVent },
  { field: 'has_office', key: 'office', icon: LuLampDesk },
  { field: 'has_internal_balcony', key: 'balcony', icon: LuSun },
]

export const PROPERTY_TYPE_ICONS: Record<Property['property_type'], IconType> = {
  APARTMENT: LuBuilding2,
  HOUSE: LuHouse,
  STUDIO: LuDoorOpen,
}

export const ROOM_TYPE_ICONS: Record<Room['room_type'] | 'NO_PREFERENCE', IconType> = {
  SINGLE: LuUser,
  SHARED: LuUsers,
  STUDIO: LuDoorOpen,
  NO_PREFERENCE: LuSparkles,
}
