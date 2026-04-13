from enum import Enum


class PropertyType(str, Enum):
    APARTMENT = "APARTMENT"
    HOUSE = "HOUSE"
    STUDIO = "STUDIO"


class GenderPreference(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    ANY = "ANY"


class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class RoomType(str, Enum):
    SINGLE = "SINGLE"
    SHARED = "SHARED"
    STUDIO = "STUDIO"


class ImageEntityType(str, Enum):
    PROPERTY = "PROPERTY"
    ROOM = "ROOM"
