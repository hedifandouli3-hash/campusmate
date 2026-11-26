-- ============================================================================
-- CampusMate V2 Enhancements Migration
-- Adds session revocation counter, server-side encrypted chat metadata,
-- read receipts, multi-CV support, and durable app snapshot storage fallback.
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_version INT NOT NULL DEFAULT 1;

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS encryption_version TEXT DEFAULT 'cmv1-aead';

CREATE TABLE IF NOT EXISTS chat_read_cursors (
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE chat_read_cursors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_read_cursors_owner" ON chat_read_cursors FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Multi-CV enhancement: support multiple saved CVs per student + customization metadata
ALTER TABLE cv_profiles DROP CONSTRAINT IF EXISTS cv_profiles_student_id_key;
ALTER TABLE cv_profiles ADD COLUMN IF NOT EXISTS cv_title TEXT NOT NULL DEFAULT 'CV Principal';
ALTER TABLE cv_profiles ADD COLUMN IF NOT EXISTS template_key TEXT NOT NULL DEFAULT 'modern';
ALTER TABLE cv_profiles ADD COLUMN IF NOT EXISTS settings_json JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE cv_profiles ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT TRUE;

-- Durable tenant-isolated state store table for seamless transactional sync
CREATE TABLE IF NOT EXISTS campusmate_state_snapshots (
  snapshot_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campusmate_state_snapshots ENABLE ROW LEVEL SECURITY;
-- Restricted strictly to service_role (zero public/authenticated direct access)
