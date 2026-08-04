-- CreateTable
CREATE TABLE "achievements" (
    "achievement_id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'SILVER',
    "icon" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL DEFAULT 1,
    "achieved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("achievement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievements_telegram_user_id_code_key" ON "achievements"("telegram_user_id", "code");

-- CreateIndex
CREATE INDEX "achievements_telegram_user_id_achieved_at_idx" ON "achievements"("telegram_user_id", "achieved_at");

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
