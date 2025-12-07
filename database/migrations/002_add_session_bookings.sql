-- Migration: Add Session Bookings and Link Check-In Records to Sessions
-- Purpose: Enable parents to book children for sessions, and link check-in/out to specific sessions

-- Session Bookings (parent books child for a session)
CREATE TABLE IF NOT EXISTS public.session_bookings (
    booking_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    session_id uuid NOT NULL,
    child_id uuid NOT NULL,
    guardian_id uuid,
    qr_code character varying,
    otp_code character varying,
    status character varying DEFAULT 'booked' CHECK (status::text = ANY (ARRAY['booked'::character varying, 'checked_in'::character varying, 'checked_out'::character varying, 'cancelled'::character varying]::text[])),
    booked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    checked_in_at timestamp without time zone,
    checked_out_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT session_bookings_pkey PRIMARY KEY (booking_id),
    CONSTRAINT session_bookings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id) ON DELETE CASCADE,
    CONSTRAINT session_bookings_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE,
    CONSTRAINT session_bookings_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(guardian_id) ON DELETE SET NULL,
    CONSTRAINT session_bookings_unique UNIQUE (session_id, child_id)
);

-- Add session_id and booking_id to check_in_records
ALTER TABLE public.check_in_records 
ADD COLUMN IF NOT EXISTS session_id uuid,
ADD COLUMN IF NOT EXISTS booking_id uuid;

-- Add foreign key constraints for new columns
ALTER TABLE public.check_in_records
ADD CONSTRAINT check_in_records_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id) ON DELETE SET NULL,
ADD CONSTRAINT check_in_records_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.session_bookings(booking_id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_bookings_session_id ON public.session_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_child_id ON public.session_bookings(child_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_guardian_id ON public.session_bookings(guardian_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_status ON public.session_bookings(status);
CREATE INDEX IF NOT EXISTS idx_session_bookings_booked_at ON public.session_bookings(booked_at);

CREATE INDEX IF NOT EXISTS idx_check_in_records_session_id ON public.check_in_records(session_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_booking_id ON public.check_in_records(booking_id);

