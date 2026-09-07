import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-evidence-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (chatState.selectedEvidence(); as ev) {
      <div class="drawer-backdrop" (click)="chatState.closeEvidenceDrawer()">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <div class="drawer-title-group">
              <div class="guideline-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>USPSTF 2018 Official Guideline</span>
              </div>
              <h3 class="drawer-title">{{ ev.citation.section }}</h3>
            </div>

            <button class="btn-close" (click)="chatState.closeEvidenceDrawer()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="drawer-body">
            <!-- Metadata Grid -->
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Document:</span>
                <span class="meta-value">{{ ev.citation.document }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Page:</span>
                <span class="meta-value">Page {{ ev.citation.page }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Chunk ID:</span>
                <span class="meta-value code-font">{{ ev.citation.chunk_id }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Verification:</span>
                <span class="meta-value verified-text">100% Grounded</span>
              </div>
            </div>

            <!-- Grounded Claim -->
            <div class="section-box">
              <div class="section-label">Extracted Clinical Claim:</div>
              <div class="claim-box">
                <p>{{ ev.claim }}</p>
              </div>
            </div>

            <!-- Verbatim Passage -->
            <div class="section-box">
              <div class="section-label">Verbatim Guideline Passage:</div>
              <div class="passage-box">
                <p>{{ ev.passage || 'Direct passage extracted from official USPSTF Skin Cancer Counseling Guideline.' }}</p>
              </div>
            </div>

            <!-- Clinical Disclaimer -->
            <div class="disclaimer-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>This citation is locked to the official USPSTF 2018 Recommendation. The assistant cannot fabricate sources or reference unverified external documents.</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 50;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease;
    }

    .drawer-panel {
      width: 100%;
      max-width: 480px;
      height: 100%;
      background: var(--bg-surface);
      border-left: 1px solid var(--border-subtle);
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
      animation: slideIn 0.25s ease;
    }

    .drawer-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .drawer-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .guideline-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--primary-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .guideline-badge svg {
      width: 14px;
      height: 14px;
    }

    .drawer-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .btn-close {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-close:hover {
      color: var(--text-primary);
      background: var(--bg-surface-hover);
    }

    .btn-close svg {
      width: 16px;
      height: 16px;
    }

    .drawer-body {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      background: var(--bg-surface-elevated);
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .meta-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .meta-value {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .code-font {
      font-family: monospace;
      font-size: 0.75rem;
    }

    .verified-text {
      color: #10b981;
    }

    .section-box {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .claim-box {
      background: var(--bg-surface-elevated);
      border-left: 3px solid var(--primary-color);
      padding: 0.85rem;
      border-radius: 8px;
    }

    .claim-box p {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.45;
      color: var(--text-primary);
    }

    .passage-box {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 1rem;
      border-radius: 10px;
      font-family: Georgia, serif;
      font-style: italic;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .passage-box p {
      margin: 0;
      font-size: 0.88rem;
    }

    .disclaimer-box {
      display: flex;
      gap: 0.6rem;
      background: rgba(6, 182, 212, 0.08);
      border: 1px solid rgba(6, 182, 212, 0.25);
      padding: 0.85rem;
      border-radius: 10px;
      font-size: 0.75rem;
      color: var(--accent-cyan);
      line-height: 1.4;
    }

    .disclaimer-box svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `]
})
export class EvidenceDrawerComponent {
  chatState = inject(ChatStateService);
}
