import { Injectable, signal, computed, inject } from '@angular/core';
import { GroundedApiService } from './grounded-api.service';
import { ChatMessage, ChatSession, AskResponse, HealthStatus, EvidenceItem } from '../models/grounded.models';

export type PipelineStage = 'idle' | 'risk_check' | 'retrieval' | 'synthesis' | 'validation' | 'complete' | 'error';

@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  private api = inject(GroundedApiService);

  // Core Reactive Signals
  readonly sessions = signal<ChatSession[]>([]);
  readonly activeSessionId = signal<string>('default-session');
  readonly isTemporaryMode = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly currentStage = signal<PipelineStage>('idle');
  readonly stageDetails = signal<string>('');
  readonly selectedEvidence = signal<EvidenceItem | null>(null);
  readonly healthStatus = signal<HealthStatus | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Active messages signal
  readonly activeMessages = signal<ChatMessage[]>([]);

  // Computed current session
  readonly currentSession = computed(() => {
    const id = this.activeSessionId();
    return this.sessions().find(s => s.id === id) || null;
  });

  constructor() {
    this.initDefaultState();
    this.refreshHealth();
  }

  private initDefaultState() {
    const initialSession: ChatSession = {
      id: 'default-session',
      title: 'USPSTF Skin Cancer Counseling',
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemporary: false,
      messages: [
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: 'Welcome to Grounded — Evidence-Bound Clinical Decision Support assistant strictly bounded to the USPSTF 2018 Skin Cancer Prevention Counseling Guideline. How can I assist you with clinical recommendations today?',
          timestamp: new Date()
        }
      ]
    };

    this.sessions.set([initialSession]);
    this.activeMessages.set(initialSession.messages);
  }

  refreshHealth() {
    this.api.getHealth().subscribe({
      next: (status) => this.healthStatus.set(status),
      error: () => this.healthStatus.set({
        status: 'degraded',
        framework: '.NET 9.0 (ASP.NET Core)',
        index_loaded: true,
        chunk_count: 28,
        llm_mode: 'csharp-grounded-rag'
      })
    });
  }

  selectSession(sessionId: string) {
    const session = this.sessions().find(s => s.id === sessionId);
    if (session) {
      this.activeSessionId.set(sessionId);
      this.activeMessages.set([...session.messages]);
      this.isTemporaryMode.set(session.isTemporary);
    }
  }

  createNewSession(title: string = 'New Clinical Consultation', isTemporary: boolean = false) {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: isTemporary ? '🕵️ Incognito Consultation' : title,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemporary,
      messages: [
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: isTemporary 
            ? '🕵️ **Temporary Incognito Mode Active**: This session will not be saved to history or persisted.'
            : 'New clinical consultation started. Ask questions regarding USPSTF skin cancer prevention counseling guidelines.',
          timestamp: new Date()
        }
      ]
    };

    if (!isTemporary) {
      this.sessions.update(list => [newSession, ...list]);
    }
    
    this.activeSessionId.set(newId);
    this.activeMessages.set(newSession.messages);
    this.isTemporaryMode.set(isTemporary);
  }

  deleteSession(sessionId: string) {
    this.sessions.update(list => list.filter(s => s.id !== sessionId));
    if (this.activeSessionId() === sessionId) {
      const remaining = this.sessions();
      if (remaining.length > 0) {
        this.selectSession(remaining[0].id);
      } else {
        this.createNewSession();
      }
    }
  }

  toggleTemporaryMode() {
    const current = this.isTemporaryMode();
    this.createNewSession('Incognito Consultation', !current);
  }

  openEvidenceDrawer(evidence: EvidenceItem) {
    this.selectedEvidence.set(evidence);
  }

  closeEvidenceDrawer() {
    this.selectedEvidence.set(null);
  }

  sendMessage(question: string) {
    const clean = question.trim();
    if (!clean || this.isLoading()) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: clean,
      timestamp: new Date()
    };

    // Append user message immediately
    this.activeMessages.update(msgs => [...msgs, userMsg]);
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Simulate animated pipeline stages
    this.currentStage.set('risk_check');
    this.stageDetails.set('Evaluating query safety guardrails & clinical boundaries...');

    setTimeout(() => {
      if (this.isLoading()) {
        this.currentStage.set('retrieval');
        this.stageDetails.set('Retrieving semantic USPSTF guideline chunks from vector store...');
      }
    }, 400);

    setTimeout(() => {
      if (this.isLoading()) {
        this.currentStage.set('synthesis');
        this.stageDetails.set('Synthesizing grounded recommendation with citation claims...');
      }
    }, 800);

    setTimeout(() => {
      if (this.isLoading()) {
        this.currentStage.set('validation');
        this.stageDetails.set('Verifying citation veracity & applying threshold gate...');
      }
    }, 1200);

    this.api.askQuestion(clean, this.activeSessionId(), this.isTemporaryMode()).subscribe({
      next: (response: AskResponse) => {
        this.currentStage.set('complete');
        this.isLoading.set(false);

        const assistantMsg: ChatMessage = {
          id: 'resp-' + Date.now(),
          role: 'assistant',
          content: response.recommendation,
          timestamp: new Date(),
          response
        };

        this.activeMessages.update(msgs => [...msgs, assistantMsg]);

        // Sync with session if not temporary
        if (!this.isTemporaryMode()) {
          const currentId = this.activeSessionId();
          this.sessions.update(list =>
            list.map(s => {
              if (s.id === currentId) {
                const newTitle = s.messages.length <= 1 ? (clean.length > 35 ? clean.slice(0, 35) + '...' : clean) : s.title;
                return {
                  ...s,
                  title: newTitle,
                  updatedAt: new Date(),
                  messages: [...this.activeMessages()]
                };
              }
              return s;
            })
          );
        }

        setTimeout(() => this.currentStage.set('idle'), 2500);
      },
      error: (err) => {
        console.error('Error querying Grounded API:', err);
        this.currentStage.set('error');
        this.isLoading.set(false);
        this.errorMessage.set('Could not communicate with the .NET Backend. Please ensure Grounded.Api is running on http://localhost:5000.');

        const errorAssistantMsg: ChatMessage = {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: '⚠️ Unable to connect to the Grounded .NET API service. Please verify that the backend server is running.',
          timestamp: new Date()
        };

        this.activeMessages.update(msgs => [...msgs, errorAssistantMsg]);
        setTimeout(() => this.currentStage.set('idle'), 4000);
      }
    });
  }
}
