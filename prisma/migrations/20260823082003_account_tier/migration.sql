-- CreateEnum
CREATE TYPE "AccountTier" AS ENUM ('FREE', 'SILVER', 'GOLD');

-- DropIndex
DROP INDEX "Question_searchText_trgm_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tier" "AccountTier" NOT NULL DEFAULT 'FREE';
