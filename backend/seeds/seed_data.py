"""
Nuzul — Database Seed Script
=============================
Populates the database with realistic fake data for development and testing.

Usage (run from the /backend directory):
    python seeds/seed_data.py

What this creates:
    • 7  user_profiles  (1 admin, 3 landlords, 3 students)
    • 3  student_profiles
    • 7  properties     (4 APPROVED, 2 PENDING, 1 REJECTED) — with group_name & nearby_university
    • 15 rooms          (mix of SINGLE / SHARED / STUDIO)
    • 33 images         (14 property cover/gallery + 19 room images)
    • 5  inquiries      (mix of PENDING / CONTACTED / BOOKED / CANCELLED)

Note:
    Seed users have fixed fake supabase_user_ids.
    They are NOT real Supabase Auth users and cannot log in.
    Use them only to verify DB structure and API response shapes.
    Re-running the script is safe — existing records are skipped.
"""

import os
import sys

# -- Allow running from /backend directory ------------------------------------
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import get_db  # noqa: E402 (after sys.path fix)

# -- Image helpers -------------------------------------------------------------
# picsum.photos returns deterministic images by seed — no auth required.

def _img(seed: str, w: int = 800, h: int = 600) -> str:
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"


# =============================================================================
# SEED DATA DEFINITIONS
# =============================================================================

USERS = [
    # -- Admin --------------------------------------------------------------
    {
        "_key": "admin",
        "supabase_user_id": "00000000-0000-0000-0000-000000000001",
        "email": "admin@nuzul.ps",
        "full_name": "Admin Nuzul",
        "phone_number": "0591000001",
        "role": "ADMIN",
    },
    # -- Landlords ----------------------------------------------------------
    {
        "_key": "landlord_ahmad",
        "supabase_user_id": "00000000-0000-0000-0000-000000000011",
        "email": "ahmad.kareem@nuzul-seed.ps",
        "full_name": "أحمد الكريم",
        "phone_number": "0591100011",
        "role": "LANDLORD",
    },
    {
        "_key": "landlord_fatima",
        "supabase_user_id": "00000000-0000-0000-0000-000000000012",
        "email": "fatima.barakat@nuzul-seed.ps",
        "full_name": "فاطمة البركات",
        "phone_number": "0591100012",
        "role": "LANDLORD",
    },
    {
        "_key": "landlord_khalil",
        "supabase_user_id": "00000000-0000-0000-0000-000000000013",
        "email": "khalil.hassan@nuzul-seed.ps",
        "full_name": "خليل حسن",
        "phone_number": "0591100013",
        "role": "LANDLORD",
    },
    # -- Students -----------------------------------------------------------
    {
        "_key": "student_mohammed",
        "supabase_user_id": "00000000-0000-0000-0000-000000000021",
        "email": "mohammed.saleh@najah-seed.edu",
        "full_name": "محمد صالح",
        "phone_number": "0591200021",
        "role": "STUDENT",
    },
    {
        "_key": "student_sara",
        "supabase_user_id": "00000000-0000-0000-0000-000000000022",
        "email": "sara.nabulsi@najah-seed.edu",
        "full_name": "سارة النابلسي",
        "phone_number": "0591200022",
        "role": "STUDENT",
    },
    {
        "_key": "student_omar",
        "supabase_user_id": "00000000-0000-0000-0000-000000000023",
        "email": "omar.zayed@najah-seed.edu",
        "full_name": "عمر زيد",
        "phone_number": "0591200023",
        "role": "STUDENT",
    },
]

# built after users are inserted: { "_key": internal_uuid }
_ids: dict[str, str] = {}


def _student_profiles() -> list[dict]:
    return [
        {
            "user_id": _ids["student_mohammed"],
            "date_of_birth": "2001-05-15",
            "gender": "MALE",
            "university_name": "An-Najah National University",
            "college": "كلية الهندسة",
            "degree": "Bachelor",
            "specialization": "هندسة البرمجيات",
            "budget_min": 800,
            "budget_max": 1500,
            "preferred_room_type": "SINGLE",
        },
        {
            "user_id": _ids["student_sara"],
            "date_of_birth": "2003-09-20",
            "gender": "FEMALE",
            "university_name": "An-Najah National University",
            "college": "كلية الطب",
            "degree": "Bachelor",
            "specialization": "الطب العام",
            "budget_min": 1000,
            "budget_max": 2200,
            "preferred_room_type": "STUDIO",
        },
        {
            "user_id": _ids["student_omar"],
            "date_of_birth": "2000-03-10",
            "gender": "MALE",
            "university_name": "An-Najah National University",
            "college": "كلية إدارة الأعمال",
            "degree": "Master",
            "specialization": "إدارة الأعمال والتمويل",
            "budget_min": 600,
            "budget_max": 1200,
            "preferred_room_type": "SHARED",
        },
    ]


def _properties() -> list[dict]:
    admin_id   = _ids["admin"]
    ahmad_id   = _ids["landlord_ahmad"]
    fatima_id  = _ids["landlord_fatima"]
    khalil_id  = _ids["landlord_khalil"]

    return [
        # -- Ahmad — Nablus  (brand: إسكان الكريم) ─────────────────────────
        {
            "_key": "prop_najah_apt",
            "landlord_id": ahmad_id,
            "group_name": "إسكان الكريم",
            "nearby_university": "An-Najah National University",
            "title": "شقة مفروشة قريبة من جامعة النجاح",
            "description": (
                "شقة مفروشة بالكامل تقع على بُعد دقيقتين سيرًا من بوابة جامعة النجاح الوطنية. "
                "تشمل غرف نوم مريحة، مطبخًا مجهزًا، وإنترنت سريع. مناسبة للطلاب الجادين."
            ),
            "building_name": "بناية الربيع",
            "building_number": "12",
            "floor_number": 2,
            "city": "Nablus",
            "country": "Palestine",
            "latitude": 32.2219,
            "longitude": 35.2560,
            "formatted_address": "شارع جامعة النجاح، نابلس",
            "google_place_id": None,
            "property_type": "APARTMENT",
            "gender_preference": "MALE",
            "has_gas": True,
            "has_electricity": True,
            "has_water": True,
            "has_internet": True,
            "is_active": True,
            "verification_status": "APPROVED",
            "verified_by": admin_id,
            "verified_at": "2025-01-10T10:00:00+00:00",
        },
        {
            "_key": "prop_rafidya_house",
            "landlord_id": ahmad_id,
            "group_name": "إسكان الكريم",
            "nearby_university": "An-Najah National University",
            "title": "بيت طلابي واسع في رفيديا",
            "description": (
                "بيت مستقل في حي رفيديا الهادئ. يضم ثلاث غرف، صالة، ومطبخًا كاملًا. "
                "قريب من المستشفى الوطني ووسائل المواصلات. يناسب مجموعة من الطلاب."
            ),
            "building_name": None,
            "building_number": "7",
            "floor_number": 0,
            "city": "Nablus",
            "country": "Palestine",
            "latitude": 32.2295,
            "longitude": 35.2387,
            "formatted_address": "حي رفيديا، نابلس",
            "google_place_id": None,
            "property_type": "HOUSE",
            "gender_preference": "ANY",
            "has_gas": True,
            "has_electricity": True,
            "has_water": True,
            "has_internet": False,
            "is_active": True,
            "verification_status": "APPROVED",
            "verified_by": admin_id,
            "verified_at": "2025-01-15T09:00:00+00:00",
        },

        # -- Fatima — Ramallah  (brand: إسكان البركات) ─────────────────────
        {
            "_key": "prop_ramallah_studio",
            "landlord_id": fatima_id,
            "group_name": "إسكان البركات",
            "nearby_university": None,
            "title": "استوديو عصري في قلب رام الله",
            "description": (
                "وحدات استوديو حديثة مؤثثة بالكامل في المنطقة التجارية لرام الله. "
                "مناسبة لطالبات الدراسات العليا والموظفات. قريبة من المطاعم والخدمات."
            ),
            "building_name": "برج المنارة",
            "building_number": "1",
            "floor_number": 4,
            "city": "Ramallah",
            "country": "Palestine",
            "latitude": 31.9022,
            "longitude": 35.2034,
            "formatted_address": "شارع المنارة، رام الله",
            "google_place_id": None,
            "property_type": "STUDIO",
            "gender_preference": "FEMALE",
            "has_gas": False,
            "has_electricity": True,
            "has_water": True,
            "has_internet": True,
            "is_active": True,
            "verification_status": "APPROVED",
            "verified_by": admin_id,
            "verified_at": "2025-02-01T11:00:00+00:00",
        },
        {
            "_key": "prop_birzeit_shared",
            "landlord_id": fatima_id,
            "group_name": "إسكان البركات",
            "nearby_university": None,
            "title": "سكن مشترك قرب جامعة بيرزيت",
            "description": (
                "شقة مشتركة مناسبة لطلاب جامعة بيرزيت. "
                "الموقع ممتاز، البيئة هادئة وآمنة، بالقرب من الخط الواصل للجامعة."
            ),
            "building_name": "بناية الأمل",
            "building_number": "3",
            "floor_number": 1,
            "city": "Ramallah",
            "country": "Palestine",
            "latitude": 31.9781,
            "longitude": 35.1832,
            "formatted_address": "طريق بيرزيت، رام الله",
            "google_place_id": None,
            "property_type": "APARTMENT",
            "gender_preference": "ANY",
            "has_gas": True,
            "has_electricity": True,
            "has_water": True,
            "has_internet": True,
            "is_active": True,
            "verification_status": "PENDING",
            "verified_by": None,
            "verified_at": None,
        },

        # -- Khalil — Nablus  (REJECTED — bad images) ──────────────────────────
        {
            "_key": "prop_nablus_rejected",
            "landlord_id": khalil_id,
            "group_name": None,
            "nearby_university": "An-Najah National University",
            "title": "شقة في العمارية قرب جامعة النجاح",
            "description": (
                "شقة بثلاث غرف نوم تقع في حي العمارية قرب الجامعة. "
                "تم رفضها بسبب جودة الصور المرفوعة."
            ),
            "building_name": "بناية الفجر",
            "building_number": "22",
            "floor_number": 1,
            "city": "Nablus",
            "country": "Palestine",
            "latitude": 32.2235,
            "longitude": 35.2590,
            "formatted_address": "حي العمارية، نابلس",
            "google_place_id": None,
            "property_type": "APARTMENT",
            "gender_preference": "MALE",
            "has_gas": True,
            "has_electricity": True,
            "has_water": True,
            "has_internet": False,
            "is_active": True,
            "verification_status": "REJECTED",
            "verified_by": None,
            "verified_at": None,
            "rejected_by": admin_id,
            "rejected_at": "2025-01-25T14:00:00+00:00",
            "rejection_reason": (
                "الصور المرفوعة لا تعكس الحالة الفعلية للعقار وجودتها منخفضة. "
                "يرجى رفع صور أوضح وأكثر تفصيلاً ثم إعادة تقديم الطلب."
            ),
            "admin_notes": "المالك جديد على المنصة — يحتاج توجيهاً حول متطلبات الصور.",
        },

        # -- Khalil — Jenin ─────────────────────────────────────────────────
        {
            "_key": "prop_jenin_affordable",
            "landlord_id": khalil_id,
            "group_name": None,
            "nearby_university": None,
            "title": "سكن طلابي اقتصادي في جنين",
            "description": (
                "سكن طلابي بأسعار معقولة في وسط مدينة جنين. "
                "مناسب للطلاب ذوي الميزانية المحدودة. يشمل الخدمات الأساسية."
            ),
            "building_name": "بناية الشباب",
            "building_number": "5",
            "floor_number": 1,
            "city": "Jenin",
            "country": "Palestine",
            "latitude": 32.4617,
            "longitude": 35.2960,
            "formatted_address": "شارع الحرية، جنين",
            "google_place_id": None,
            "property_type": "APARTMENT",
            "gender_preference": "MALE",
            "has_gas": True,
            "has_electricity": True,
            "has_water": True,
            "has_internet": False,
            "is_active": True,
            "verification_status": "APPROVED",
            "verified_by": admin_id,
            "verified_at": "2025-02-20T08:00:00+00:00",
        },
        {
            "_key": "prop_jenin_new",
            "landlord_id": khalil_id,
            "group_name": None,
            "nearby_university": None,
            "title": "شقة جديدة بتشطيب فاخر في جنين",
            "description": (
                "شقة حديثة لم تُسكن من قبل، بتشطيب عالي الجودة. "
                "تتميز بإطلالة رائعة وموقع استراتيجي."
            ),
            "building_name": "بناية النور",
            "building_number": "9",
            "floor_number": 3,
            "city": "Jenin",
            "country": "Palestine",
            "latitude": 32.4580,
            "longitude": 35.3010,
            "formatted_address": "شارع الاستقلال، جنين",
            "google_place_id": None,
            "property_type": "APARTMENT",
            "gender_preference": "ANY",
            "has_gas": True,
            "has_electricity": True,
            "has_water": True,
            "has_internet": True,
            "is_active": True,
            "verification_status": "PENDING",
            "verified_by": None,
            "verified_at": None,
        },
    ]


def _rooms() -> list[dict]:
    return [
        # -- prop_najah_apt -------------------------------------------------
        {
            "_key": "room_najah_single_a",
            "_property": "prop_najah_apt",
            "description": "غرفة مفردة هادئة مع إطلالة على الحديقة، سرير مريح ومكتب دراسة.",
            "price_per_bed": 1200,
            "available_from": "2025-02-01",
            "room_type": "SINGLE",
            "number_of_beds": 1,
            "available_beds": 1,
            "has_internal_bathroom": True,
            "has_internal_balcony": False,
            "has_ac": True,
            "has_office": True,
            "is_active": True,
        },
        {
            "_key": "room_najah_shared_a",
            "_property": "prop_najah_apt",
            "description": "غرفة مشتركة واسعة بسريرين، مناسبة لطالبين. توفر خصوصية جيدة.",
            "price_per_bed": 750,
            "available_from": "2025-02-01",
            "room_type": "SHARED",
            "number_of_beds": 2,
            "available_beds": 1,
            "has_internal_bathroom": False,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": True,
            "is_active": True,
        },
        {
            "_key": "room_najah_shared_b",
            "_property": "prop_najah_apt",
            "description": "غرفة مشتركة بأربعة أسرّة، الأرخص في المنطقة مع نظافة ممتازة.",
            "price_per_bed": 500,
            "available_from": "2025-03-01",
            "room_type": "SHARED",
            "number_of_beds": 4,
            "available_beds": 2,
            "has_internal_bathroom": False,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": False,
            "is_active": True,
        },

        # -- prop_rafidya_house ---------------------------------------------
        {
            "_key": "room_rafidya_single",
            "_property": "prop_rafidya_house",
            "description": "غرفة مفردة مع حمام خاص. الأهدأ في البيت.",
            "price_per_bed": 1400,
            "available_from": "2025-01-20",
            "room_type": "SINGLE",
            "number_of_beds": 1,
            "available_beds": 0,
            "has_internal_bathroom": True,
            "has_internal_balcony": True,
            "has_ac": True,
            "has_office": True,
            "is_active": True,
        },
        {
            "_key": "room_rafidya_shared",
            "_property": "prop_rafidya_house",
            "description": "غرفة مشتركة كبيرة تتسع لثلاثة طلاب. مجهزة بمكاتب دراسة.",
            "price_per_bed": 650,
            "available_from": "2025-01-20",
            "room_type": "SHARED",
            "number_of_beds": 3,
            "available_beds": 2,
            "has_internal_bathroom": False,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": True,
            "is_active": True,
        },
        {
            "_key": "room_rafidya_studio",
            "_property": "prop_rafidya_house",
            "description": "استوديو صغير مستقل داخل البيت بمدخل خاص. مثالي للخصوصية.",
            "price_per_bed": 1600,
            "available_from": "2025-04-01",
            "room_type": "STUDIO",
            "number_of_beds": 1,
            "available_beds": 1,
            "has_internal_bathroom": True,
            "has_internal_balcony": True,
            "has_ac": True,
            "has_office": True,
            "is_active": True,
        },

        # -- prop_ramallah_studio -------------------------------------------
        {
            "_key": "room_ramallah_studio_a",
            "_property": "prop_ramallah_studio",
            "description": "استوديو فاخر بمطبخ صغير وحمام خاص. إطلالة على المدينة.",
            "price_per_bed": 2000,
            "available_from": "2025-02-15",
            "room_type": "STUDIO",
            "number_of_beds": 1,
            "available_beds": 1,
            "has_internal_bathroom": True,
            "has_internal_balcony": True,
            "has_ac": True,
            "has_office": True,
            "is_active": True,
        },
        {
            "_key": "room_ramallah_studio_b",
            "_property": "prop_ramallah_studio",
            "description": "استوديو متوسط الحجم بمساحة مفتوحة مريحة.",
            "price_per_bed": 1800,
            "available_from": "2025-02-15",
            "room_type": "STUDIO",
            "number_of_beds": 1,
            "available_beds": 0,
            "has_internal_bathroom": True,
            "has_internal_balcony": False,
            "has_ac": True,
            "has_office": False,
            "is_active": True,
        },

        # -- prop_birzeit_shared (PENDING property) -------------------------
        {
            "_key": "room_birzeit_shared_a",
            "_property": "prop_birzeit_shared",
            "description": "غرفة مشتركة بسريرين بالقرب من محطة الحافلات.",
            "price_per_bed": 700,
            "available_from": "2025-03-01",
            "room_type": "SHARED",
            "number_of_beds": 2,
            "available_beds": 2,
            "has_internal_bathroom": False,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": True,
            "is_active": True,
        },
        {
            "_key": "room_birzeit_shared_b",
            "_property": "prop_birzeit_shared",
            "description": "غرفة مشتركة بأربعة أسرة، أسعار مناسبة جدًا.",
            "price_per_bed": 500,
            "available_from": "2025-03-01",
            "room_type": "SHARED",
            "number_of_beds": 4,
            "available_beds": 4,
            "has_internal_bathroom": False,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": False,
            "is_active": True,
        },

        # -- prop_jenin_affordable ------------------------------------------
        {
            "_key": "room_jenin_single",
            "_property": "prop_jenin_affordable",
            "description": "غرفة مفردة صغيرة ونظيفة بسعر اقتصادي.",
            "price_per_bed": 600,
            "available_from": "2025-03-01",
            "room_type": "SINGLE",
            "number_of_beds": 1,
            "available_beds": 1,
            "has_internal_bathroom": False,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": False,
            "is_active": True,
        },
        {
            "_key": "room_jenin_shared_a",
            "_property": "prop_jenin_affordable",
            "description": "غرفة مشتركة بسريرين. هادئة ومناسبة للدراسة.",
            "price_per_bed": 450,
            "available_from": "2025-03-01",
            "room_type": "SHARED",
            "number_of_beds": 2,
            "available_beds": 2,
            "has_internal_bathroom": False,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": True,
            "is_active": True,
        },
        {
            "_key": "room_jenin_shared_b",
            "_property": "prop_jenin_affordable",
            "description": "غرفة مشتركة بثلاثة أسرة. الأرخص في المنطقة.",
            "price_per_bed": 350,
            "available_from": "2025-03-01",
            "room_type": "SHARED",
            "number_of_beds": 3,
            "available_beds": 3,
            "has_internal_bathroom": False,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": False,
            "is_active": True,
        },

        # -- prop_nablus_rejected (REJECTED property) ----------------------
        {
            "_key": "room_rejected_single",
            "_property": "prop_nablus_rejected",
            "description": "غرفة مفردة بحمام خاص، الصور المرفوعة كانت غير واضحة.",
            "price_per_bed": 950,
            "available_from": "2025-02-01",
            "room_type": "SINGLE",
            "number_of_beds": 1,
            "available_beds": 1,
            "has_internal_bathroom": True,
            "has_internal_balcony": False,
            "has_ac": False,
            "has_office": True,
            "is_active": True,
        },

        # -- prop_jenin_new (PENDING property) -----------------------------
        {
            "_key": "room_jenin_new_single",
            "_property": "prop_jenin_new",
            "description": "غرفة مفردة فاخرة بتشطيب حديث وحمام خاص.",
            "price_per_bed": 1100,
            "available_from": "2025-05-01",
            "room_type": "SINGLE",
            "number_of_beds": 1,
            "available_beds": 1,
            "has_internal_bathroom": True,
            "has_internal_balcony": True,
            "has_ac": True,
            "has_office": True,
            "is_active": True,
        },
    ]


def _inquiries() -> list[dict]:
    """
    Realistic inquiries between seed students and seed rooms.
    Covers all four statuses: PENDING / CONTACTED / BOOKED / CANCELLED.
    """
    admin_id    = _ids["admin"]
    mohammed_id = _ids["student_mohammed"]
    sara_id     = _ids["student_sara"]
    omar_id     = _ids["student_omar"]

    return [
        # ── محمد → غرفة مفردة النجاح  (PENDING) ───────────────────────────
        {
            "_key": "inq_mohammed_najah_single",
            "student_id":    mohammed_id,
            "room_id":       _ids["room_najah_single_a"],
            "property_id":   _ids["prop_najah_apt"],
            "student_name":  "محمد صالح",
            "student_phone": "0591200021",
            "landlord_name": "أحمد الكريم",
            "landlord_phone":"0591100011",
            "message": "أنا طالب في كلية الهندسة، أبحث عن غرفة هادئة للدراسة. هل الغرفة لا تزال متاحة؟",
            "status": "PENDING",
            "handled_by": None,
            "handled_at": None,
            "created_at": "2025-03-01T10:30:00+00:00",
        },

        # ── محمد → غرفة مشتركة رفيديا  (PENDING) ──────────────────────────
        {
            "_key": "inq_mohammed_rafidya_shared",
            "student_id":    mohammed_id,
            "room_id":       _ids["room_rafidya_shared"],
            "property_id":   _ids["prop_rafidya_house"],
            "student_name":  "محمد صالح",
            "student_phone": "0591200021",
            "landlord_name": "أحمد الكريم",
            "landlord_phone":"0591100011",
            "message": "هل يمكن زيارة البيت يوم الجمعة القادم؟ أنا مهتم بالغرفة المشتركة.",
            "status": "PENDING",
            "handled_by": None,
            "handled_at": None,
            "created_at": "2025-03-05T14:00:00+00:00",
        },

        # ── سارة → استوديو رام الله  (BOOKED) ───────────────────────────────
        {
            "_key": "inq_sara_ramallah_studio",
            "student_id":    sara_id,
            "room_id":       _ids["room_ramallah_studio_a"],
            "property_id":   _ids["prop_ramallah_studio"],
            "student_name":  "سارة النابلسي",
            "student_phone": "0591200022",
            "landlord_name": "فاطمة البركات",
            "landlord_phone":"0591100012",
            "message": "أنا طالبة دراسات عليا، أحتاج إلى استوديو هادئ ومستقل. هل يتوفر موقف سيارات؟",
            "status": "BOOKED",
            "handled_by": admin_id,
            "handled_at": "2025-03-04T11:00:00+00:00",
            "created_at": "2025-03-02T16:00:00+00:00",
        },

        # ── سارة → غرفة مشتركة النجاح  (CONTACTED) ─────────────────────────
        {
            "_key": "inq_sara_najah_shared",
            "student_id":    sara_id,
            "room_id":       _ids["room_najah_shared_a"],
            "property_id":   _ids["prop_najah_apt"],
            "student_name":  "سارة النابلسي",
            "student_phone": "0591200022",
            "landlord_name": "أحمد الكريم",
            "landlord_phone":"0591100011",
            "message": None,
            "status": "CONTACTED",
            "handled_by": admin_id,
            "handled_at": "2025-03-11T09:00:00+00:00",
            "created_at": "2025-03-10T11:00:00+00:00",
        },

        # ── عمر → غرفة مشتركة جنين  (CANCELLED) ────────────────────────────
        {
            "_key": "inq_omar_jenin_shared",
            "student_id":    omar_id,
            "room_id":       _ids["room_jenin_shared_a"],
            "property_id":   _ids["prop_jenin_affordable"],
            "student_name":  "عمر زيد",
            "student_phone": "0591200023",
            "landlord_name": "خليل حسن",
            "landlord_phone":"0591100013",
            "message": "أنا طالب ماجستير، أبحث عن سكن لمدة سنة دراسية كاملة.",
            "status": "CANCELLED",
            "handled_by": admin_id,
            "handled_at": "2025-02-25T10:00:00+00:00",
            "created_at": "2025-02-24T08:00:00+00:00",
        },
    ]


def _images() -> list[dict]:
    """
    Returns image records.
    image_url: picsum.photos deterministic placeholder.
    storage_path: None (not uploaded to Supabase Storage — seed data only).
    """
    imgs = []

    def prop_img(prop_key: str, seed: str, is_primary: bool = False):
        imgs.append({
            "_entity_key": prop_key,
            "entity_type": "PROPERTY",
            "image_url": _img(seed),
            "storage_path": None,
            "is_primary": is_primary,
        })

    def room_img(room_key: str, seed: str):
        imgs.append({
            "_entity_key": room_key,
            "entity_type": "ROOM",
            "image_url": _img(seed),
            "storage_path": None,
            "is_primary": False,
        })

    # -- Property images ----------------------------------------------------
    prop_img("prop_najah_apt",       "najah1",   is_primary=True)
    prop_img("prop_najah_apt",       "najah2")
    prop_img("prop_najah_apt",       "najah3")

    prop_img("prop_rafidya_house",   "rafidya1", is_primary=True)
    prop_img("prop_rafidya_house",   "rafidya2")

    prop_img("prop_ramallah_studio", "ramstud1", is_primary=True)
    prop_img("prop_ramallah_studio", "ramstud2")
    prop_img("prop_ramallah_studio", "ramstud3")

    prop_img("prop_birzeit_shared",  "birzeit1", is_primary=True)
    prop_img("prop_birzeit_shared",  "birzeit2")

    prop_img("prop_jenin_affordable","jenin1",   is_primary=True)
    prop_img("prop_jenin_affordable","jenin2")

    prop_img("prop_jenin_new",       "jeninnew1",is_primary=True)

    prop_img("prop_nablus_rejected", "nablus_rej1", is_primary=True)

    # -- Room images --------------------------------------------------------
    room_img("room_najah_single_a",   "room_ns1")
    room_img("room_najah_single_a",   "room_ns2")
    room_img("room_najah_shared_a",   "room_na1")
    room_img("room_najah_shared_b",   "room_nb1")

    room_img("room_rafidya_single",   "room_rs1")
    room_img("room_rafidya_shared",   "room_rsh1")
    room_img("room_rafidya_studio",   "room_rst1")
    room_img("room_rafidya_studio",   "room_rst2")

    room_img("room_ramallah_studio_a","room_rma1")
    room_img("room_ramallah_studio_a","room_rma2")
    room_img("room_ramallah_studio_b","room_rmb1")

    room_img("room_birzeit_shared_a", "room_ba1")
    room_img("room_birzeit_shared_b", "room_bb1")

    room_img("room_jenin_single",     "room_js1")
    room_img("room_jenin_shared_a",   "room_ja1")
    room_img("room_jenin_shared_b",   "room_jb1")
    room_img("room_jenin_new_single", "room_jn1")
    room_img("room_jenin_new_single", "room_jn2")

    room_img("room_rejected_single",  "room_rej1")

    return imgs


# =============================================================================
# SEED RUNNER
# =============================================================================

def _section(title: str):
    print(f"\n{'-'*50}")
    print(f"  {title}")
    print(f"{'-'*50}")


def seed():
    db = get_db()

    print("\n" + "="*50)
    print("  🌱  Nuzul — Seed Script")
    print("="*50)

    # -- 1. Users ----------------------------------------------------------
    _section("👥 Users")
    for raw in USERS:
        u   = {k: v for k, v in raw.items() if k != "_key"}   # copy without _key
        key = raw["_key"]
        existing = (
            db.table("user_profiles")
            .select("id")
            .eq("supabase_user_id", u["supabase_user_id"])
            .execute()
        )
        if existing.data:
            _ids[key] = existing.data[0]["id"]
            print(f"  ↪  skipped  {u['full_name']} ({u['role']})")
        else:
            result = db.table("user_profiles").insert(u).execute()
            _ids[key] = result.data[0]["id"]
            print(f"  ✅ created  {u['full_name']} ({u['role']})")

    # -- 2. Student profiles -----------------------------------------------
    _section("🎓 Student Profiles")
    for sp in _student_profiles():
        existing = (
            db.table("student_profiles")
            .select("id")
            .eq("user_id", sp["user_id"])
            .execute()
        )
        if existing.data:
            print(f"  ↪  skipped  student_profile user_id={sp['user_id'][:8]}…")
        else:
            db.table("student_profiles").insert(sp).execute()
            print(f"  ✅ created  student_profile user_id={sp['user_id'][:8]}…")

    # -- 3. Properties -----------------------------------------------------
    _section("🏠 Properties")
    for prop in _properties():
        key = prop.pop("_key")
        existing = (
            db.table("properties")
            .select("id")
            .eq("landlord_id", prop["landlord_id"])
            .eq("title", prop["title"])
            .execute()
        )
        if existing.data:
            _ids[key] = existing.data[0]["id"]
            print(f"  ↪  skipped  '{prop['title']}'")
        else:
            result = db.table("properties").insert(prop).execute()
            _ids[key] = result.data[0]["id"]
            print(f"  ✅ created  '{prop['title']}' [{prop['verification_status']}]")

    # -- 4. Rooms ----------------------------------------------------------
    _section("🚪 Rooms")
    for room in _rooms():
        key       = room.pop("_key")
        prop_key  = room.pop("_property")
        room["property_id"] = _ids[prop_key]

        existing = (
            db.table("rooms")
            .select("id")
            .eq("property_id", room["property_id"])
            .eq("room_type", room["room_type"])
            .eq("price_per_bed", room["price_per_bed"])
            .execute()
        )
        if existing.data:
            _ids[key] = existing.data[0]["id"]
            print(f"  ↪  skipped  room '{key}'")
        else:
            result = db.table("rooms").insert(room).execute()
            _ids[key] = result.data[0]["id"]
            print(f"  ✅ created  room '{key}' ({room['room_type']}, ₪{room['price_per_bed']}/bed)")

    # -- 5. Patch new property fields (group_name / nearby_university) ------
    # NOTE: These fields are already included in the INSERT payloads above,
    # so this step is a no-op for fresh seeds.  It is kept for backward
    # compatibility: if the database was seeded before these columns existed,
    # running the script again will patch the existing rows automatically.
    _section("🔄 Patch Properties (group_name / nearby_university)")
    patch_map = {
        "prop_najah_apt":       {"group_name": "إسكان الكريم",  "nearby_university": "An-Najah National University"},
        "prop_rafidya_house":   {"group_name": "إسكان الكريم",  "nearby_university": "An-Najah National University"},
        "prop_ramallah_studio": {"group_name": "إسكان البركات", "nearby_university": None},
        "prop_birzeit_shared":  {"group_name": "إسكان البركات", "nearby_university": None},
        "prop_jenin_affordable":{"group_name": None,             "nearby_university": None},
        "prop_jenin_new":       {"group_name": None,             "nearby_university": None},
        "prop_nablus_rejected": {"group_name": None,             "nearby_university": None},
    }
    for prop_key, patch in patch_map.items():
        if prop_key not in _ids:
            continue
        prop_id = _ids[prop_key]
        # Fetch current values
        cur = db.table("properties").select("group_name, nearby_university").eq("id", prop_id).execute()
        if not cur.data:
            continue
        row = cur.data[0]
        needs_patch = {k: v for k, v in patch.items() if row.get(k) != v}
        if needs_patch:
            db.table("properties").update(needs_patch).eq("id", prop_id).execute()
            print(f"  ✅ patched   '{prop_key}' → {needs_patch}")
        else:
            print(f"  ↪  up-to-date '{prop_key}'")

    # -- 6. Images ---------------------------------------------------------
    _section("🖼️  Images")
    for img in _images():
        entity_key = img.pop("_entity_key")
        img["entity_id"] = _ids[entity_key]

        existing = (
            db.table("images")
            .select("id")
            .eq("entity_id", img["entity_id"])
            .eq("image_url", img["image_url"])
            .execute()
        )
        if existing.data:
            print(f"  ↪  skipped  image for '{entity_key}'")
        else:
            db.table("images").insert(img).execute()
            primary_tag = " [PRIMARY]" if img.get("is_primary") else ""
            print(f"  ✅ created  image for '{entity_key}'{primary_tag}")

    # -- 7. Inquiries ------------------------------------------------------
    _section("💬 Inquiries")
    for inq in _inquiries():
        key = inq.pop("_key")
        existing = (
            db.table("inquiries")
            .select("id")
            .eq("student_id", inq["student_id"])
            .eq("room_id",    inq["room_id"])
            .execute()
        )
        if existing.data:
            _ids[key] = existing.data[0]["id"]
            print(f"  ↪  skipped  inquiry '{key}'")
        else:
            result = db.table("inquiries").insert(inq).execute()
            _ids[key] = result.data[0]["id"]
            print(f"  ✅ created  inquiry '{key}' [{inq['status']}]")

    # -- Summary -----------------------------------------------------------
    print("\n" + "="*50)
    print("  ✅  Seed complete!")
    print("="*50)
    print(f"\n  Users created/found : {len(USERS)}")
    print(f"    • 1 Admin")
    print(f"    • 3 Landlords  (ahmad, fatima, khalil)")
    print(f"    • 3 Students   (mohammed, sara, omar)")
    print(f"\n  Properties  : 7  (4 APPROVED, 2 PENDING, 1 REJECTED)")
    print(f"  Rooms       : 15")
    print(f"  Images      : 33  (14 property, 19 room)")
    print(f"  Inquiries   : 5   (2 PENDING, 1 CONTACTED, 1 BOOKED, 1 CANCELLED) — all 4 statuses covered")
    print(f"\n  💡 Re-running is safe — existing records are skipped.")
    print()


if __name__ == "__main__":
    seed()
