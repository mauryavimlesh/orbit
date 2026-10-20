export type DomainCategory =
  | 'Quantum & Physics'
  | 'AI & Computing'
  | 'Biomedicine & Genomics'
  | 'Open-Source & DevTools'
  | 'Clean Tech & Public Service'
  | 'Startups & Policy'
  | 'Space & Astronomy'
  | 'Mathematics'
  | 'Social Sciences'
  | 'Civil & Computer Engineering'
  | 'Materials Science'
  | 'Emerging Technologies';

export type SourceType =
  | 'Peer-Reviewed Journal'
  | 'Preprint (arXiv / bioRxiv)'
  | 'GitHub Repository'
  | 'Official Announcement'
  | 'Patent Filing'
  | 'Community Momentum Signal';

export type EvidenceStatus =
  | 'Peer-Reviewed'
  | 'Preprint / Not Yet Peer-Reviewed'
  | 'Working Open-Source Code'
  | 'Theoretical / Simulation'
  | 'Unverified Social / Trend Claim';

export type DifficultyLevel = 'beginner' | 'mixed' | 'advanced';
export type ExplanationLanguage = 'en' | 'hinglish';

export type ArtworkTheme =
  | 'quantum_twilight'
  | 'geospatial_splatting'
  | 'biotech_bohr'
  | 'sparse_attention'
  | 'clean_energy_grid'
  | 'reverse_engineering'
  | 'crispr_editing'
  | 'scholarly_paper';

export type VisualSandboxId =
  | 'quantum_threshold'
  | 'hemoglobin_bohr'
  | 'sparse_attention'
  | 'repo_pipeline';

export interface MultiSignalVector {
  freshness: string; // e.g., "Published 3d ago"
  evidenceTier: 'High (Empirical / Replicated)' | 'Moderate (Preprint / Primary Code)' | 'Preliminary (Discussion / Early Signal)';
  momentum: string; // e.g., "Rising in arXiv & GitHub"
  novelty: string; // e.g., "Paradigm shift in error threshold"
  learningValue: string; // e.g., "Connects surface codes to fault tolerance"
}

export interface CitationItem {
  id: string;
  label: string;
  authors: string;
  venue: string;
  year: string;
  url: string;
  doiOrId?: string;
  statusLabel: string;
}

export interface ReaderFourteenLayers {
  quickOrientation: string;
  sourceAndStatus: string;
  beginnerExplanation: string;
  beginnerExplanationHinglish: string;
  prerequisites: string[];
  historicalFoundations: string;
  coreMechanism: string[];
  coreMechanismHinglish: string[];
  methodsAndEvidence: string;
  findings: string;
  limitationsAndUncertainty: string;
  applicationsAndImplications: string;
  criticalAnalysisAndFalsifiability: string;
  relatedWork: string[];
  whatToWatchNext: string;
  references: CitationItem[];
}

export interface EquationSpec {
  id: string;
  title: string;
  formula: string;
  variables: Array<{ symbol: string; meaning: string; unit: string }>;
  intuition: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanationWhyRight: string;
  misconceptionDiagnosed: string;
}

export interface GitHubRepoAnalysis {
  fullName: string;
  repoUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  license: string;
  language: string;
  lastReleaseTag: string;
  lastUpdated: string;
  maturityStatus: 'Experimental Prototype' | 'Active Research Tool' | 'Production-Ready';
  whatItDoes: string;
  problemSolved: string;
  internalArchitecture: string[];
  noveltyComparison: string;
  hardwareAndPrerequisites: string[];
  safeSetupSteps: string[];
  securityAndSandboxWarnings: string[];
  alternatives: Array<{ name: string; comparison: string; url: string }>;
  topics?: string[];
  readmeContent?: string;
  readmeRetrieved?: boolean;
  languagesBreakdown?: Record<string, number>;
  ownerLogin?: string;
  defaultBranch?: string;
  pushedAt?: string;
}

export interface DiscoveryItem {
  id: string;
  canonicalId: string; // DOI, arXiv ID, or GitHub owner/repo
  title: string;
  shortSubtitle: string;
  oneSentenceWhyItMatters: string;
  domain: DomainCategory;
  sourceName: string;
  sourceType: SourceType;
  evidenceStatus: EvidenceStatus;
  publishedAt: string;
  retrievedAt: string;
  sourceUrl: string;
  authors: string[];
  artworkTheme: ArtworkTheme;
  visualSandboxId: VisualSandboxId;
  signals: MultiSignalVector;
  readerLayers: ReaderFourteenLayers;
  equations: EquationSpec[];
  quiz: QuizQuestion[];
  repoAnalysis?: GitHubRepoAnalysis;
  isLiveFetched?: boolean;
  fullTextAvailable?: boolean;
  fullTextUrl?: string;
  highStakesMedicalNotice?: boolean;
  relatedRepoQuery?: string;
}

export type HighlightColor = 'emerald' | 'amber' | 'sky' | 'purple' | 'rose';

export interface PaperAnnotation {
  id: string;
  discoveryId: string;
  text: string;
  color: HighlightColor;
  note?: string;
  sectionId?: string;
  createdAt: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
}

export interface StructuredNote {
  id: string;
  discoveryId: string;
  discoveryTitle: string;
  sourceUrl: string;
  status: 'draft_preview' | 'approved_saved';
  language: ExplanationLanguage;
  executiveSummary: string;
  whyItMatters: string;
  prerequisites: string[];
  coreConceptsAndDefinitions: Array<{ term: string; definition: string }>;
  mechanismSteps: string[];
  workedExamples?: string;
  methodsAndEvidence: string;
  equations: EquationSpec[];
  limitationsAndCritique: string;
  examRevisionSheet: string[];
  userPersonalAnnotations: string;
  tags: string[];
  flashcards: FlashcardItem[];
  citations: CitationItem[];
  createdAt: string;
  approvedAt?: string;
  updatedAt: string;
}

export interface MasteryRecord {
  discoveryId: string;
  topicTitle: string;
  domain: DomainCategory;
  progressPercent: number; // 0 - 100
  masteryEstimate: number; // 0 - 100 based on quiz evidence + recency
  quizAttempts: number;
  lastQuizScore: number;
  lastStudiedAt: string;
  nextReviewDueAt: string;
  weakConcepts: string[];
}

export interface KnowledgeEdge {
  id: string;
  fromTitle: string;
  toTitle: string;
  relationship:
    | 'Prerequisite For'
    | 'Extends Mechanism'
    | 'Empirical Counter-Evidence'
    | 'Open-Source Implementation'
    | 'Shared Mathematical Tool'
    | 'Empirical Validation';
  whyConnected: string;
  sourceCitation: string;
}

export interface WatchUpdateDiff {
  id: string;
  checkedAt: string;
  whatIsNew: string;
  whatChangedFromBaseline: string;
  sourceAndDate: string;
  whyItMatters: string;
  impactOnPriorUnderstanding: 'Strengthens prior evidence' | 'Adds technical detail' | 'Introduces caveat / conflict';
  remainingUncertainty: string;
  recommendedNextAction: string;
  sourceUrl: string;
}

export interface WatchlistItem {
  id: string;
  targetType: 'Topic / Field' | 'Research Paper' | 'GitHub Repository' | 'Researcher / Lab';
  targetQuery: string;
  displayTitle: string;
  sourcesMonitored: string[];
  importanceThreshold: 'All Updates' | 'Meaningful Changes Only' | 'Major Breakthroughs Only';
  cadence: 'Manual Check' | 'Daily Briefing' | 'Weekly Digest';
  active: boolean;
  lastCheckedAt: string;
  lastStatus: 'Nominal' | 'Update Detected' | 'Rate Limited';
  updates: WatchUpdateDiff[];
}

export interface QuotaStatus {
  dateKey: string;
  aiRequestsUsed: number;
  dailyFreeLimit: number;
  runtimeModel: string;
  paidFallbackEnabled: false; // Strictly false by design
  geminiConfigured: boolean;
  sqlitePersistenceActive: boolean;
  telegramConfigured: boolean;
}

export type StudyModelTier = 'fast' | 'general' | 'complex';

export type StudyChatRolePersona =
  | 'concept_tutor'
  | 'socratic_coach'
  | 'methodology_critic';

export interface StudyChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
  modelUsed?: string;
  rolePersona?: StudyChatRolePersona;
  attachedPassage?: string;
}

export type ProfessorInferredMode = 'ASK' | 'EXPLAIN' | 'DO';

export type ProfessorActionType =
  | 'define_term'
  | 'explain_selection'
  | 'simplify_selection'
  | 'explain_paper'
  | 'create_notes'
  | 'ask_question';

export interface ProfessorContextPayload {
  actionType?: ProfessorActionType;
  targetTerm?: string;
  routeSection: 'discover' | 'repositories' | 'library' | 'notes';
  librarySubTab?: string;
  isReaderModalOpen: boolean;
  readerMode?: 'reader' | 'explain' | 'notes';
  readingProgressPercent?: number;
  selectedText?: string;
  language: ExplanationLanguage;
  difficulty: DifficultyLevel;
  activePaper?: {
    id: string;
    canonicalId: string;
    title: string;
    authors: string[];
    sourceName: string;
    publishedAt: string;
    evidenceStatus: string;
    fullTextAvailable: boolean;
    sourceUrl: string;
    quickOrientation: string;
    coreMechanism: string[];
    methodsAndEvidence: string;
    findings: string;
    limitations: string;
    equations: Array<{ title: string; formula: string; intuition: string }>;
  } | null;
  comparisonPaper?: {
    id: string;
    title: string;
    sourceName: string;
    publishedAt: string;
    evidenceStatus: string;
    quickOrientation: string;
    coreMechanism: string[];
    limitations: string;
  } | null;
  activeNote?: {
    id: string;
    discoveryId: string;
    discoveryTitle: string;
    status: string;
    executiveSummary: string;
    whyItMatters: string;
    mechanismSteps: string[];
    methodsAndEvidence: string;
    limitationsAndCritique: string;
    examRevisionSheet: string[];
    userPersonalAnnotations: string;
  } | null;
}

export interface ProfessorProposedChange {
  id: string;
  changeType: 'create_note' | 'update_note' | 'save_bookmark' | 'remove_bookmark';
  title: string;
  summary: string;
  targetNoteId?: string;
  targetPaperId?: string;
  targetField?:
    | 'executiveSummary'
    | 'whyItMatters'
    | 'methodsAndEvidence'
    | 'limitationsAndCritique'
    | 'userPersonalAnnotations'
    | 'examRevisionSheet'
    | 'full_note';
  previousValue?: string;
  proposedValue?: string;
  proposedNoteDraft?: Partial<StructuredNote>;
  status: 'pending_approval' | 'approved' | 'rejected' | 'undone';
}

export interface ProfessorToolExecution {
  id: string;
  toolName:
    | 'search_research_sources'
    | 'retrieve_paper_context'
    | 'propose_study_note_draft'
    | 'propose_note_section_edit'
    | 'generate_revision_questions'
    | 'analyze_structured_table_or_data'
    | 'manage_library_bookmark'
    | 'unsupported_or_external_capability';
  status: 'completed' | 'requires_approval' | 'failed' | 'unsupported';
  summary: string;
  inputArgs?: Record<string, any>;
  outputData?: any;
  errorMessage?: string;
  proposedChange?: ProfessorProposedChange;
}

export interface ProfessorAgentMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
  actionType?: ProfessorActionType;
  targetTerm?: string;
  inferredMode?: ProfessorInferredMode;
  modelUsed?: string;
  contextSnapshotLabel?: string;
  selectedPassage?: string;
  citations?: Array<{ label: string; url: string; status: string }>;
  comparisonTable?: {
    headers: string[];
    rows: string[][];
  };
  equations?: Array<{ title: string; formula: string; explanation: string }>;
  revisionQuestions?: Array<{
    question: string;
    answer: string;
    conceptTested: string;
  }>;
  relatedPapers?: DiscoveryItem[];
  toolExecutions?: ProfessorToolExecution[];
}


