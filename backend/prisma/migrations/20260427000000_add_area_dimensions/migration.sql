-- AlterTable
ALTER TABLE "Material" ADD COLUMN "width_cm" DOUBLE PRECISION,
                        ADD COLUMN "height_cm" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PurseMaterial" ADD COLUMN "width_cm" DOUBLE PRECISION,
                             ADD COLUMN "height_cm" DOUBLE PRECISION;
