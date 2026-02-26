-- ============================================================
-- SKUPI — Fix payments.status constraint
-- The original constraint only allowed ('pending','paid','refunded')
-- but the webhook and cron logic uses additional statuses.
-- ============================================================

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
    CHECK (status IN (
      'pending',
      'capturing',
      'cancelling',
      'confirmed',
      'paid',
      'failed',
      'cancelled',
      'refunded'
    ));
