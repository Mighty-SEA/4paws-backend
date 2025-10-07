-- AlterTable
ALTER TABLE `mixusage` ADD COLUMN `examinationId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `MixUsage` ADD CONSTRAINT `MixUsage_examinationId_fkey` FOREIGN KEY (`examinationId`) REFERENCES `Examination`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
