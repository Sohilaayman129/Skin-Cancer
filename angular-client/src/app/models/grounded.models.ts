export interface Citation {
  document: string;
  section: string;
  page: number;
  chunk_id: string;
}

export interface EvidenceItem {
  claim: string;
  citation: Citation;
  passage?: string;
}

export interface RetrievedChunk {
  document: string;
  section: string;
  page: number;
  chunk_id: string;
  score: number;
  text: string;
}

export interface ValidationInfo {
  citations_verified: number;
  invented_citations: string[];
}

export interface AskResponse {
  status: 'Answered' | 'Safety Refusal' | 'Insufficient Evidence' | string;
  recommendation: string;
  supporting_evidence: EvidenceItem[];
  confidence: 'High' | 'Moderate' | 'Low' | 'N/A' | string;
  missing_information: string;
  safety_note: string;
  risk_tier: 'Allowed' | 'Needs Caution' | 'Refuse/Redirect' | string;
  decision_path: string;
  retrieved_chunks: RetrievedChunk[];
  weak_threshold: number;
  top_score: number;
  mode: string;
  validation: ValidationInfo;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  response?: AskResponse;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  isTemporary: boolean;
  messages: ChatMessage[];
}

export interface HealthStatus {
  status: string;
  framework: string;
  index_loaded: boolean;
  chunk_count: number;
  llm_mode: string;
  python_rag_available?: boolean;
}

export interface SampleQuestion {
  category: string;
  text: string;
  tag: string;
}
