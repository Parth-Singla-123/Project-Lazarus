-- 001_init_supabase.sql
-- Creates projects, scripts, and healing_events tables for Project Lazarus

-- 1. Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Scripts table
CREATE TABLE IF NOT EXISTS scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Healing events table
CREATE TABLE IF NOT EXISTS healing_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    target_description TEXT NOT NULL,
    old_selector TEXT NOT NULL,
    new_selector TEXT,
    screenshot_base64 TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'HEALED', 'FAILED')),
    error_stack_trace TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE healing_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'healing_events'
          AND policyname = 'Allow public read healing events'
    ) THEN
        CREATE POLICY "Allow public read healing events"
        ON healing_events
        FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'healing_events'
          AND policyname = 'Allow public insert healing events'
    ) THEN
        CREATE POLICY "Allow public insert healing events"
        ON healing_events
        FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;

-- 4. Publication note: enabling realtime is a Supabase project-level action.
-- ALTER PUBLICATION supabase_realtime ADD TABLE healing_events;

-- 5. Dummy data
INSERT INTO projects (id, name, description)
VALUES ('11111111-1111-1111-1111-111111111111', 'E-Commerce QA', 'Automated testing for the frontend store')
ON CONFLICT (id) DO NOTHING;

INSERT INTO scripts (id, project_id, name, file_path)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Checkout Flow', 'tests/checkout.ts')
ON CONFLICT (id) DO NOTHING;
