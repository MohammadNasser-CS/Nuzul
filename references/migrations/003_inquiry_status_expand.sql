-- ============================================================
-- Migration 003 — Expand inquiry_status_enum
--                 CLOSED → CANCELLED, add BOOKED
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run (idempotent).
-- ============================================================


-- ── Step 1: Add new enum values (no-op if they already exist) ────────────────
--
-- ADD VALUE IF NOT EXISTS is available in PostgreSQL 9.3+.
-- The DO block swallows the error if the type doesn't exist at all
-- (covers the case where inquiries.status is a plain TEXT column).

DO $$ BEGIN
    ALTER TYPE inquiry_status_enum ADD VALUE IF NOT EXISTS 'BOOKED';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE inquiry_status_enum ADD VALUE IF NOT EXISTS 'CANCELLED';
EXCEPTION WHEN undefined_object THEN NULL; END $$;


-- ── Step 2: Migrate legacy CLOSED rows → CANCELLED ───────────────────────────
--
-- Works for both TEXT and ENUM columns.
-- For ENUM columns this must come AFTER the ADD VALUE above so the
-- column already accepts 'CANCELLED' before we write it.

UPDATE inquiries
SET    status = 'CANCELLED'
WHERE  status = 'CLOSED';


-- ── Step 3: Fix CHECK constraint (only if status is TEXT + CHECK) ─────────────
--
-- Finds any CHECK constraint on the inquiries.status column, drops it,
-- and adds an updated one.  No-op when the column is an ENUM type
-- (ENUM types don't use CHECK constraints).

DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    SELECT conname INTO v_constraint
    FROM   pg_constraint c
    JOIN   pg_class      t ON t.oid = c.conrelid
    WHERE  t.relname = 'inquiries'
    AND    c.contype = 'c'
    AND    pg_get_constraintdef(c.oid) LIKE '%status%';

    IF v_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE inquiries DROP CONSTRAINT %I', v_constraint);

        ALTER TABLE inquiries
            ADD CONSTRAINT inquiries_status_check
            CHECK (status IN ('PENDING', 'CONTACTED', 'BOOKED', 'CANCELLED'));

        RAISE NOTICE 'CHECK constraint updated to include BOOKED and CANCELLED.';
    END IF;
END $$;


-- ── Step 4: Verify ───────────────────────────────────────────────────────────
--
-- Run this SELECT after the migration to confirm the distribution looks right.
-- Expected: no CLOSED rows, BOOKED and CANCELLED accepted.

SELECT status, COUNT(*) AS count
FROM   inquiries
GROUP  BY status
ORDER  BY status;
