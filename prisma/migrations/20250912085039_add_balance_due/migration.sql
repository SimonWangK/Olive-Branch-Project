/*
  Warnings:

  - Added the required column `balance_due` to the `CaseFinancial` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CaseFinancial` ADD COLUMN `balance_due` INTEGER NOT NULL;
