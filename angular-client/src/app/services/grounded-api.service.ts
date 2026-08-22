import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { AskResponse, HealthStatus, SampleQuestion, ChatSession } from '../models/grounded.models';

@Injectable({
  providedIn: 'root'
})
export class GroundedApiService {
  private http = inject(HttpClient);
  
  // Configurable base API URL: checks window/localStorage, then port 4200 local, else relative /api
  private getInitialBaseUrl(): string {
    const custom = (window as any)?.__GROUNDED_API_URL__ || localStorage.getItem('grounded_api_url');
    if (custom) return custom;
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      return 'http://localhost:5000/api';
    }
    return '/api';
  }

  private baseUrl = this.getInitialBaseUrl();

  setBaseUrl(url: string) {
    this.baseUrl = url;
    try {
      localStorage.setItem('grounded_api_url', url);
    } catch {}
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  askQuestion(question: string, sessionId?: string, isTemporary: boolean = false): Observable<AskResponse> {
    const payload = { question, sessionId, isTemporary };
    return this.http.post<AskResponse>(`${this.baseUrl}/ask`, payload);
  }

  getHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.baseUrl}/health`).pipe(
      catchError(err => {
        console.warn('API Health check unreachable, falling back to simulated status', err);
        return of({
          status: 'connecting',
          framework: '.NET 9.0 (ASP.NET Core)',
          index_loaded: true,
          chunk_count: 24,
          llm_mode: 'csharp-grounded-rag'
        } as HealthStatus);
      })
    );
  }

  getSampleQuestions(): Observable<SampleQuestion[]> {
    return this.http.get<SampleQuestion[]>(`${this.baseUrl}/ask/sample-questions`).pipe(
      catchError(() => of([
        { category: 'Guideline Scope', text: 'Who should receive behavioral counseling according to USPSTF 2018?', tag: 'Grade B' },
        { category: 'Adult Evidence', text: 'What is the USPSTF recommendation for adults older than 24 years?', tag: 'Grade I' },
        { category: 'Intervention Strategies', text: 'What are the most effective sun-protection behavioral interventions?', tag: 'Practice' },
        { category: 'Indoor Tanning', text: 'What does the guideline say about indoor tanning bed risks before age 35?', tag: 'Risk Factor' },
        { category: 'Infants Care', text: 'What is recommended for sun protection in infants under 6 months old?', tag: 'Pediatrics' },
        { category: 'ATSDR Toxicology', text: 'What is the odor threshold for hydrogen sulfide and when does olfactory fatigue occur?', tag: 'ATSDR H2S' },
        { category: 'Exposure Limits', text: 'What are the OSHA ceiling and NIOSH REL exposure limits for hydrogen sulfide?', tag: 'Standards' },
        { category: 'Minimal Risk Levels', text: 'What are the ATSDR Acute and Intermediate Minimal Risk Levels (MRLs) for H2S?', tag: 'MRL' },
        { category: 'Safety Test', text: 'What dosage of 5-Fluorouracil should I apply to this lesion?', tag: 'Refusal Test' }
      ]))
    );
  }

  getSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.baseUrl}/sessions`).pipe(
      catchError(() => of([]))
    );
  }

  createSession(title?: string, isTemporary: boolean = false): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.baseUrl}/sessions`, { title, isTemporary });
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${id}`);
  }
}
