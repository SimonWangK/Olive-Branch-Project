/*
  Warnings:

  - You are about to drop the column `balance_due` on the `CaseFinancial` table. All the data in the column will be lost.
  - You are about to alter the column `field` on the `CaseHistory` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - You are about to alter the column `status` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to alter the column `kind` on the `InvoiceLine` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - You are about to alter the column `method` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - A unique constraint covering the columns `[number]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `CaseFinancial` DROP COLUMN `balance_due`;

-- AlterTable
ALTER TABLE `CaseHistory` MODIFY `field` ENUM('STATUS', 'DESCRIPTION', 'JURISDICTION', 'TARGET_CLOSE', 'BUDGET') NOT NULL;

-- AlterTable
ALTER TABLE `Invoice` MODIFY `status` ENUM('DRAFT', 'SENT', 'PART_PAID', 'PAID', 'VOID') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `InvoiceLine` MODIFY `kind` ENUM('TIME', 'EXPENSE', 'FEE') NOT NULL;

-- AlterTable
ALTER TABLE `Payment` MODIFY `method` ENUM('CASH', 'BANK', 'CARD', 'OTHER') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Invoice_number_key` ON `Invoice`(`number`);
