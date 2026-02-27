-- ============================================================
-- SKUPI — Waiting List + Self-Cancel
-- ============================================================

-- Add cancel token to payments (UUID for secure self-cancel links)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS cancel_token uuid DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_cancel_token_idx
  ON public.payments(cancel_token);

-- ============================================================
-- WAITING LIST TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waiting_list (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ime              text NOT NULL,
  email            text NOT NULL,
  mobitel          text,                          -- optional phone number
  notify_whatsapp  boolean NOT NULL DEFAULT false,
  notify_viber     boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  notified_at      timestamptz                    -- NULL = waiting, set when notified
);

CREATE INDEX IF NOT EXISTS waiting_list_event_id_idx
  ON public.waiting_list(event_id);

-- Partial index to quickly find un-notified entries per event
CREATE INDEX IF NOT EXISTS waiting_list_pending_idx
  ON public.waiting_list(event_id, created_at)
  WHERE notified_at IS NULL;

-- ============================================================
-- RLS FOR WAITING LIST
-- ============================================================

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Guests can join waiting list
CREATE POLICY "waiting_list_public_insert"
  ON public.waiting_list FOR INSERT
  WITH CHECK (true);

-- Owners can see waiting list for their events
CREATE POLICY "waiting_list_owner_select"
  ON public.waiting_list FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.owners o ON e.owner_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );
