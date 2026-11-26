-- ============================================================================
-- CampusMate Row Level Security (RLS) Policies
-- Enforces strict tenant isolation (institution_id) & role-based permissions.
-- ============================================================================

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_user_institution()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT institution_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin' AND NOT is_suspended);
$$;

-- Enable RLS across core tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Institutions: readable by authenticated users, writable by super_admin
CREATE POLICY "institutions_read" ON institutions FOR SELECT TO authenticated USING (is_active = TRUE OR is_super_admin());
CREATE POLICY "institutions_admin" ON institutions FOR ALL TO authenticated USING (is_super_admin());

-- Profiles: users read own profile, same-institution limited directory, super_admin reads all
-- Never allow self-escalation of role!
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_super_admin() OR (institution_id = current_user_institution() AND current_user_role() IN ('university_admin', 'teacher')));
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Tenant-scoped academic structure
CREATE POLICY "departments_tenant_read" ON departments FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "departments_admin_write" ON departments FOR ALL TO authenticated USING (is_super_admin() OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin'));

CREATE POLICY "sections_tenant_read" ON academic_sections FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "subjects_tenant_read" ON subjects FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());

-- Enrollments (private reference visible only to owner or institution admin)
CREATE POLICY "enrollments_select" ON student_enrollments FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR is_super_admin() OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin'));

-- Course documents: teachers see their own + drafts; students ONLY see published non-teacher-only docs in their institution
CREATE POLICY "course_docs_select" ON course_documents FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (institution_id = current_user_institution() AND uploaded_by = auth.uid())
    OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin')
    OR (institution_id = current_user_institution() AND is_published = TRUE AND is_teacher_only = FALSE)
  );

CREATE POLICY "course_docs_teacher_write" ON course_documents FOR ALL TO authenticated
  USING (institution_id = current_user_institution() AND current_user_role() IN ('teacher', 'university_admin') AND (uploaded_by = auth.uid() OR current_user_role() = 'university_admin'));

-- Personal documents & AI conversations: strictly owner-only
CREATE POLICY "personal_docs_owner" ON personal_documents FOR ALL TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "ai_conversations_owner" ON ai_conversations FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ai_messages_owner" ON ai_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Knowledge documents: published readable by same institution
CREATE POLICY "knowledge_docs_read" ON knowledge_documents FOR SELECT TO authenticated
  USING ((institution_id = current_user_institution() AND is_published = TRUE) OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin') OR is_super_admin());
CREATE POLICY "knowledge_docs_write" ON knowledge_documents FOR ALL TO authenticated
  USING ((institution_id = current_user_institution() AND current_user_role() = 'university_admin') OR is_super_admin());

-- Document chunks: enforce scope before retrieval
CREATE POLICY "chunks_select" ON document_chunks FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (source_scope = 'personal' AND owner_id = auth.uid())
    OR (institution_id = current_user_institution() AND source_scope = 'knowledge' AND EXISTS (SELECT 1 FROM knowledge_documents k WHERE k.id = knowledge_document_id AND k.is_published = TRUE))
    OR (institution_id = current_user_institution() AND source_scope = 'course' AND EXISTS (SELECT 1 FROM course_documents d WHERE d.id = course_document_id AND d.is_published = TRUE AND d.is_teacher_only = FALSE))
  );

-- Administrative document requests: student owns their requests, institution admin manages institution requests
CREATE POLICY "doc_requests_select" ON document_requests FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin') OR is_super_admin());
CREATE POLICY "doc_requests_insert" ON document_requests FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND institution_id = current_user_institution());
CREATE POLICY "doc_requests_admin_update" ON document_requests FOR UPDATE TO authenticated
  USING (institution_id = current_user_institution() AND current_user_role() = 'university_admin');

-- Queues & tickets
CREATE POLICY "queues_read" ON queues FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "tickets_select" ON queue_tickets FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin'));

-- Chat groups & messages: membership-gated with explicit outer table qualification!
CREATE POLICY "chat_groups_member" ON chat_groups FOR SELECT TO authenticated
  USING (is_super_admin() OR (institution_id = current_user_institution() AND EXISTS (SELECT 1 FROM chat_group_members m WHERE m.group_id = chat_groups.id AND m.user_id = auth.uid())));
CREATE POLICY "chat_group_members_read" ON chat_group_members FOR SELECT TO authenticated
  USING (is_super_admin() OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM chat_group_members m WHERE m.group_id = chat_group_members.group_id AND m.user_id = auth.uid()));
CREATE POLICY "chat_messages_member_select" ON chat_messages FOR SELECT TO authenticated
  USING (institution_id = current_user_institution() AND EXISTS (SELECT 1 FROM chat_group_members m WHERE m.group_id = chat_messages.group_id AND m.user_id = auth.uid()));
CREATE POLICY "chat_messages_member_insert" ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND institution_id = current_user_institution() AND EXISTS (SELECT 1 FROM chat_group_members m WHERE m.group_id = chat_messages.group_id AND m.user_id = auth.uid()));
CREATE POLICY "chat_messages_owner_update" ON chat_messages FOR UPDATE TO authenticated
  USING (institution_id = current_user_institution() AND (sender_id = auth.uid() OR current_user_role() IN ('university_admin', 'super_admin')));

-- Notifications: owner-only
CREATE POLICY "notifications_owner" ON notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- Feedback reports: confidential reports hidden from non-admins!
CREATE POLICY "feedback_select" ON feedback_reports FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR is_super_admin()
    OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin')
    OR (institution_id = current_user_institution() AND is_confidential = FALSE)
  );
CREATE POLICY "feedback_insert" ON feedback_reports FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND institution_id = current_user_institution());
CREATE POLICY "feedback_admin_update" ON feedback_reports FOR UPDATE TO authenticated
  USING (is_super_admin() OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin'));

-- Internships & Applications: verified orgs publish; org members see ONLY applications to their own org's offers
CREATE POLICY "orgs_read" ON organizations FOR SELECT TO authenticated
  USING (verification_status = 'verified' OR is_super_admin() OR EXISTS (SELECT 1 FROM organization_members m WHERE m.organization_id = organizations.id AND m.user_id = auth.uid()));
CREATE POLICY "orgs_owner_update" ON organizations FOR UPDATE TO authenticated
  USING (is_super_admin() OR EXISTS (SELECT 1 FROM organization_members m WHERE m.organization_id = organizations.id AND m.user_id = auth.uid()));
CREATE POLICY "offers_read" ON internship_offers FOR SELECT TO authenticated
  USING (
    (status = 'published' AND EXISTS (SELECT 1 FROM organizations o WHERE o.id = internship_offers.organization_id AND o.verification_status = 'verified'))
    OR EXISTS (SELECT 1 FROM organization_members m WHERE m.organization_id = internship_offers.organization_id AND m.user_id = auth.uid())
    OR is_super_admin()
  );
CREATE POLICY "offers_org_write" ON internship_offers FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM organization_members m
      JOIN organizations o ON o.id = m.organization_id
      WHERE m.organization_id = internship_offers.organization_id
        AND m.user_id = auth.uid()
        AND (internship_offers.status <> 'published' OR o.verification_status = 'verified')
    )
  );
CREATE POLICY "applications_select" ON internship_applications FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR is_super_admin()
    OR EXISTS (
      SELECT 1 FROM internship_offers io
      JOIN organization_members om ON om.organization_id = io.organization_id
      WHERE io.id = internship_applications.offer_id AND om.user_id = auth.uid()
    )
  );
CREATE POLICY "applications_student_insert" ON internship_applications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND institution_id = current_user_institution());

-- Remaining academic, community, room, event, CV & queue tables (explicit tenant & owner isolation)
CREATE POLICY "specializations_read" ON specializations FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "academic_years_read" ON academic_years FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "teacher_assignments_read" ON teacher_assignments FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin') OR is_super_admin());
CREATE POLICY "courses_read" ON courses FOR SELECT TO authenticated
  USING (is_super_admin() OR (institution_id = current_user_institution() AND (is_published = TRUE OR teacher_id = auth.uid() OR current_user_role() = 'university_admin')));
CREATE POLICY "announcements_read" ON announcements FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "marketplace_tenant_read" ON marketplace_listings FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "marketplace_owner_write" ON marketplace_listings FOR ALL TO authenticated
  USING (seller_id = auth.uid() OR is_super_admin() OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin'))
  WITH CHECK (seller_id = auth.uid() AND institution_id = current_user_institution());
CREATE POLICY "lost_found_tenant_read" ON lost_found_reports FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "rooms_tenant_read" ON rooms FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "room_reservations_read" ON room_reservations FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR is_super_admin() OR (institution_id = current_user_institution() AND (status = 'confirmed' OR current_user_role() = 'university_admin')));
CREATE POLICY "events_tenant_read" ON events FOR SELECT TO authenticated USING (institution_id = current_user_institution() OR is_super_admin());
CREATE POLICY "event_regs_owner" ON event_registrations FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_super_admin() OR (current_user_role() = 'university_admin'));
CREATE POLICY "cv_profiles_owner" ON cv_profiles FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_super_admin())
  WITH CHECK (student_id = auth.uid());

-- Audit logs: super_admin and institution-scoped university_admin read only
CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT TO authenticated
  USING (is_super_admin() OR (institution_id = current_user_institution() AND current_user_role() = 'university_admin'));
