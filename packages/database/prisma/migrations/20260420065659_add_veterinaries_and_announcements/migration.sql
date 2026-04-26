-- CreateEnum
CREATE TYPE "VeterinarySpecialty" AS ENUM ('GENERAL', 'SURGERY', 'DERMATOLOGY', 'CARDIOLOGY', 'OPHTHALMOLOGY', 'NEUROLOGY', 'ONCOLOGY', 'DENTISTRY', 'NUTRITION', 'EXOTIC_PETS', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('LOST_PET', 'FOUND_PET', 'ADOPTION', 'ADVERTISING', 'GENERAL');

-- CreateTable
CREATE TABLE "Veterinary" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "specialties" "VeterinarySpecialty"[] DEFAULT ARRAY['GENERAL']::"VeterinarySpecialty"[],
    "imageUrl" TEXT,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "operatingHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veterinary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "type" "AnnouncementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "location" TEXT,
    "city" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "petId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Veterinary_city_idx" ON "Veterinary"("city");

-- CreateIndex
CREATE INDEX "Veterinary_isPartner_idx" ON "Veterinary"("isPartner");

-- CreateIndex
CREATE INDEX "Veterinary_isActive_idx" ON "Veterinary"("isActive");

-- CreateIndex
CREATE INDEX "Announcement_authorId_idx" ON "Announcement"("authorId");

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");

-- CreateIndex
CREATE INDEX "Announcement_city_idx" ON "Announcement"("city");

-- CreateIndex
CREATE INDEX "Announcement_isActive_idx" ON "Announcement"("isActive");

-- CreateIndex
CREATE INDEX "Announcement_expiresAt_idx" ON "Announcement"("expiresAt");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
