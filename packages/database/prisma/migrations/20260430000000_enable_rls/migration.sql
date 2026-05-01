-- =========================================================
-- Enable Row Level Security on all public tables
-- =========================================================
-- Prisma connects via the `postgres` superuser role which
-- BYPASSES RLS automatically, so this does NOT break any
-- existing functionality.  RLS only applies to direct
-- PostgREST / anon / authenticated Supabase client access.
-- =========================================================

-- Enable RLS
ALTER TABLE "public"."UserProfile"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Pet"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PetImage"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."HealthRecord"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MatchPreference"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Service"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Booking"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Review"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Subscription"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PaymentWebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."NotificationLog"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Veterinary"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Announcement"        ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Policies (authenticated = Supabase JWT users via PostgREST)
-- Wrapped in DO block: only applied when auth schema exists
-- (Supabase production). Skipped cleanly on Prisma shadow DB.
-- =========================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN

    -- UserProfile: each user sees and edits only their own profile
    EXECUTE $p$ CREATE POLICY "userprofile_own" ON "public"."UserProfile"
      FOR ALL TO authenticated
      USING (auth.uid() = "userId") $p$;

    -- Pet: owner manages their own pets
    EXECUTE $p$ CREATE POLICY "pet_own" ON "public"."Pet"
      FOR ALL TO authenticated
      USING (auth.uid() = "ownerId") $p$;

    -- PetImage: owner of the pet manages images
    EXECUTE $p$ CREATE POLICY "petimage_own" ON "public"."PetImage"
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM "public"."Pet"
          WHERE "Pet"."id" = "PetImage"."petId"
            AND "Pet"."ownerId" = auth.uid()
        )
      ) $p$;

    -- HealthRecord: pet owner only
    EXECUTE $p$ CREATE POLICY "healthrecord_own" ON "public"."HealthRecord"
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM "public"."Pet"
          WHERE "Pet"."id" = "HealthRecord"."petId"
            AND "Pet"."ownerId" = auth.uid()
        )
      ) $p$;

    -- MatchPreference: pet owner only
    EXECUTE $p$ CREATE POLICY "matchpreference_own" ON "public"."MatchPreference"
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM "public"."Pet"
          WHERE "Pet"."id" = "MatchPreference"."petId"
            AND "Pet"."ownerId" = auth.uid()
        )
      ) $p$;

    -- Service: anyone can read active services; providers manage their own
    EXECUTE $p$ CREATE POLICY "service_read_active" ON "public"."Service"
      FOR SELECT TO authenticated
      USING ("isActive" = true) $p$;

    EXECUTE $p$ CREATE POLICY "service_provider_manage" ON "public"."Service"
      FOR ALL TO authenticated
      USING (auth.uid() = "providerId") $p$;

    -- Booking: owner or provider can see and manage their own bookings
    EXECUTE $p$ CREATE POLICY "booking_own" ON "public"."Booking"
      FOR ALL TO authenticated
      USING (auth.uid() = "ownerId" OR auth.uid() = "providerId") $p$;

    -- Review: anyone can read; only author manages their review
    EXECUTE $p$ CREATE POLICY "review_read" ON "public"."Review"
      FOR SELECT TO authenticated
      USING (true) $p$;

    EXECUTE $p$ CREATE POLICY "review_manage" ON "public"."Review"
      FOR ALL TO authenticated
      USING (auth.uid() = "authorId") $p$;

    -- Subscription: user manages their own
    EXECUTE $p$ CREATE POLICY "subscription_own" ON "public"."Subscription"
      FOR ALL TO authenticated
      USING (auth.uid() = "userId") $p$;

    -- Payment: user sees their own
    EXECUTE $p$ CREATE POLICY "payment_own" ON "public"."Payment"
      FOR ALL TO authenticated
      USING (auth.uid() = "userId") $p$;

    -- PaymentWebhookEvent: no authenticated access (server-side only via Prisma)

    -- NotificationLog: recipient only
    EXECUTE $p$ CREATE POLICY "notification_own" ON "public"."NotificationLog"
      FOR ALL TO authenticated
      USING (auth.uid() = "recipientId") $p$;

    -- Veterinary: public read for active clinics
    EXECUTE $p$ CREATE POLICY "veterinary_read_active" ON "public"."Veterinary"
      FOR SELECT TO authenticated
      USING ("isActive" = true) $p$;

    -- Announcement: public read for active ones; author manages theirs
    EXECUTE $p$ CREATE POLICY "announcement_read_active" ON "public"."Announcement"
      FOR SELECT TO authenticated
      USING ("isActive" = true) $p$;

    EXECUTE $p$ CREATE POLICY "announcement_manage" ON "public"."Announcement"
      FOR ALL TO authenticated
      USING (auth.uid() = "authorId") $p$;

  END IF;
END $$;
