-- ====================================================================
-- SMARTAUTOREVIEWS / APEX QUANT - SUPABASE DATABASE SCHEMA
-- ====================================================================
-- Execute this script in your Supabase project SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE (NormalUser accounts, lockout states, and verification)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON public.users(locked_until);

-- 2. USER DHAN CREDENTIALS (Dhan Client ID, Access Token, TOTP Secret)
CREATE TABLE IF NOT EXISTS public.user_dhan_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id TEXT,
    access_token TEXT,
    totp_secret TEXT,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_user_dhan UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_dhan_user_id ON public.user_dhan_credentials(user_id);

-- 3. PUBLISHED RECOMMENDATIONS (Official recommendations audited and released)
CREATE TABLE IF NOT EXISTS public.published_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    exchange TEXT NOT NULL DEFAULT 'NSE',
    reco_type TEXT NOT NULL, -- 'BUY' or 'SELL'
    entry_price NUMERIC(12, 2) NOT NULL,
    target_price NUMERIC(12, 2),
    stop_loss NUMERIC(12, 2),
    strategy_name TEXT,
    triggered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'TARGET_HIT', 'STOP_LOSS_HIT', 'CLOSED'
    confidence_score NUMERIC(5, 2),
    meta JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_reco_symbol ON public.published_recommendations(symbol);
CREATE INDEX IF NOT EXISTS idx_reco_status ON public.published_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_reco_triggered_at ON public.published_recommendations(triggered_at DESC);

-- 4. REAL-TIME AUDIT LOGS (Rule audit trail: excluded stocks, risk parameters, trailing SL)
CREATE TABLE IF NOT EXISTS public.reco_rule_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    passed BOOLEAN NOT NULL,
    reason TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    checked_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_rule_audits_symbol ON public.reco_rule_audits(symbol);
CREATE INDEX IF NOT EXISTS idx_rule_audits_checked ON public.reco_rule_audits(checked_at DESC);

-- 5. ADMIN AUDIT TRAIL (Login failures, lockout releases, manual interventions)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    target_email TEXT,
    admin_identifier TEXT DEFAULT 'SuperAdmin',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_audit_logs(created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dhan_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reco_rule_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Service Role Key has full access to manage records
CREATE POLICY "Service Role Full Access Users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service Role Full Access Dhan" ON public.user_dhan_credentials
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service Role Full Access Recos" ON public.published_recommendations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public Read Recommendations" ON public.published_recommendations
    FOR SELECT USING (true);

CREATE POLICY "Service Role Full Access Audits" ON public.reco_rule_audits
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service Role Full Access Admin Logs" ON public.admin_audit_logs
    FOR ALL USING (auth.role() = 'service_role');
