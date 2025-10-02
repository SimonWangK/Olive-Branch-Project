/*
  Warnings:

  - You are about to alter the column `field` on the `CaseHistory` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `CaseHistory` MODIFY `field` VARCHAR(191) NOT NULL;
