-- AlterTable
ALTER TABLE "news_articles" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Institucional';

-- CreateIndex
CREATE INDEX "news_articles_category_idx" ON "news_articles"("category");
