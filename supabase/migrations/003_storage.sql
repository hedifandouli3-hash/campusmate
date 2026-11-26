-- ============================================================================
-- CampusMate Supabase Storage Buckets (Private by default — zero public buckets)
-- Files are served strictly via authorized, short-lived server signed URLs
-- after RBAC + tenant + ownership checks.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-materials', 'course-materials', FALSE, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain']),
  ('personal-study-docs', 'personal-study-docs', FALSE, 15728640, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('knowledge-base', 'knowledge-base', FALSE, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('admin-documents', 'admin-documents', FALSE, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('community-media', 'community-media', FALSE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('cv-documents', 'cv-documents', FALSE, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Remove overly permissive V1 storage policy if present
DROP POLICY IF EXISTS "course_materials_storage_read" ON storage.objects;

-- Storage RLS: users access only their own prefixed personal study docs or CV exports;
-- all cross-user course/admin/chat/knowledge objects are mediated via server RBAC signed URLs.
DROP POLICY IF EXISTS "personal_docs_storage" ON storage.objects;
CREATE POLICY "personal_docs_storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'personal-study-docs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'personal-study-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "cv_docs_owner_storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'cv-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'cv-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "course_materials_teacher_owner_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'course-materials'
    AND (storage.foldername(name))[1] = (SELECT institution_id::text FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'university_admin')
  );
