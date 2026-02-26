-- ============================================================
-- SKUPI — Sprint 5: pg_cron auto-confirm/cancel + email hooks
-- ============================================================

-- Enable pg_net for HTTP calls from SQL (Supabase has this built-in)
create extension if not exists "pg_net";

-- ============================================================
-- HELPER: capture a single PaymentIntent via Stripe API
-- Called by the cron job for payments close to event date
-- ============================================================
create or replace function public.capture_payment(p_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_payment record;
  v_event   record;
  v_secret  text;
begin
  select p.*, p.stripe_payment_intent_id
  into v_payment
  from public.payments p
  where p.id = p_id and p.status = 'pending';

  if not found then return; end if;

  select e.* into v_event
  from public.events e
  where e.id = v_payment.event_id;

  -- Mark as processing to avoid double-capture
  update public.payments set status = 'capturing' where id = p_id;

  -- The actual Stripe capture is done via webhook (payment_intent.succeeded)
  -- Here we just trigger via our API route using pg_net
  perform net.http_post(
    url := current_setting('app.base_url') || '/api/payments/capture',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret')
    ),
    body := jsonb_build_object('payment_id', p_id::text)
  );
end;
$$;

-- ============================================================
-- HELPER: cancel a single PaymentIntent via API
-- ============================================================
create or replace function public.cancel_payment(p_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_payment record;
begin
  select * into v_payment
  from public.payments
  where id = p_id and status IN ('pending', 'capturing');

  if not found then return; end if;

  update public.payments set status = 'cancelling' where id = p_id;

  perform net.http_post(
    url := current_setting('app.base_url') || '/api/payments/cancel',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret')
    ),
    body := jsonb_build_object('payment_id', p_id::text)
  );
end;
$$;

-- ============================================================
-- MAIN CRON FUNCTION: run every hour
-- 1) Events ≤6 days away → capture pending payments
-- 2) Events that passed → cancel pending payments
-- ============================================================
create or replace function public.skupi_hourly_job()
returns void
language plpgsql
security definer
as $$
declare
  v_payment record;
  v_now     timestamptz := now();
begin

  -- 1. CAPTURE: events that are 0–6 days away (was using manual capture)
  for v_payment in
    select p.id
    from public.payments p
    join public.events e on e.id = p.event_id
    where p.status = 'pending'
      and e.datum >= v_now                          -- event hasn't passed
      and e.datum <= v_now + interval '6 days'      -- within capture window
  loop
    perform public.capture_payment(v_payment.id);
  end loop;

  -- 2. CANCEL: events that have already passed (over 1 hour ago)
  for v_payment in
    select p.id
    from public.payments p
    join public.events e on e.id = p.event_id
    where p.status = 'pending'
      and e.datum < v_now - interval '1 hour'       -- event is over
  loop
    perform public.cancel_payment(v_payment.id);
  end loop;

end;
$$;

-- ============================================================
-- SCHEDULE: run skupi_hourly_job every hour at :05
-- ============================================================
select cron.schedule(
  'skupi-hourly',
  '5 * * * *',
  'select public.skupi_hourly_job()'
);

-- ============================================================
-- EMAIL TRIGGER: send confirmation email after payment succeeds
-- Calls our /api/emails/payment-confirmed route via pg_net
-- ============================================================
create or replace function public.on_payment_confirmed()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only fire when status changes TO 'confirmed'
  if OLD.status != 'confirmed' and NEW.status = 'confirmed' then
    perform net.http_post(
      url := current_setting('app.base_url') || '/api/emails/payment-confirmed',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', current_setting('app.cron_secret')
      ),
      body := jsonb_build_object('payment_id', NEW.id::text)
    );
  end if;

  -- Notify owner when event is full
  if OLD.status != 'confirmed' and NEW.status = 'confirmed' then
    perform public.check_event_full(NEW.event_id);
  end if;

  return NEW;
end;
$$;

create trigger payment_confirmed_trigger
  after update on public.payments
  for each row
  execute function public.on_payment_confirmed();

-- ============================================================
-- HELPER: check if event just became full → notify owner
-- ============================================================
create or replace function public.check_event_full(p_event_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_event   record;
  v_paid    integer;
begin
  select e.*, o.email as owner_email, o.ime as owner_ime
  into v_event
  from public.events e
  join public.owners o on o.id = e.owner_id
  where e.id = p_event_id;

  select count(*) into v_paid
  from public.payments
  where event_id = p_event_id and status = 'confirmed';

  if v_paid >= v_event.max_sudionika then
    perform net.http_post(
      url := current_setting('app.base_url') || '/api/emails/event-full',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', current_setting('app.cron_secret')
      ),
      body := jsonb_build_object(
        'event_id', p_event_id::text,
        'owner_email', v_event.owner_email,
        'owner_ime', v_event.owner_ime,
        'event_naziv', v_event.naziv
      )
    );
  end if;
end;
$$;
