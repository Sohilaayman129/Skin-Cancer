import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-stage-tracker',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (chatState.isLoading() || chatState.currentStage() !== 'idle') {
      <div class="stage-tracker-card">
        <div class="tracker-header">
          <div class="tracker-title">
            <span class="live-dot"></span>
            <span>Evidence-Bound Pipeline Execution</span>
          </div>
          <div class="tracker-stage-detail">{{ chatState.stageDetails() }}</div>
        </div>

        <div class="stages-flow">
          <!-- Step 1: Risk & Safety Classifier -->
          <div class="stage-step" [ngClass]="getStepClass('risk_check')">
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div class="step-label">1. Risk Classifier</div>
            <div class="step-indicator"></div>
          </div>

          <div class="flow-connector" [class.active]="isPastStage('risk_check')"></div>

          <!-- Step 2: Dense Retrieval -->
          <div class="stage-step" [ngClass]="getStepClass('retrieval')">
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <div class="step-label">2. Dense Retrieval</div>
            <div class="step-indicator"></div>
          </div>

          <div class="flow-connector" [class.active]="isPastStage('retrieval')"></div>

          <!-- Step 3: Evidence Grounding -->
          <div class="stage-step" [ngClass]="getStepClass('synthesis')">
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div class="step-label">3. Grounded LLM</div>
            <div class="step-indicator"></div>
          </div>

          <div class="flow-connector" [class.active]="isPastStage('synthesis')"></div>

          <!-- Step 4: Citation Validation -->
          <div class="stage-step" [ngClass]="getStepClass('validation')">
            <div class="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="step-label">4. Fact Gate</div>
            <div class="step-indicator"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .stage-tracker-card {
      margin: 0.75rem 1.5rem;
      padding: 1rem 1.25rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-highlight);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      animation: fadeIn 0.3s ease;
    }

    .tracker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }

    .tracker-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      animation: pulse 1.5s infinite;
    }

    .tracker-stage-detail {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .stages-flow {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stage-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      position: relative;
    }

    .step-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .step-icon svg {
      width: 16px;
      height: 16px;
    }

    .step-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .flow-connector {
      flex: 1;
      height: 2px;
      background: var(--border-subtle);
      margin: 0 0.5rem;
      margin-bottom: 1.2rem;
      transition: background 0.3s ease;
    }

    .flow-connector.active {
      background: var(--primary-color);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }

    /* Step States */
    .stage-step.active .step-icon {
      background: rgba(16, 185, 129, 0.15);
      border-color: var(--primary-color);
      color: var(--primary-color);
      box-shadow: 0 0 14px rgba(16, 185, 129, 0.35);
      transform: scale(1.1);
    }

    .stage-step.active .step-label {
      color: var(--primary-color);
    }

    .stage-step.completed .step-icon {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .stage-step.completed .step-label {
      color: var(--text-primary);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }

    @media (max-width: 640px) {
      .stage-tracker-card { margin: 0.5rem; }
      .step-label { font-size: 0.6rem; }
    }
  `]
})
export class StageTrackerComponent {
  chatState = inject(ChatStateService);

  private stageOrder = ['risk_check', 'retrieval', 'synthesis', 'validation', 'complete'];

  getStepClass(step: string): string {
    const current = this.chatState.currentStage();
    if (current === step) return 'active';
    const currentIdx = this.stageOrder.indexOf(current);
    const stepIdx = this.stageOrder.indexOf(step);
    if (currentIdx > stepIdx) return 'completed';
    return '';
  }

  isPastStage(step: string): boolean {
    const current = this.chatState.currentStage();
    const currentIdx = this.stageOrder.indexOf(current);
    const stepIdx = this.stageOrder.indexOf(step);
    return currentIdx > stepIdx;
  }
}
