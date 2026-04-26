-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PetSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('WALKING', 'DAYCARE', 'BOARDING', 'TRAINING', 'GROOMING', 'PET_SITTING', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HealthRecordType" AS ENUM ('VACCINATION', 'VET_VISIT', 'TREATMENT', 'MEDICATION', 'ALLERGY', 'SURGERY', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'IN_APP', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "city" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "sex" "PetSex" NOT NULL,
    "description" TEXT,
    "isSterilized" BOOLEAN NOT NULL DEFAULT false,
    "isVaccinated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetImage" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "type" "ServiceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "location" TEXT NOT NULL,
    "availabilityNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "type" "HealthRecordType" NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "nextDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPreference" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "preferredBreed" TEXT,
    "preferredSex" "PetSex",
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "preferredLocation" TEXT,
    "healthRequirements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_role_idx" ON "UserProfile"("role");

-- CreateIndex
CREATE INDEX "UserProfile_city_idx" ON "UserProfile"("city");

-- CreateIndex
CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");

-- CreateIndex
CREATE INDEX "Pet_species_idx" ON "Pet"("species");

-- CreateIndex
CREATE INDEX "Pet_breed_idx" ON "Pet"("breed");

-- CreateIndex
CREATE INDEX "PetImage_petId_idx" ON "PetImage"("petId");

-- CreateIndex
CREATE INDEX "Service_providerId_idx" ON "Service"("providerId");

-- CreateIndex
CREATE INDEX "Service_type_idx" ON "Service"("type");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "Service_location_idx" ON "Service"("location");

-- CreateIndex
CREATE INDEX "Booking_petId_idx" ON "Booking"("petId");

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- CreateIndex
CREATE INDEX "Booking_ownerId_idx" ON "Booking"("ownerId");

-- CreateIndex
CREATE INDEX "Booking_providerId_idx" ON "Booking"("providerId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_bookingDate_idx" ON "Booking"("bookingDate");

-- CreateIndex
CREATE INDEX "Booking_providerId_bookingDate_idx" ON "Booking"("providerId", "bookingDate");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_serviceId_idx" ON "Review"("serviceId");

-- CreateIndex
CREATE INDEX "Review_providerId_idx" ON "Review"("providerId");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "HealthRecord_petId_idx" ON "HealthRecord"("petId");

-- CreateIndex
CREATE INDEX "HealthRecord_type_idx" ON "HealthRecord"("type");

-- CreateIndex
CREATE INDEX "HealthRecord_recordDate_idx" ON "HealthRecord"("recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPreference_petId_key" ON "MatchPreference"("petId");

-- CreateIndex
CREATE INDEX "MatchPreference_preferredBreed_idx" ON "MatchPreference"("preferredBreed");

-- CreateIndex
CREATE INDEX "MatchPreference_preferredLocation_idx" ON "MatchPreference"("preferredLocation");

-- CreateIndex
CREATE INDEX "NotificationLog_recipientId_idx" ON "NotificationLog"("recipientId");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetImage" ADD CONSTRAINT "PetImage_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPreference" ADD CONSTRAINT "MatchPreference_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "UserProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
