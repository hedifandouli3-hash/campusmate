-- ============================================================================
-- CampusMate V3 Migration — Launchpad (Knowledge-to-Opportunity & Entrepreneurship)
-- All tables enforce institution_id, ownership, and strict Row Level Security.
-- ============================================================================

CREATE TABLE IF NOT EXISTS launchpad_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'data', 'design', 'business', 'engineering', 'communication')),
  subject_name TEXT NOT NULL,
  source_course_id TEXT,
  source_document_title TEXT NOT NULL,
  evidence_summary TEXT NOT NULL,
  practical_applications JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('studied', 'practiced', 'self_confirmed', 'demonstrated')),
  proficiency INT NOT NULL DEFAULT 50 CHECK (proficiency BETWEEN 0 AND 100),
  next_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_skills_student ON launchpad_skills(institution_id, student_id);

CREATE TABLE IF NOT EXISTS launchpad_startup_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('knowledge', 'course', 'custom')),
  source_course_title TEXT,
  name TEXT NOT NULL,
  short_pitch TEXT NOT NULL,
  payload JSONB NOT NULL,
  saved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_startups_student ON launchpad_startup_ideas(institution_id, student_id);

CREATE TABLE IF NOT EXISTS launchpad_freelance_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_title TEXT NOT NULL,
  payload JSONB NOT NULL,
  saved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_freelance_student ON launchpad_freelance_ideas(institution_id, student_id);

CREATE TABLE IF NOT EXISTS launchpad_business_canvases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_idea_id UUID REFERENCES launchpad_startup_ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  shared_with_team_id UUID,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_canvases_student ON launchpad_business_canvases(institution_id, student_id);

CREATE TABLE IF NOT EXISTS launchpad_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_projects_owner ON launchpad_projects(institution_id, owner_id);

CREATE TABLE IF NOT EXISTS launchpad_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES launchpad_projects(id) ON DELETE SET NULL,
  startup_idea_id UUID REFERENCES launchpad_startup_ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  horizon TEXT NOT NULL CHECK (horizon IN ('7d', '14d', '30d', '90d', 'custom')),
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_roadmaps_student ON launchpad_roadmaps(institution_id, student_id);

CREATE TABLE IF NOT EXISTS launchpad_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  join_requests JSONB NOT NULL DEFAULT '[]'::jsonb,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  chat_group_id UUID REFERENCES chat_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_teams_inst ON launchpad_teams(institution_id);

CREATE TABLE IF NOT EXISTS launchpad_portfolios (
  student_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT 'engineering' CHECK (template IN ('minimal', 'engineering', 'product')),
  is_public_shared BOOLEAN NOT NULL DEFAULT FALSE,
  share_token TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS launchpad_mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('teacher', 'university_admin', 'organization')),
  kind TEXT NOT NULL CHECK (kind IN ('challenge', 'mentorship', 'incubator', 'funding_info', 'course_application')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_discipline TEXT NOT NULL,
  eligibility_note TEXT NOT NULL,
  is_demo_sample BOOLEAN NOT NULL DEFAULT FALSE,
  applicants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_mentorships_inst ON launchpad_mentorships(institution_id);

CREATE TABLE IF NOT EXISTS launchpad_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_or_project_title TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en', 'ar')),
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_launchpad_pitches_student ON launchpad_pitches(institution_id, student_id);

-- Row Level Security
ALTER TABLE launchpad_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_startup_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_freelance_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_business_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE launchpad_pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "launchpad_skills_owner" ON launchpad_skills FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "launchpad_startups_owner" ON launchpad_startup_ideas FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "launchpad_freelance_owner" ON launchpad_freelance_ideas FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "launchpad_canvases_owner" ON launchpad_business_canvases FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "launchpad_projects_owner" ON launchpad_projects FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "launchpad_roadmaps_owner" ON launchpad_roadmaps FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "launchpad_portfolios_owner" ON launchpad_portfolios FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "launchpad_pitches_owner" ON launchpad_pitches FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "launchpad_teams_institution_read" ON launchpad_teams FOR SELECT TO authenticated
  USING (institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "launchpad_teams_leader_write" ON launchpad_teams FOR ALL TO authenticated
  USING (leader_id = auth.uid()) WITH CHECK (leader_id = auth.uid());

CREATE POLICY "launchpad_mentorships_institution_read" ON launchpad_mentorships FOR SELECT TO authenticated
  USING (institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()));
