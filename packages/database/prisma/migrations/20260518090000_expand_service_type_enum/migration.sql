-- Expand ServiceType enum with new standardized categories.
-- Safe migration: only adds values, does not modify or remove existing ones.
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'VETERINARY';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'ONLINE_STORE';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'SPA';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'PET_TAXI';
