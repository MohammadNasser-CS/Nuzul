-- ============================================================
-- Migration 001 — Properties, Rooms, Images
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Drop old tables (if exist from previous schema) ───────────────────────
DROP TABLE IF EXISTS properties CASCADE;


-- ── 2. Enum types ─────────────────────────────────────────────────────────────
-- Safe to re-run: only creates if the type doesn't already exist.

DO $$ BEGIN
    CREATE TYPE property_type_enum      AS ENUM ('APARTMENT', 'HOUSE', 'STUDIO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE gender_preference_enum  AS ENUM ('MALE', 'FEMALE', 'ANY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE room_type_enum          AS ENUM ('SINGLE', 'SHARED', 'STUDIO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE image_entity_type_enum  AS ENUM ('PROPERTY', 'ROOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 3. Properties table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Basic Info
    title               TEXT NOT NULL,
    description         TEXT,

    -- Building Info
    building_name       TEXT,
    building_number     TEXT,
    floor_number        INTEGER,

    -- Location
    city                TEXT NOT NULL,
    country             TEXT NOT NULL DEFAULT 'Palestine',
    latitude            FLOAT NOT NULL,
    longitude           FLOAT NOT NULL,
    google_place_id     TEXT,
    formatted_address   TEXT,

    -- Classification
    property_type       property_type_enum NOT NULL,

    -- Preferences
    gender_preference   gender_preference_enum NOT NULL DEFAULT 'ANY',

    -- Amenities
    has_gas             BOOLEAN NOT NULL DEFAULT FALSE,
    has_electricity     BOOLEAN NOT NULL DEFAULT FALSE,
    has_water           BOOLEAN NOT NULL DEFAULT FALSE,
    has_internet        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    -- Moderation
    verification_status verification_status_enum NOT NULL DEFAULT 'PENDING',
    verified_at         TIMESTAMPTZ,
    verified_by         UUID REFERENCES user_profiles(id),
    rejected_at         TIMESTAMPTZ,
    rejected_by         UUID REFERENCES user_profiles(id),
    rejection_reason    TEXT,
    admin_notes         TEXT,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_city     ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status   ON properties(verification_status);


-- ── 4. Rooms table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id           UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Info
    description           TEXT,

    -- Pricing
    price_per_bed         DECIMAL(10, 2) NOT NULL CHECK (price_per_bed > 0),

    -- Availability
    available_from        DATE,

    -- Structure
    room_type             room_type_enum NOT NULL,
    number_of_beds        INTEGER NOT NULL DEFAULT 1 CHECK (number_of_beds >= 1),
    available_beds        INTEGER NOT NULL DEFAULT 1
                            CHECK (available_beds >= 0)
                            CHECK (available_beds <= number_of_beds),

    -- Features
    has_internal_bathroom BOOLEAN NOT NULL DEFAULT FALSE,
    has_internal_balcony  BOOLEAN NOT NULL DEFAULT FALSE,
    has_ac                BOOLEAN NOT NULL DEFAULT FALSE,
    has_office            BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);


-- ── 5. Images table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS images (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id    UUID NOT NULL,
    entity_type  image_entity_type_enum NOT NULL,
    image_url    TEXT NOT NULL,
    is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_id, entity_type);


-- ── 6. updated_at auto-trigger for properties ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 7. Row Level Security (RLS) ───────────────────────────────────────────────
-- Enable RLS — all access goes through the FastAPI service-role client,
-- so we just lock down direct client access.

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE images     ENABLE ROW LEVEL SECURITY;

-- Service-role (used by FastAPI) bypasses RLS automatically.
-- These policies only apply to anon / authenticated Supabase clients.

-- Public read: only approved + active properties
CREATE POLICY "Public read approved properties"
    ON properties FOR SELECT
    USING (verification_status = 'APPROVED' AND is_active = TRUE);

-- Public read: rooms (visibility filtered in app logic)
CREATE POLICY "Public read rooms"
    ON rooms FOR SELECT
    USING (is_active = TRUE);

-- Public read: images
CREATE POLICY "Public read images"
    ON images FOR SELECT
    USING (TRUE);
