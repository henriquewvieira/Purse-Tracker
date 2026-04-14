-- CreateTable
CREATE TABLE "Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price_per_unit" REAL NOT NULL,
    "supplier" TEXT,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "PurseType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT
);

-- CreateTable
CREATE TABLE "PurseMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purse_type_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    CONSTRAINT "PurseMaterial_purse_type_id_fkey" FOREIGN KEY ("purse_type_id") REFERENCES "PurseType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurseMaterial_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "hourly_rate" REAL NOT NULL DEFAULT 15,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "password_hash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProductionRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purse_type_id" INTEGER NOT NULL,
    "date_produced" DATETIME NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sale_price_per_unit" REAL,
    "labor_minutes" REAL NOT NULL DEFAULT 0,
    "other_costs" REAL NOT NULL DEFAULT 0,
    "material_overrides" TEXT NOT NULL DEFAULT '{}',
    "computed_total_cost" REAL NOT NULL,
    "computed_cost_per_unit" REAL NOT NULL,
    "computed_revenue" REAL NOT NULL,
    "computed_profit" REAL NOT NULL,
    "notes" TEXT,
    CONSTRAINT "ProductionRecord_purse_type_id_fkey" FOREIGN KEY ("purse_type_id") REFERENCES "PurseType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProductionRecord_date_produced_idx" ON "ProductionRecord"("date_produced");
