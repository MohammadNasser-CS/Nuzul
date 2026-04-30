from enum import Enum


class InquiryStatus(str, Enum):
    PENDING    = "PENDING"    # New, needs admin attention
    CONTACTED  = "CONTACTED"  # Admin has reached out to both parties
    BOOKED     = "BOOKED"     # Student successfully booked the room ✅
    CANCELLED  = "CANCELLED"  # Fell through / cancelled for any reason ❌
