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
  approvalStatus?: "pending" | "approved" | "rejected";
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
  moderationStatus?: "pending" | "approved" | "rejected";
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
  moderationStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface StudentPromotion {
  id: string;
  institutionId: string;
  authorId: string;
  authorName: string;
  category: "resto" | "housing" | "roommate" | "services";
  title: string;
  partnerOrArea: string;
  discountOrPrice: string;
  promoCode?: string;
  description: string;
  contactHint: string;
  validUntil?: string;
  isVerifiedPartner: boolean;
  moderationStatus?: "pending" | "approved" | "rejected";
  savedByUserIds: string[];
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

// ============================================================================
// CampusMate V3 — Launchpad (Knowledge-to-Opportunity & Entrepreneurship Hub)
// ============================================================================

export type LaunchpadSkillStatus = "studied" | "practiced" | "self_confirmed" | "demonstrated";
export type LaunchpadSkillCategory = "technical" | "data" | "design" | "business" | "engineering" | "communication";

export interface LaunchpadSkill {
  id: string;
  institutionId: string;
  studentId: string;
  name: string;
  category: LaunchpadSkillCategory;
  subjectName: string;
  sourceCourseId?: string;
  sourceDocumentTitle: string;
  evidenceSummary: string;
  practicalApplications: string[];
  status: LaunchpadSkillStatus;
  proficiency: number;
  nextSkills: string[];
  createdAt: string;
}

export interface LaunchpadOpportunityPack {
  id: string;
  institutionId: string;
  studentId: string;
  courseDocumentId: string;
  courseTitle: string;
  subjectName: string;
  reasoningSummary: string;
  practicalProjects: Array<{
    title: string;
    summary: string;
    connectionToCourse: string;
    skills: string[];
  }>;
  freelanceIdeas: Array<{
    title: string;
    summary: string;
    connectionToCourse: string;
    targetClients: string;
  }>;
  startupIdeas: Array<{
    title: string;
    pitch: string;
    connectionToCourse: string;
    mvpScope: string;
  }>;
  roadmapSteps: string[];
  isDemoFallback: boolean;
  createdAt: string;
}

export interface LaunchpadFreelanceIdea {
  id: string;
  institutionId: string;
  studentId: string;
  serviceTitle: string;
  description: string;
  relatedSubjects: string[];
  requiredSkills: string[];
  possessedSkills: string[];
  missingSkills: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  targetClients: string[];
  deliverables: string[];
  portfolioProjectIdea: string;
  toolsToLearn: string[];
  nextSteps: string[];
  illustrativeQuoteNote: string;
  prepKit?: {
    serviceDescription?: string;
    proposalTemplate?: string;
    deliveryChecklist?: string[];
    mockInterviewQuestions?: string[];
  };
  saved: boolean;
  createdAt: string;
}

export interface LaunchpadStartupIdea {
  id: string;
  institutionId: string;
  studentId: string;
  mode: "knowledge" | "course" | "custom";
  sourceCourseTitle?: string;
  name: string;
  shortPitch: string;
  problemStatement: string;
  proposedSolution: string;
  targetCustomers: string[];
  academicKnowledgeUsed: string[];
  requiredTechnicalSkills: string[];
  requiredBusinessSkills: string[];
  existingCapabilities: string[];
  missingCapabilities: string[];
  valueProposition: string;
  businessModel: string;
  revenueStreams: string[];
  mvpFeatures: string[];
  technicalRequirements: string[];
  effortEstimate: string;
  resourceRequirements: string[];
  validationPlan: string[];
  risksAndAssumptions: string[];
  suggestedTeam: string[];
  initialRoadmap: string[];
  hypothesisDisclaimer: string;
  feasibility?: {
    overallScore: number;
    factors: Array<{ name: string; score: number; explanation: string }>;
    recommendedNextStep: string;
    methodologyNote: string;
  };
  saved: boolean;
  createdAt: string;
}

export interface LaunchpadBusinessCanvas {
  id: string;
  institutionId: string;
  studentId: string;
  startupIdeaId?: string;
  title: string;
  version: number;
  sharedWithTeamId?: string;
  customerSegments: string;
  valuePropositions: string;
  channels: string;
  customerRelationships: string;
  revenueStreams: string;
  keyResources: string;
  keyActivities: string;
  keyPartnerships: string;
  costStructure: string;
  validatedFacts: string[];
  assumptions: string[];
  updatedAt: string;
  createdAt: string;
}

export interface LaunchpadRoadmapTask {
  id: string;
  title: string;
  phase: "validation" | "design" | "development" | "testing" | "pitch";
  priority: "high" | "medium" | "low";
  dueDate: string;
  completed: boolean;
  notes?: string;
  syncedToPlanner?: boolean;
}

export interface LaunchpadRoadmap {
  id: string;
  institutionId: string;
  studentId: string;
  projectId?: string;
  startupIdeaId?: string;
  title: string;
  horizon: "7d" | "14d" | "30d" | "90d" | "custom";
  objectives: string[];
  requiredSkills: string[];
  mvpScope: string;
  tasks: LaunchpadRoadmapTask[];
  createdAt: string;
  updatedAt: string;
}

export interface LaunchpadProject {
  id: string;
  institutionId: string;
  ownerId: string;
  ownerName: string;
  title: string;
  problemSolved: string;
  subjectName?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  objectives: string[];
  requirements: string[];
  technologies: string[];
  deliverables: string[];
  evaluationCriteria: string[];
  courseReferences: string[];
  skillsDeveloped: string[];
  status: "planning" | "in_progress" | "completed";
  progress: number;
  repoUrl?: string;
  demoUrl?: string;
  reflections?: string;
  attachments: Array<{ id: string; name: string; kind: "document" | "screenshot"; urlOrNote: string }>;
  tasks: Array<{ id: string; title: string; completed: boolean }>;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchpadTeam {
  id: string;
  institutionId: string;
  leaderId: string;
  leaderName: string;
  projectTitle: string;
  description: string;
  requiredRoles: string[];
  requiredSkills: string[];
  members: Array<{ userId: string; fullName: string; role: string; joinedAt: string }>;
  joinRequests: Array<{
    id: string;
    userId: string;
    fullName: string;
    role: string;
    message: string;
    status: "pending" | "accepted" | "rejected";
    createdAt: string;
  }>;
  milestones: Array<{ id: string; title: string; completed: boolean }>;
  chatGroupId?: string;
  announcements: string[];
  createdAt: string;
}

export interface LaunchpadPortfolio {
  studentId: string;
  institutionId: string;
  headline: string;
  bio: string;
  template: "minimal" | "engineering" | "product";
  isPublicShared: boolean;
  shareToken?: string;
  items: Array<{
    id: string;
    projectId?: string;
    title: string;
    description: string;
    problemSolved: string;
    technologies: string[];
    skillsDemonstrated: string[];
    contribution: string;
    repoUrl?: string;
    demoUrl?: string;
    completionDate: string;
    importedToCv?: boolean;
  }>;
  certifications: string[];
  achievements: string[];
  updatedAt: string;
}

export interface LaunchpadMentorshipItem {
  id: string;
  institutionId: string;
  authorId: string;
  authorName: string;
  authorRole: "teacher" | "university_admin" | "organization";
  kind: "challenge" | "mentorship" | "incubator" | "funding_info" | "course_application";
  title: string;
  description: string;
  relatedDiscipline: string;
  eligibilityNote: string;
  isDemoSample: boolean;
  applicants: Array<{
    userId: string;
    fullName: string;
    projectTitle: string;
    message: string;
    feedback?: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface LaunchpadPitch {
  id: string;
  institutionId: string;
  studentId: string;
  startupOrProjectTitle: string;
  locale: Locale;
  elevatorPitch: string;
  pitch30s: string;
  pitch1m: string;
  pitch3m: string;
  executiveSummary: string;
  problemSolution: string;
  valueProposition: string;
  deckOutline: string[];
  juryQuestions: Array<{ question: string; suggestedAnswer: string }>;
  completedVsPlannedNote: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CampusMate V6 — Central AI Agent, Creation Studio, Projects & Automations
// ============================================================================

export type AgentPermissionCategory = "A_read" | "B_create_private" | "C_internal_state" | "D_external_approval";

export interface AgentToolExecution {
  id: string;
  toolName: string;
  category: AgentPermissionCategory;
  status: "completed" | "waiting_approval" | "rejected" | "failed";
  summary: string;
  artifactId?: string;
  error?: string;
  executedAt: string;
}

export interface AgentApprovalRequest {
  id: string;
  runId: string;
  studentId: string;
  institutionId: string;
  toolName: string;
  description: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
}

export interface AgentRun {
  id: string;
  conversationId: string;
  studentId: string;
  institutionId: string;
  goal: string;
  status: "planned" | "running" | "waiting_approval" | "completed" | "partially_completed" | "failed" | "cancelled";
  toolExecutions: AgentToolExecution[];
  finalAnswer: string;
  createdAt: string;
  completedAt?: string;
}

export interface AgentConversation {
  id: string;
  studentId: string;
  institutionId: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    runId?: string;
    createdAt: string;
  }>;
  updatedAt: string;
  createdAt: string;
}

export interface AgentPreferences {
  studentId: string;
  enablePersonalization: boolean;
  preferredLanguage: Locale;
  timezone: string;
  quietHours?: string;
  customContextNote?: string;
  updatedAt: string;
}

export type CreationArtifactType =
  | "website"
  | "portfolio_site"
  | "presentation"
  | "document"
  | "brand_kit"
  | "social_post";

export interface WebsiteSection {
  id: string;
  kind: "hero" | "features" | "about" | "pricing" | "showcase" | "contact";
  heading: string;
  subheading: string;
  items: Array<{ title: string; description: string }>;
}

export interface WebsiteProjectData {
  template: "saas" | "portfolio" | "academic" | "startup" | "event";
  brandName: string;
  primaryColor: string;
  fontFamily: "sans" | "serif" | "mono";
  sections: WebsiteSection[];
  contactPreviewNote: string;
}

export interface PresentationSlide {
  id: string;
  title: string;
  bullets: string[];
  speakerNotes: string;
}

export interface BrandKitData {
  brandName: string;
  slogan: string;
  positioning: string;
  palette: string[];
  typography: string;
  toneOfVoice: string;
}

export interface CreationArtifact {
  id: string;
  institutionId: string;
  ownerId: string;
  type: CreationArtifactType;
  title: string;
  description: string;
  projectId?: string;
  version: number;
  isPrivate: boolean;
  websiteData?: WebsiteProjectData;
  slides?: PresentationSlide[];
  documentMarkdown?: string;
  brandKit?: BrandKitData;
  socialDraft?: {
    platform: "linkedin" | "instagram" | "facebook";
    body: string;
    hashtags: string[];
    plannedDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type AutomationTriggerType =
  | "weekly_schedule"
  | "daily_schedule"
  | "deadline_approaching"
  | "new_course_published"
  | "unread_messages"
  | "new_internship";

export interface AutomationRunLog {
  id: string;
  automationId: string;
  status: "completed" | "failed";
  summary: string;
  executedAt: string;
}

export interface AutomationWorkflow {
  id: string;
  institutionId: string;
  ownerId: string;
  title: string;
  description: string;
  triggerType: AutomationTriggerType;
  scheduleCronOrLabel: string;
  timezone: string;
  conditions: string[];
  actions: string[];
  isActive: boolean;
  lastRunAt?: string;
  runs: AutomationRunLog[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailDraft {
  id: string;
  institutionId: string;
  ownerId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt?: string;
  status: "draft" | "approved_local_pending_provider" | "cancelled";
  createdAt: string;
}

export interface KanbanProjectTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "under_review" | "completed";
  priority: "high" | "medium" | "low";
  dueDate?: string;
  notes?: string;
}

export interface StudentWorkspaceProject {
  id: string;
  institutionId: string;
  ownerId: string;
  title: string;
  category: "academic" | "pfe" | "startup" | "portfolio" | "personal";
  description: string;
  objectives: string[];
  tasks: KanbanProjectTask[];
  progress: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}


// ============================================================================
// CampusMate V8 — Institution-Funded EdTech SaaS, Housing & Sponsorships
// ============================================================================

export type InstitutionalPlanCode = "university_plus" | "university_pro" | "university_ultra";

export type InstitutionLicenseStatus =
  | "requested"
  | "under_review"
  | "quotation_issued"
  | "contract_pending"
  | "active"
  | "renewal_pending"
  | "expired"
  | "suspended";

export interface InstitutionalPlanConfig {
  code: InstitutionalPlanCode;
  name: string;
  tagline: string;
  studentSeatPriceTnd: number;
  professorSeatPriceTnd: number;
  aiMonthlyAllowancePerSeat: number;
  storageLimitGb: number;
  automationLimit: number;
  minContractTnd: number;
  features: string[];
  isActive: boolean;
}

export interface InstitutionLicense {
  id: string;
  institutionId: string;
  planCode: InstitutionalPlanCode;
  status: InstitutionLicenseStatus;
  startDate: string;
  expirationDate: string;
  maxStudentSeats: number;
  maxProfessorSeats: number;
  assignedStudentSeats: number;
  assignedProfessorSeats: number;
  aiMonthlyAllowance: number;
  aiUsedThisPeriod: number;
  storageLimitGb: number;
  storageUsedGb: number;
  annualContractTnd: number;
  sponsorshipsEnabled: boolean;
  isSimulated: boolean;
  notes?: string;
  updatedAt: string;
}

export interface LicenseSeatAllocation {
  id: string;
  licenseId: string;
  institutionId: string;
  userId: string;
  seatType: "student" | "teacher";
  status: "assigned" | "released";
  assignedAt: string;
  releasedAt?: string;
}

export interface InstitutionalQuote {
  id: string;
  institutionName: string;
  institutionType: "public_university" | "private_university" | "iset" | "training_center" | "incubator";
  officialWebsite: string;
  contactName: string;
  contactEmail: string;
  planCode: InstitutionalPlanCode;
  studentSeats: number;
  professorSeats: number;
  onboardingServiceTnd: number;
  discountPercent: number;
  annualTotalTnd: number;
  monthlyEquivalentTnd: number;
  status: "requested" | "under_review" | "quotation_issued" | "approved" | "rejected";
  isSimulated: boolean;
  createdAt: string;
}

export interface InstitutionUsageEvent {
  id: string;
  institutionId: string;
  userId: string;
  feature: string;
  tokensUsed: number;
  estimatedCostUsd: number;
  isActualProviderUsage: boolean;
  createdAt: string;
}

export type CompanyPlanCode = "basic" | "professional" | "enterprise";

export interface CompanySubscription {
  id: string;
  organizationId: string;
  organizationName: string;
  planCode: CompanyPlanCode;
  annualPriceTnd: number;
  maxActiveInternships: number;
  status: "active" | "pending" | "expired";
  isSimulated: boolean;
  createdAt: string;
}

export interface HousingProvider {
  id: string;
  userId?: string;
  name: string;
  contactEmail: string;
  verificationStatus: "pending" | "verified" | "rejected";
  planCode: "single_listing" | "pro_annual";
  planPriceTnd: number;
  isSimulated: boolean;
  createdAt: string;
}

export type HousingCategory = "residence" | "studio" | "apartment" | "room" | "shared" | "university_info";

export interface HousingListing {
  id: string;
  providerId: string;
  providerName: string;
  institutionId: string;
  title: string;
  description: string;
  category: HousingCategory;
  generalLocation: string;
  monthlyRentTnd: number;
  distanceKm: number;
  available: boolean;
  amenities: string[];
  leaseDuration: string;
  includedExpenses: string;
  photos: string[];
  isVerifiedProvider: boolean;
  isSponsored: boolean;
  moderationStatus: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface EducationalPartner {
  id: string;
  userId?: string;
  name: string;
  website: string;
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: string;
}

export interface SponsorshipCampaign {
  id: string;
  partnerId: string;
  partnerName: string;
  institutionId?: string | null;
  title: string;
  description: string;
  category: string;
  certificationInfo: string;
  destinationUrl: string;
  startDate: string;
  endDate: string;
  status: "draft" | "pending_review" | "approved" | "rejected";
  impressions: number;
  clicks: number;
  annualPackageTnd: number;
  isSimulated: boolean;
  createdAt: string;
}


// ============================================================================
// CampusMate V9 — AI-Powered University Super-App (Social Feed, Clubs & Connect)
// ============================================================================

export type SocialPostType =
  | "post"
  | "question"
  | "announcement"
  | "project_showcase"
  | "club_update";

export interface SocialComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  institutionId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  postType: SocialPostType;
  title?: string;
  content: string;
  sourceUrl?: string;
  sourceAttribution?: string;
  relatedHref?: string;
  isPinned: boolean;
  likesUserIds: string[];
  bookmarkedUserIds: string[];
  comments: SocialComment[];
  moderationStatus: "approved" | "pending" | "removed";
  createdAt: string;
  updatedAt: string;
}

export interface ClubProfile {
  id: string;
  institutionId: string;
  name: string;
  category: string;
  description: string;
  contactEmail: string;
  isVerified: boolean;
  memberIds: string[];
  upcomingActivity: string;
  createdAt: string;
}

export interface ExternalSourceConnection {
  id: string;
  institutionId: string;
  name: string;
  sourceType: "official_website" | "facebook_page" | "public_feed" | "club_page";
  sourceUrl: string;
  connectionStatus: "active" | "manual_import_only" | "pending_authorization";
  lastSyncedAt?: string;
  lastSummary: string;
}
