import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-input-wrapper">
      <!-- Quick Suggestion Pills -->
      <div class="quick-pills">
        <button class="quick-pill" (click)="setQuestion('Who should receive behavioral counseling according to USPSTF 2018?')">
          <span>👶 Persons 6mo – 24yrs</span>
        </button>
        <button class="quick-pill" (click)="setQuestion('What is the USPSTF recommendation for adults older than 24 years?')">
          <span>👥 Adults >24y (Grade I)</span>
        </button>
        <button class="quick-pill" (click)="setQuestion('What are the risks of indoor tanning beds before age 35?')">
          <span>☀️ Indoor Tanning</span>
        </button>
        <button class="quick-pill" (click)="setQuestion('What is the recommended dosage of 5-Fluorouracil for actinic keratosis?')">
          <span>🛡️ Safety Refusal Test</span>
        </button>
      </div>

      <!-- Main Input Bar -->
      <div class="input-bar" [class.focused]="isFocused()">
        <textarea 
          #textareaRef
          [(ngModel)]="userInput"
          (keydown.enter)="onEnter($event)"
          (focus)="isFocused.set(true)"
          (blur)="isFocused.set(false)"
          placeholder="Ask a clinical skin cancer counseling question (e.g. target age, SPF, tanning risk)..."
          rows="1"
          [disabled]="chatState.isLoading()"></textarea>

        <div class="input-actions">
          <span class="char-count" [class.warning]="userInput.length > 500">{{ userInput.length }}/1000</span>
          
          <button 
            class="btn-send" 
            [disabled]="!userInput.trim() || chatState.isLoading()"
            (click)="onSubmit()"
            title="Send Question (Enter)">
            @if (chatState.isLoading()) {
              <div class="spinner"></div>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            }
          </button>
        </div>
      </div>

      <div class="input-disclaimer">
        <span>Grounded in the USPSTF 2018 Recommendation Statement. Evidence-bound clinical decision support only.</span>
      </div>
    </div>
  `,
  styles: [`
    .chat-input-wrapper {
      padding: 0.75rem 1.5rem 1.25rem 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .quick-pills {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      scrollbar-width: none;
    }

    .quick-pills::-webkit-scrollbar {
      display: none;
    }

    .quick-pill {
      flex-shrink: 0;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .quick-pill:hover {
      background: var(--bg-surface-hover);
      border-color: var(--primary-color);
      color: var(--primary-color);
      transform: translateY(-1px);
    }

    .input-bar {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 0.75rem 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      transition: all 0.2s ease;
    }

    .input-bar.focused {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15), 0 6px 24px rgba(0, 0, 0, 0.15);
    }

    textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      font-family: inherit;
      font-size: 0.92rem;
      line-height: 1.45;
      color: var(--text-primary);
      max-height: 120px;
    }

    textarea::placeholder {
      color: var(--text-muted);
    }

    .input-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .char-count {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .char-count.warning {
      color: #f59e0b;
    }

    .btn-send {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
    }

    .btn-send:hover:not(:disabled) {
      transform: translateY(-1px) scale(1.05);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
    }

    .btn-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-send svg {
      width: 16px;
      height: 16px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .input-disclaimer {
      text-align: center;
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ChatInputComponent {
  chatState = inject(ChatStateService);

  userInput: string = '';
  isFocused = signal<boolean>(false);

  setQuestion(q: string) {
    this.userInput = q;
  }

  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.onSubmit();
    }
  }

  onSubmit() {
    const clean = this.userInput.trim();
    if (!clean || this.chatState.isLoading()) return;

    this.chatState.sendMessage(clean);
    this.userInput = '';
  }
}
