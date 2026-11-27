export type UserRole =
  | "student"
  | "teacher"
  | "university_admin"
  | "organization"
  | "super_admin";

export type Locale = "fr" | "en" | "ar";

export interface Institution {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  website?: string;
  isDemo: boolean;
  isActive: boolean;
}

export interface Department {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  description?: string;
}

export interface Specialization {
  id: string;
  institutionId: string;
  departmentId: string;
  code: string;
  name: string;
}

export interface AcademicYear {
  id: string;
  institutionId: string;
  levelNumber: number;
  label: string;
  academicTerm: string;
  isCurrent: boolean;
}

export interface AcademicSection {
  id: string;
  institutionId: string;
  departmentId: string;
  specializationId?: string;
  academicYearId: string;
  code: string;
  name: string;
}

export interface Subject {
  id: string;
  institutionId: string;
  departmentId: string;
  specializationId?: string;
  academicYearId?: string;
  code: string;
  name: string;
  semester: 1 | 2;
  credits: number;
  description?: string;
}

export interface UserProfile {
  id: string;
  institutionId: string | null;
  institutionName?: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  preferredLanguage: Locale;
  isVerified: boolean;
  isSuspended: boolean;
  isAdult: boolean;
  bio?: string;
  interests: string[];
  skills: string[];
  // Student academic info (never expose enrollmentReference publicly)
  departmentId?: string;
  departmentName?: string;
  specializationId?: string;
  specializationName?: string;
  academicYearId?: string;
  academicYearLabel?: string;
  sectionId?: string;
  sectionName?: string;
  enrollmentReference?: string;
  // Teacher info
  assignedSubjectIds?: string[];
  assignedSectionIds?: string[];
  // Organization info
  organizationId?: string;
  organizationName?: string;
  isDemoAccount?: boolean;
  sessionVersion?: number;
}

export type DocProcessingStatus = "uploaded" | "processing" | "ready" | "failed";
export type DocKind = "lecture" | "exercise" | "correction" | "exam_sample" | "syllabus";

export interface Course {
  id: string;
  institutionId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  sectionId: string;
  sectionName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  semester: 1 | 2;
  isPublished: boolean;
  createdAt: string;
}

export interface CourseDocument {
  id: string;
  institutionId: string;
  courseId: string;
  subjectId: string;
  subjectName: string;
  sectionId: string;
  sectionName: string;
  uploadedBy: string;
  uploaderName: string;
  title: string;
  description: string;
  docKind: DocKind;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  isPublished: boolean;
  isTeacherOnly: boolean;
  processingStatus: DocProcessingStatus;
  processingError?: string;
  pageCount: number;
  extractedText: string;
  createdAt: string;
}

export interface DocumentChunk {
  id: string;
  institutionId: string;
  sourceScope: "course" | "personal" | "knowledge";
  documentId: string;
  documentTitle: string;
  ownerId?: string;
  subjectId?: string;
  sectionId?: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  embedding?: number[];
}

export interface AICitation {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  excerpt: string;
  sourceScope: "course" | "personal" | "knowledge";
}

export interface AISuggestedAction {
  label: string;
  href: string;
}

export interface QuizQuestion {
  id: string;
  questionType: "mcq" | "true_false" | "short_answer";
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  institutionId: string;
  subjectId: string;
  subjectName: string;
  courseDocumentId?: string;
  createdBy: string;
  title: string;
  isPublished: boolean;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  maxScore: number;
  weakTopics: string[];
  createdAt: string;
}

export interface Flashcard {
  id: string;
  institutionId: string;
  courseDocumentId?: string;
  subjectId: string;
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface KnowledgeDocument {
  id: string;
  institutionId: string;
  uploadedBy: string;
  title: string;
  category: string;
  fileName: string;
  contentText: string;
  isPublished: boolean;
  isDemoSample: boolean;
  processingStatus: DocProcessingStatus;
  createdAt: string;
}

export type DocRequestStatus =
  | "submitted"
  | "under_review"
  | "additional_info_required"
  | "approved"
  | "rejected"
  | "ready_for_collection"
  | "available_for_download";

export interface DocumentRequest {
  id: string;
  institutionId: string;
  studentId: string;
  studentName: string;
  requestTypeCode: string;
  requestTypeName: string;
  referenceNumber: string;
  purpose: string;
  academicYearLabel: string;
  status: DocRequestStatus;
  adminComment?: string;
  approvedDocumentTitle?: string;
  approvedDocumentContent?: string;
  isDemoSample: boolean;
  createdAt: string;
  updatedAt: string;
  history: Array<{
    status: DocRequestStatus;
    comment?: string;
    actorName: string;
    createdAt: string;
  }>;
}

export interface QueueService {
  id: string;
  institutionId: string;
  name: string;
  location: string;
  description: string;
  avgServiceMinutes: number;
  isOpen: boolean;
  currentTicketNumber: number;
  lastIssuedNumber: number;
}

export interface QueueTicket {
  id: string;
  institutionId: string;
  queueId: string;
  serviceName: string;
  studentId: string;
  studentName: string;
  ticketNumber: number;
  ticketCode: string;
  status: "waiting" | "called" | "completed" | "missed" | "cancelled";
  joinedAt: string;
}

export interface TimetableEntry {
  id: string;
  institutionId: string;
  sectionId: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  roomName: string;
  dayOfWeek: number; // 1=Mon .. 6=Sat
  startTime: string;
  endTime: string;
  sessionType: "Cours" | "TD" | "TP";
}

export interface ExamItem {
  id: string;
  institutionId: string;
  sectionId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  examDate: string;
  startTime: string;
  roomName: string;
  examType: string;
}

export interface StudySession {
  id: string;
  planId: string;
  studentId: string;
  subjectId?: string;
  subjectName: string;
  topic: string;
  sessionDate: string;
  durationMinutes: number;
  sessionKind: "revision" | "quiz" | "review" | "break";
  priority: "high" | "medium" | "low";
  isCompleted: boolean;
}

export interface StudyPlan {
  id: string;
  institutionId: string;
  studentId: string;
  title: string;
  dailyHours: number;
  preferredPeriod: string;
  isDemoFallback: boolean;
  createdAt: string;
  sessions: StudySession[];
}

export interface ChatGroup {
  id: string;
  institutionId: string;
  name: string;
  groupType: "year" | "department" | "section" | "subject";
  academicYearId?: string;
  departmentId?: string;
  sectionId?: string;
  subjectId?: string;
  memberIds: string[];
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  institutionId: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  replyToId?: string;
  content: string;
  attachmentName?: string;
  attachmentMime?: string;
  attachmentSizeBytes?: number;
  isPinned: boolean;
  isAnnouncement: boolean;
  isDeleted: boolean;
  editedAt?: string;
  encryptionVersion?: "cmv1-aead" | "plaintext";
  createdAt: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  institutionId: string;
  title: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    citations?: AICitation[];
    suggestedActions?: AISuggestedAction[];
    isDemoFallback?: boolean;
    createdAt: string;
  }>;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  institutionId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  sectionId?: string;
  subjectId?: string;
  title: string;
  body: string;
  isOfficial: boolean;
  isPinned: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  institutionId: string;
  userId: string;
  category: string;
  title: string;
  body: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MarketplaceListing {
  id: string;
  institutionId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: "textbooks" | "calculators" | "study_materials" | "electronics" | "supplies" | "other_approved";
  priceTnd: number;
  condition: string;
  imageUrl?: string;
  status: "available" | "sold" | "removed";
  favoriteUserIds: string[];
  createdAt: string;
}

export interface TransportInfo {
  id: string;
  institutionId: string;
  title: string;
  transportType: "shuttle" | "bus" | "train" | "announcement";
  routeSummary: string;
  scheduleSummary: string;
  isDemoSample: boolean;
}

export interface ApprovedCarpoolOffer {
  id: string;
  institutionId: string;
  driverId: string;
  driverName: string;
  departureArea: string;
  destinationArea: string;
  departureWindow: string;
  availableSeats: number;
  isInstitutionApproved: boolean;
  adultsOnly: boolean;
  isDemoSample: boolean;
}

export interface LostFoundReport {
  id: string;
  institutionId: string;
  reporterId: string;
  reporterName: string;
  reportType: "lost" | "found";
  itemName: string;
  category: string;
  description: string;
  generalLocation: string;
  eventDate: string;
  imageUrl?: string;
  status: "open" | "claim_pending" | "recovered";
  createdAt: string;
}

export interface CampusRoom {
  id: string;
  institutionId: string;
  building: string;
  name: string;
  roomType: "classroom" | "lab" | "study_room" | "amphitheater";
  capacity: number;
  openingHours: string;
  isReservable: boolean;
  schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string; label: string }>;
}

export interface RoomReservation {
  id: string;
  institutionId: string;
  roomId: string;
  roomName: string;
  requesterId: string;
  requesterName: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
  createdAt: string;
}

export interface FeedbackReport {
  id: string;
  institutionId: string;
  authorId: string;
  authorName: string;
  category: "suggestion" | "complaint" | "facility" | "academic" | "administrative" | "improvement";
  title: string;
  description: string;
  isConfidential: boolean;
  aiTheme?: string;
  status: "submitted" | "under_review" | "in_progress" | "resolved" | "closed";
  responses: Array<{ responderName: string; message: string; createdAt: string }>;
  createdAt: string;
}

export interface CampusEvent {
  id: string;
  institutionId: string;
  organizerId: string;
  organizerName: string;
  title: string;
  category: "hackathon" | "workshop" | "conference" | "club" | "cultural" | "sports" | "competition" | "professional" | "training";
  description: string;
  location: string;
  eventDate: string;
  capacity: number;
  registeredUserIds: string[];
  savedUserIds: string[];
  isPublished: boolean;
}

export interface Organization {
  id: string;
  name: string;
  orgType: "company" | "startup" | "association" | "research" | "other";
  sector: string;
  city: string;
  website?: string;
  contactEmail: string;
  description: string;
  verificationStatus: "pending" | "verified" | "rejected";
  registrationNumber?: string;
  createdAt: string;
}

export interface InternshipOffer {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  internshipType: "initiation" | "perfectionnement" | "pfe" | "summer" | "research";
  requiredSkills: string[];
  requiredLevel: string;
  relevantDepartments: string[];
  location: string;
  workMode: "onsite" | "hybrid" | "remote";
  duration: string;
  deadline: string;
  positionsCount: number;
  compensation?: string;
  instructions?: string;
  status: "draft" | "published" | "closed";
  createdAt: string;
}

export interface InternshipApplication {
  id: string;
  offerId: string;
  offerTitle: string;
  organizationId: string;
  organizationName: string;
  studentId: string;
  studentName: string;
  institutionId: string;
  cvHeadline: string;
  cvSkills: string[];
  motivationLetter: string;
  status: "submitted" | "under_review" | "interview_requested" | "accepted" | "rejected" | "withdrawn";
  organizationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CVProfile {
  id?: string;
  studentId: string;
  title?: string;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  photoDataUrl?: string;
  headline: string;
  summary: string;
  template: "classic" | "modern" | "ats" | "technical" | "academic" | "minimal";
  accentColor?: string;
  fontStyle?: "sans" | "serif" | "mono";
  language?: Locale;
  isDefault?: boolean;
  tailoredOfferId?: string;
  sectionOrder?: string[];
  hiddenSections?: string[];
  education: Array<{ school: string; degree: string; period: string; details?: string }>;
  experience: Array<{ role: string; company: string; period: string; details: string }>;
  internships?: Array<{ role: string; organization: string; period: string; details: string }>;
  projects: Array<{ name: string; stack: string; description: string; link?: string }>;
  certifications: Array<{ name: string; issuer: string; year: string }>;
  awards?: Array<{ title: string; issuer: string; year: string }>;
  volunteer?: Array<{ role: string; organization: string; period: string; details: string }>;
  skills: string[];
  softSkills?: string[];
  languages: string[];
  updatedAt?: string;
}

export interface ContentReport {
  id: string;
  institutionId: string;
  reporterId: string;
  reporterName: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: "open" | "reviewed" | "dismissed" | "action_taken";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  institutionId?: string;
  actorId?: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: string;
  createdAt: string;
}
