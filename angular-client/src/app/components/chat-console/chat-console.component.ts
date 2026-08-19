import { Component, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';
import { StageTrackerComponent } from '../stage-tracker/stage-tracker.component';
import { MessageCardComponent } from '../message-card/message-card.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'app-chat-console',
  standalone: true,
  imports: [CommonModule, StageTrackerComponent, MessageCardComponent, ChatInputComponent],
  template: `
    <main class="chat-console">
      <!-- Pipeline Execution Stage Tracker -->
      <app-stage-tracker />

      <!-- Error Alert Bar -->
      @if (chatState.errorMessage(); as err) {
        <div class="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ err }}</span>
        </div>
      }

      <!-- Messages Stream Scroll Area -->
      <div class="messages-viewport" #scrollContainer>
        <div class="messages-container">
          @for (msg of chatState.activeMessages(); track msg.id) {
            <app-message-card [message]="msg" />
          }
          
          <!-- Thinking / Loading Indicator -->
          @if (chatState.isLoading()) {
            <div class="thinking-row">
              <div class="assistant-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2v20M2 12h20"/>
                </svg>
              </div>
              <div class="thinking-card">
                <div class="thinking-dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
                <span class="thinking-text">{{ chatState.stageDetails() || 'Retrieving evidence & generating grounded response...' }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Chat Input Field -->
      <app-chat-input />
    </main>
  `,
  styles: [`
    .chat-console {
      flex: 1;
      height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
      background: var(--bg-canvas);
      position: relative;
      overflow: hidden;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 0.65rem 1.5rem;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .error-banner svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .messages-viewport {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      scroll-behavior: smooth;
    }

    .messages-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem 0;
    }

    .thinking-row {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
      align-items: center;
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
      flex-shrink: 0;
    }

    .assistant-avatar svg {
      width: 18px;
      height: 18px;
    }

    .thinking-card {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 0.85rem 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .thinking-dots {
      display: flex;
      gap: 0.35rem;
    }

    .dot {
      width: 8px;
      height: 8px;
      background: var(--primary-color);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }

    .thinking-text {
      font-size: 0.82rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ChatConsoleComponent implements AfterViewChecked {
  chatState = inject(ChatStateService);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch {}
    }
  }
}
