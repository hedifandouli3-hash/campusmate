-- ============================================================================
-- CampusMate Supabase Storage Buckets (Private by default)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-materials', 'course-materials', FALSE, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain']),
  ('personal-study-docs', 'personal-study-docs', FALSE, 15728640, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('knowledge-base', 'knowledge-base', FALSE, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('admin-documents', 'admin-documents', FALSE, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('community-media', 'community-media', FALSE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users access files only via authenticated signed URLs or strict path ownership
CREATE POLICY "personal_docs_storage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'personal-study-docs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'personal-study-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "course_materials_storage_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'course-materials');
