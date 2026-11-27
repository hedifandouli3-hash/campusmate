-- ============================================================================
-- CampusMate V5 Migration — Persistent Knowledge Sources, Hybrid RAG & Sync Jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  knowledge_scope TEXT NOT NULL CHECK (
    knowledge_scope IN (
      'official_university',
      'teacher_course',
      'personal_student',
      'approved_admin',
      'entrepreneurship',
      'isolated_demo'
    )
  ),
  source_url TEXT NOT NULL,
  canonical_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'html',
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'presentation',
  source_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    source_status IN (
      'discovered', 'fetched', 'extracted', 'pending_review',
      'approved', 'indexed', 'historical', 'suspicious',
      'rejected', 'superseded', 'failed'
    )
  ),
  authority_level TEXT NOT NULL DEFAULT 'official',
  published_at TIMESTAMPTZ,
  effective_from DATE,
  effective_until DATE,
  academic_year TEXT,
  last_fetched_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  content_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_inst_scope
  ON knowledge_sources(institution_id, knowledge_scope, source_status);

CREATE TABLE IF NOT EXISTS knowledge_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'isetb_website_sync',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  discovered_count INT NOT NULL DEFAULT 0,
  processed_count INT NOT NULL DEFAULT 0,
  indexed_count INT NOT NULL DEFAULT 0,
  rejected_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  failure_count INT NOT NULL DEFAULT 0,
  safe_error_summary TEXT
);

ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_sources_admin_manage" ON knowledge_sources FOR ALL TO authenticated
  USING (
    institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('university_admin', 'super_admin')
  );

CREATE POLICY "knowledge_sources_approved_read" ON knowledge_sources FOR SELECT TO authenticated
  USING (
    institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND source_status IN ('approved', 'indexed')
  );

CREATE POLICY "knowledge_sync_jobs_admin" ON knowledge_sync_jobs FOR ALL TO authenticated
  USING (
    institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('university_admin', 'super_admin')
  );
