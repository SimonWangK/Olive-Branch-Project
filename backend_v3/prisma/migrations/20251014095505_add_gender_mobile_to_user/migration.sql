/*
  Warnings:

  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `gender` INTEGER NULL,
    ADD COLUMN `mobile` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NOT NULL;
