import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/grounded.models';
import { ClaimCardComponent } from '../claim-card/claim-card.component';

@Component({
  selector: 'app-message-card',
  standalone: true,
  imports: [CommonModule, ClaimCardComponent],
  template: `
    <div class="message-row" [class.user-row]="message.role === 'user'" [class.assistant-row]="message.role === 'assistant'">
      <!-- Avatar -->
      <div class="message-avatar">
        @if (message.role === 'user') {
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        } @else {
          <div class="assistant-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
        }
      </div>

      <!-- Message Content -->
      <div class="message-bubble-wrap">
        @if (message.role === 'user') {
          <!-- User Prompt Bubble -->
          <div class="user-bubble">
            <p>{{ message.content }}</p>
            <span class="bubble-time">{{ message.timestamp | date:'shortTime' }}</span>
          </div>
        } @else {
          <!-- Assistant Clinical Response Card -->
          <div class="clinical-card" [ngClass]="getCardStatusClass()">
            <!-- Card Header: Badges & Confidence -->
            <div class="clinical-card-header">
              <div class="status-badges">
                <!-- Main Status Badge -->
                <div class="badge-status" [ngClass]="getStatusBadgeClass()">
                  <span class="badge-icon-dot"></span>
                  <span>{{ message.response?.status || 'Clinical Evidence' }}</span>
                </div>

                <!-- Risk Tier Badge -->
                @if (message.response?.risk_tier; as tier) {
                  <div class="badge-tier" [ngClass]="getTierBadgeClass(tier)">
                    <span>Risk: {{ tier }}</span>
                  </div>
                }
              </div>

              <!-- Confidence & Framework Meta -->
              @if (message.response; as resp) {
                <div class="header-meta">
                  <div class="confidence-pill" [ngClass]="getConfidenceClass(resp.confidence)">
                    <span>Confidence: <strong>{{ resp.confidence }}</strong></span>
                  </div>
                </div>
              }
            </div>

            <!-- Recommendation Body -->
            <div class="recommendation-box">
              <p class="rec-text">{{ message.content }}</p>
            </div>

            <!-- Safety Note / Caution Alert -->
            @if (message.response?.safety_note; as note) {
              @if (note.length > 0) {
                <div class="safety-alert-box" [class.alert-red]="message.response?.status === 'Safety Refusal'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{{ note }}</span>
                </div>
              }
            }

            <!-- Supporting Evidence Claims List -->
            @if (message.response?.supporting_evidence?.length) {
              <div class="evidence-section">
                <div class="evidence-section-header">
                  <span class="evidence-title">Verifiable Evidence Citations</span>
                  <span class="evidence-count">{{ message.response?.supporting_evidence?.length }} Grounded Claims</span>
                </div>
                
                <div class="claims-list">
                  @for (ev of message.response?.supporting_evidence; track ev.citation.chunk_id) {
                    <app-claim-card [evidence]="ev" />
                  }
                </div>
              </div>
            }

            <!-- Retrieved Chunks / Pipeline Drawer Accordion -->
            @if (message.response?.retrieved_chunks?.length) {
              <div class="pipeline-accordion">
                <button class="btn-toggle-chunks" (click)="toggleChunks()">
                  <div class="toggle-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                      <polyline points="2 17 12 22 22 17"/>
                      <polyline points="2 12 12 17 22 12"/>
                    </svg>
                    <span>Dense Retrieval Inspection ({{ message.response?.retrieved_chunks?.length }} Chunks)</span>
                  </div>
                  <div class="toggle-right">
                    <span class="score-pill">Top: {{ message.response?.top_score | number:'1.2-2' }}</span>
                    <span class="threshold-pill">Gate: {{ message.response?.weak_threshold }}</span>
                    <svg class="chevron" [class.open]="showChunks()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>

                @if (showChunks()) {
                  <div class="chunks-panel">
                    @for (chunk of message.response?.retrieved_chunks; track chunk.chunk_id) {
                      <div class="chunk-item">
                        <div class="chunk-meta">
                          <span class="chunk-name">{{ chunk.section }}</span>
                          <span class="chunk-score" [class.high-score]="chunk.score >= 0.57">Score: {{ chunk.score | number:'1.3-3' }}</span>
                        </div>
                        <p class="chunk-preview">{{ chunk.text }}</p>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Card Footer -->
            <div class="card-footer">
              <div class="footer-path">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
                <span>{{ message.response?.decision_path || 'Direct Guidance' }}</span>
              </div>

              <div class="footer-actions">
                <span class="msg-time">{{ message.timestamp | date:'shortTime' }}</span>
                <button class="btn-copy" (click)="copyResponse()" title="Copy Recommendation">
                  @if (copied()) {
                    <span class="copied-text">Copied!</span>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  }
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .message-row {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
    }

    .user-row {
      flex-direction: row-reverse;
    }

    .message-avatar {
      flex-shrink: 0;
      margin-top: 4px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    }

    .user-avatar svg {
      width: 18px;
      height: 18px;
    }

    .assistant-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-cyan));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
    }

    .assistant-avatar svg {
      width: 18px;
      height: 18px;
    }

    .message-bubble-wrap {
      flex: 1;
      max-width: 85%;
    }

    .user-row .message-bubble-wrap {
      display: flex;
      justify-content: flex-end;
    }

    .user-bubble {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
      padding: 0.85rem 1.15rem;
      border-radius: 16px 4px 16px 16px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .user-bubble p {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .bubble-time {
      font-size: 0.68rem;
      opacity: 0.75;
      align-self: flex-end;
    }

    /* Assistant Clinical Card */
    .clinical-card {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .clinical-card.status-refusal {
      border-color: rgba(239, 68, 68, 0.4);
      background: linear-gradient(180deg, rgba(239, 68, 68, 0.04), var(--bg-surface-elevated));
    }

    .clinical-card.status-insufficient {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.04), var(--bg-surface-elevated));
    }

    .clinical-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .status-badges {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .badge-status {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .badge-status.answered {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-status.refusal {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .badge-status.insufficient {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-icon-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .badge-tier {
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }

    .badge-tier.tier-allowed {
      color: #10b981;
    }

    .badge-tier.tier-caution {
      color: #f59e0b;
    }

    .badge-tier.tier-refuse {
      color: #ef4444;
    }

    .confidence-pill {
      font-size: 0.75rem;
      color: var(--text-secondary);
      background: var(--bg-surface);
      padding: 0.25rem 0.6rem;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
    }

    .confidence-pill.high strong { color: #10b981; }
    .confidence-pill.moderate strong { color: #f59e0b; }
    .confidence-pill.low strong { color: #ef4444; }

    .recommendation-box {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-primary);
    }

    .rec-text {
      margin: 0;
      white-space: pre-wrap;
    }

    .safety-alert-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
      border-radius: 10px;
      font-size: 0.82rem;
      line-height: 1.4;
    }

    .safety-alert-box.alert-red {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    .safety-alert-box svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .evidence-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-subtle);
    }

    .evidence-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .evidence-title {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .evidence-count {
      font-size: 0.72rem;
      color: var(--primary-color);
      font-weight: 600;
    }

    .claims-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    /* Accordion */
    .pipeline-accordion {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      overflow: hidden;
    }

    .btn-toggle-chunks {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.85rem;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .btn-toggle-chunks:hover {
      background: var(--bg-surface-hover);
    }

    .toggle-left, .toggle-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .toggle-left svg {
      width: 15px;
      height: 15px;
      color: var(--text-muted);
    }

    .score-pill, .threshold-pill {
      font-size: 0.7rem;
      background: var(--bg-surface-elevated);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
    }

    .chevron {
      width: 14px;
      height: 14px;
      transition: transform 0.2s ease;
    }

    .chevron.open {
      transform: rotate(180deg);
    }

    .chunks-panel {
      padding: 0.75rem 0.85rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .chunk-item {
      background: var(--bg-surface-elevated);
      border-radius: 6px;
      padding: 0.6rem;
      border: 1px solid var(--border-subtle);
    }

    .chunk-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .chunk-score.high-score {
      color: #10b981;
    }

    .chunk-preview {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.35;
    }

    /* Footer */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.6rem;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .footer-path {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .footer-path svg {
      width: 13px;
      height: 13px;
    }

    .footer-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .btn-copy {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
    }

    .btn-copy:hover {
      color: var(--text-primary);
    }

    .btn-copy svg {
      width: 14px;
      height: 14px;
    }

    .copied-text {
      color: #10b981;
      font-size: 0.7rem;
      font-weight: 600;
    }
  `]
})
export class MessageCardComponent {
  @Input({ required: true }) message!: ChatMessage;

  showChunks = signal<boolean>(false);
  copied = signal<boolean>(false);

  toggleChunks() {
    this.showChunks.update(v => !v);
  }

  copyResponse() {
    navigator.clipboard.writeText(this.message.content).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  getCardStatusClass(): string {
    const status = this.message.response?.status;
    if (status === 'Safety Refusal') return 'status-refusal';
    if (status === 'Insufficient Evidence') return 'status-insufficient';
    return '';
  }

  getStatusBadgeClass(): string {
    const status = this.message.response?.status;
    if (status === 'Safety Refusal') return 'refusal';
    if (status === 'Insufficient Evidence') return 'insufficient';
    return 'answered';
  }

  getTierBadgeClass(tier: string): string {
    if (tier === 'Allowed') return 'tier-allowed';
    if (tier === 'Needs Caution') return 'tier-caution';
    if (tier === 'Refuse/Redirect') return 'tier-refuse';
    return '';
  }

  getConfidenceClass(conf: string): string {
    const lower = conf?.toLowerCase() || '';
    if (lower.includes('high')) return 'high';
    if (lower.includes('mod')) return 'moderate';
    return 'low';
  }
}
