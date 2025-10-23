/*
  Warnings:

  - A unique constraint covering the columns `[case_num]` on the table `Case` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Case` ADD COLUMN `case_num` VARCHAR(191) NOT NULL DEFAULT 'TEMP_CASE_NUM';

-- CreateIndex
CREATE UNIQUE INDEX `Case_case_num_key` ON `Case`(`case_num`);
