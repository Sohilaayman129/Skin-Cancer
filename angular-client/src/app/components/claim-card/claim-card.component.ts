import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvidenceItem } from '../../models/grounded.models';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-claim-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="claim-card">
      <div class="claim-header">
        <div class="citation-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>{{ evidence.citation.section || 'USPSTF Guideline' }} (p. {{ evidence.citation.page }})</span>
        </div>
        
        <button class="btn-passage" (click)="chatState.openEvidenceDrawer(evidence)">
          <span>Source Passage</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <p class="claim-text">{{ evidence.claim }}</p>

      <div class="claim-footer">
        <span class="chunk-tag">ID: {{ evidence.citation.chunk_id }}</span>
        <span class="verified-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Grounded Claim
        </span>
      </div>
    </div>
  `,
  styles: [`
    .claim-card {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-left: 3px solid var(--primary-color);
      border-radius: 10px;
      padding: 0.85rem 1rem;
      margin-top: 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .claim-card:hover {
      border-color: var(--primary-color);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .claim-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .citation-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--primary-color);
      background: rgba(16, 185, 129, 0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .citation-badge svg {
      width: 13px;
      height: 13px;
    }

    .btn-passage {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.72rem;
      color: var(--text-secondary);
      background: transparent;
      border: 1px solid var(--border-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-passage:hover {
      color: var(--primary-color);
      border-color: var(--primary-color);
      background: var(--bg-surface-hover);
    }

    .btn-passage svg {
      width: 12px;
      height: 12px;
    }

    .claim-text {
      font-size: 0.84rem;
      line-height: 1.45;
      color: var(--text-primary);
      margin: 0;
    }

    .claim-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    .chunk-tag {
      font-family: monospace;
      background: var(--bg-surface);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .verified-tag {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #10b981;
      font-weight: 600;
    }

    .verified-tag svg {
      width: 12px;
      height: 12px;
    }
  `]
})
export class ClaimCardComponent {
  @Input({ required: true }) evidence!: EvidenceItem;
  chatState = inject(ChatStateService);
}
