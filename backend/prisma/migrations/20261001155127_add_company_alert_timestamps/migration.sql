-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "license_alert_sent_at" TIMESTAMP(3),
ADD COLUMN     "usage_alert_sent_at" TIMESTAMP(3);
