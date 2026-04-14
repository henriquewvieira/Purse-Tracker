-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price_per_unit" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "notes" TEXT,
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurseType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    CONSTRAINT "PurseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurseMaterial" (
    "id" SERIAL NOT NULL,
    "purse_type_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "PurseMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "hourly_rate" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "password_hash" TEXT NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionRecord" (
    "id" SERIAL NOT NULL,
    "purse_type_id" INTEGER NOT NULL,
    "date_produced" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sale_price_per_unit" DOUBLE PRECISION,
    "labor_minutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_costs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "material_overrides" TEXT NOT NULL DEFAULT '{}',
    "computed_total_cost" DOUBLE PRECISION NOT NULL,
    "computed_cost_per_unit" DOUBLE PRECISION NOT NULL,
    "computed_revenue" DOUBLE PRECISION NOT NULL,
    "computed_profit" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    CONSTRAINT "ProductionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionRecord_date_produced_idx" ON "ProductionRecord"("date_produced");

-- AddForeignKey
ALTER TABLE "PurseMaterial" ADD CONSTRAINT "PurseMaterial_purse_type_id_fkey" FOREIGN KEY ("purse_type_id") REFERENCES "PurseType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurseMaterial" ADD CONSTRAINT "PurseMaterial_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionRecord" ADD CONSTRAINT "ProductionRecord_purse_type_id_fkey" FOREIGN KEY ("purse_type_id") REFERENCES "PurseType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
