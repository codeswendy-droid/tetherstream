CREATE TABLE "telegram_auth_nonces" (
    "nonce" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_auth_nonces_pkey" PRIMARY KEY ("nonce")
);

CREATE INDEX "telegram_auth_nonces_expires_at_idx" ON "telegram_auth_nonces"("expires_at");

CREATE TABLE "telegram_web_auth_sessions" (
    "session_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "data" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_web_auth_sessions_pkey" PRIMARY KEY ("session_code")
);

CREATE INDEX "telegram_web_auth_sessions_expires_at_idx" ON "telegram_web_auth_sessions"("expires_at");
CREATE INDEX "telegram_web_auth_sessions_status_expires_at_idx" ON "telegram_web_auth_sessions"("status", "expires_at");
