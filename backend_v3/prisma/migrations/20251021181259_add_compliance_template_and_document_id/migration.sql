/*
  Warnings:

  - A unique constraint covering the columns `[document_id]` on the table `ComplianceItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[compliance_item_id]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ComplianceItem` ADD COLUMN `document_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `Document` ADD COLUMN `compliance_item_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `CompliancePackTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `case_type` VARCHAR(191) NOT NULL,
    `jurisdiction` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `mandatory` BOOLEAN NOT NULL DEFAULT true,
    `due_days` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CompliancePackTemplate_case_type_jurisdiction_title_key`(`case_type`, `jurisdiction`, `title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ComplianceItem_document_id_key` ON `ComplianceItem`(`document_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Document_compliance_item_id_key` ON `Document`(`compliance_item_id`);

-- AddForeignKey
ALTER TABLE `ComplianceItem` ADD CONSTRAINT `ComplianceItem_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
