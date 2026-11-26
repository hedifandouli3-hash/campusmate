-- ============================================================================
-- CampusMate Demonstration Seed Data — ISET Béja (Fictional Demo Dataset)
-- Note: Marked as is_demo = TRUE. Do not present as real official records.
-- ============================================================================

INSERT INTO institutions (id, code, name, city, country, website, is_demo, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'ISET-BEJA', 'ISET Béja (Démo)', 'Béja', 'Tunisia', 'https://isetb.rnu.tn', TRUE, TRUE),
  ('11111111-1111-1111-1111-111111111102', 'ISET-TUNIS', 'ISET Rades (Démo Multi-Campus)', 'Radès', 'Tunisia', 'https://isetr.rnu.tn', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (id, institution_id, code, name, description)
VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'TI', 'Technologies de l''Informatique', 'Développement logiciel, réseaux, systèmes et IA appliquée'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'GE', 'Génie Électrique', 'Automatique, électronique industrielle et énergies'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'GM', 'Génie Mécanique', 'Conception mécanique et fabrication assistée')
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO specializations (id, institution_id, department_id, code, name)
VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'DSI', 'Développement des Systèmes d''Information'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'RSI', 'Réseaux et Systèmes Informatiques')
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO academic_years (id, institution_id, level_number, label, academic_term, is_current)
VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 1, '1ère Année Licence', '2026-2027', TRUE),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111101', 2, '2ème Année Licence', '2026-2027', TRUE),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111101', 3, '3ème Année Licence', '2026-2027', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO academic_sections (id, institution_id, department_id, specialization_id, academic_year_id, code, name)
VALUES
  ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444402', 'TI2-DSI-A', '2ème Année DSI — Groupe A'),
  ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444402', 'TI2-RSI-A', '2ème Année RSI — Groupe A')
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO document_request_types (id, institution_id, code, name_fr, name_en, name_ar, description, requires_attachment)
VALUES
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111101', 'ATTEST_INSCR', 'Attestation d''inscription', 'Enrollment Certificate', 'شهادة تسجيل', 'Document confirmant votre inscription académique actuelle (spécimen démo).', FALSE),
  ('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111101', 'CERT_SCOL', 'Certificat de scolarité', 'Schooling Certificate', 'شهادة مدرسية', 'Certificat requis pour les dossiers administratifs et bourses.', FALSE),
  ('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111101', 'ATTEST_PRES', 'Attestation de présence', 'Attendance Certificate', 'شهادة حضور', 'Attestation de présence aux cours et examens.', FALSE),
  ('66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111101', 'RELEVE_NOTES', 'Relevé de notes', 'Academic Transcript', 'كشف أعداد', 'Relevé officiel des notes du semestre.', TRUE),
  ('66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111101', 'ATTEST_REUSS', 'Attestation de réussite', 'Success Certificate', 'شهادة نجاح', 'Attestation de réussite annuelle ou de fin de cycle.', FALSE)
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO administrative_services (id, institution_id, name, location, description, avg_service_minutes)
VALUES
  ('77777777-7777-7777-7777-777777777701', '11111111-1111-1111-1111-111111111101', 'Scolarité & Attestations', 'Bloc Administration — Guichet 1', 'Délivrance des attestations, relevés de notes et inscriptions.', 6),
  ('77777777-7777-7777-7777-777777777702', '11111111-1111-1111-1111-111111111101', 'Cellule des Stages (PFE & Initiation)', 'Bloc Administration — Bureau 4', 'Conventions de stage, validation et suivi des entreprises.', 10),
  ('77777777-7777-7777-7777-777777777703', '11111111-1111-1111-1111-111111111101', 'Bourses & Affaires Estudiantines', 'Bloc Administration — Guichet 2', 'Dossiers OOU, bourses universitaires et transport.', 8)
ON CONFLICT DO NOTHING;

INSERT INTO queues (id, institution_id, service_id, is_open, current_ticket_number, last_issued_number)
VALUES
  ('88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777701', TRUE, 12, 15),
  ('88888888-8888-8888-8888-888888888802', '11111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777702', TRUE, 4, 6),
  ('88888888-8888-8888-8888-888888888803', '11111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777703', TRUE, 7, 8)
ON CONFLICT DO NOTHING;
