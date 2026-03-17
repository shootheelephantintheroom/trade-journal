-- ============================================================
-- Switch from auto-trial to opt-in freemium model
-- New signups get trial_ends_at = NULL (no trial by default).
-- Users explicitly start a trial from Account Settings.
-- Existing users with an active trial are unaffected.
-- ============================================================

-- 1. Make trial_ends_at nullable with NULL default
ALTER TABLE public.profiles ALTER COLUMN trial_ends_at DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN trial_ends_at SET DEFAULT NULL;

-- 2. Clear trial_ends_at for free users whose trial already expired
--    (so they show as "Free" plan, not "trial ended")
--    Users with active trials or paid subscriptions are untouched.
UPDATE public.profiles
SET trial_ends_at = NULL
WHERE plan = 'free'
  AND subscription_status = 'none'
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at < now();
