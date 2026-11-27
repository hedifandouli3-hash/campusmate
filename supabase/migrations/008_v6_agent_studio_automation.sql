-- ============================================================================
-- CampusMate V6 Migration — Agentic AI, Creation Studio, Projects & Automations
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_student ON agent_conversations(institution_id, student_id);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'running', 'waiting_approval', 'completed', 'partially_completed', 'failed', 'cancelled')),
  tool_executions JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_answer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  description TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS creation_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('website', 'portfolio_site', 'presentation', 'document', 'brand_kit', 'social_post')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  project_id UUID,
  version INT NOT NULL DEFAULT 1,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creation_artifacts_owner ON creation_artifacts(institution_id, owner_id);

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  trigger_type TEXT NOT NULL,
  schedule_label TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Tunis',
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  runs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'pfe', 'startup', 'portfolio', 'personal')),
  description TEXT NOT NULL DEFAULT '',
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE creation_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_conv_owner" ON agent_conversations FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "agent_runs_owner" ON agent_runs FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "agent_approvals_owner" ON agent_approvals FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "creation_artifacts_owner" ON creation_artifacts FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "automations_owner" ON automations FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "workspace_projects_owner" ON workspace_projects FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
