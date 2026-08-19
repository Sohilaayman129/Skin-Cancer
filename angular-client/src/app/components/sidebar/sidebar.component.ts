import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';
import { GroundedApiService } from '../../services/grounded-api.service';
import { SampleQuestion } from '../../models/grounded.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <!-- Top Action: New Chat -->
      <div class="sidebar-header">
        <button class="btn-new-chat" (click)="chatState.createNewSession()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>New Consultation</span>
        </button>
      </div>

      <!-- History Sessions -->
      <div class="sidebar-section">
        <div class="section-title">
          <span>Clinical History</span>
          <span class="count-pill">{{ chatState.sessions().length }}</span>
        </div>

        <div class="sessions-list">
          @for (session of chatState.sessions(); track session.id) {
            <div 
              class="session-item"
              [class.active]="chatState.activeSessionId() === session.id"
              (click)="chatState.selectSession(session.id)">
              <div class="session-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="session-info">
                <div class="session-title-text">{{ session.title }}</div>
                <div class="session-time">{{ session.updatedAt | date:'shortTime' }}</div>
              </div>
              <button 
                class="btn-delete" 
                (click)="$event.stopPropagation(); chatState.deleteSession(session.id)"
                title="Delete Session">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          } @empty {
            <div class="empty-sessions">
              <span>No saved consultations yet.</span>
            </div>
          }
        </div>
      </div>

      <!-- Sample Guideline Prompts -->
      <div class="sidebar-section prompts-section">
        <div class="section-title">
          <span>Guideline Benchmarks</span>
        </div>

        <div class="prompts-list">
          @for (q of sampleQuestions(); track q.text) {
            <button class="prompt-chip" (click)="onSelectPrompt(q.text)">
              <div class="prompt-tag">{{ q.tag }}</div>
              <div class="prompt-text">{{ q.text }}</div>
            </button>
          }
        </div>
      </div>

      <!-- Guideline Specs Box -->
      <div class="guideline-card">
        <div class="guideline-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>USPSTF 2018 Policy</span>
        </div>
        <div class="guideline-metric">
          <span>Target Group:</span>
          <strong>6 mo – 24 yrs (Grade B)</strong>
        </div>
        <div class="guideline-metric">
          <span>Adults >24y:</span>
          <strong>Insufficient Ev. (Grade I)</strong>
        </div>
        <div class="guideline-metric">
          <span>Safety Gate:</span>
          <strong class="green-text">5-Tier Pre-Gen Filter</strong>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 290px;
      height: calc(100vh - 64px);
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      padding: 1rem;
      gap: 1.25rem;
      overflow-y: auto;
      transition: width 0.3s ease;
    }

    .sidebar-header {
      width: 100%;
    }

    .btn-new-chat {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
      transition: all 0.2s ease;
    }

    .btn-new-chat:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
    }

    .btn-new-chat svg {
      width: 18px;
      height: 18px;
    }

    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      padding: 0 0.25rem;
    }

    .count-pill {
      background: var(--bg-surface-elevated);
      padding: 0.1rem 0.4rem;
      border-radius: 6px;
      font-size: 0.7rem;
    }

    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      max-height: 180px;
      overflow-y: auto;
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.6rem 0.75rem;
      border-radius: 10px;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }

    .session-item:hover {
      background: var(--bg-surface-hover);
      border-color: var(--border-subtle);
    }

    .session-item.active {
      background: var(--bg-surface-elevated);
      border-color: rgba(16, 185, 129, 0.4);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);
    }

    .session-icon svg {
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }

    .session-item.active .session-icon svg {
      color: var(--primary-color);
    }

    .session-info {
      flex: 1;
      min-width: 0;
    }

    .session-title-text {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .session-time {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    .btn-delete {
      opacity: 0;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .session-item:hover .btn-delete {
      opacity: 1;
    }

    .btn-delete:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .btn-delete svg {
      width: 14px;
      height: 14px;
    }

    .empty-sessions {
      font-size: 0.78rem;
      color: var(--text-muted);
      padding: 0.5rem 0.25rem;
      font-style: italic;
    }

    .prompts-section {
      flex: 1;
    }

    .prompts-list {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      overflow-y: auto;
    }

    .prompt-chip {
      text-align: left;
      padding: 0.55rem 0.7rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .prompt-chip:hover {
      border-color: var(--primary-color);
      transform: translateX(3px);
      background: var(--bg-surface-hover);
    }

    .prompt-tag {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--primary-color);
      text-transform: uppercase;
    }

    .prompt-text {
      font-size: 0.78rem;
      color: var(--text-secondary);
      line-height: 1.25;
    }

    .guideline-card {
      padding: 0.85rem;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.05));
      border: 1px solid rgba(16, 185, 129, 0.2);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .guideline-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .guideline-title svg {
      width: 15px;
      height: 15px;
    }

    .guideline-metric {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: var(--text-secondary);
    }

    .green-text {
      color: #10b981;
    }

    @media (max-width: 900px) {
      .sidebar {
        display: none;
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  chatState = inject(ChatStateService);
  private api = inject(GroundedApiService);

  isCollapsed = signal<boolean>(false);
  sampleQuestions = signal<SampleQuestion[]>([]);

  ngOnInit() {
    this.api.getSampleQuestions().subscribe(questions => {
      this.sampleQuestions.set(questions);
    });
  }

  onSelectPrompt(question: string) {
    this.chatState.sendMessage(question);
  }
}
