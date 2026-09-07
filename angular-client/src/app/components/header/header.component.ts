import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="header-left">
        <div class="logo-box">
          <div class="logo-icon-wrap">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M2 12h20"/>
              <circle cx="12" cy="12" r="9" stroke-width="1.5" opacity="0.4"/>
            </svg>
            <div class="logo-glow"></div>
          </div>
          <div class="logo-text">
            <div class="brand-title">
              <span class="brand-name">Grounded</span>
              <span class="brand-badge">Clinical AI</span>
            </div>
            <span class="brand-subtitle">USPSTF Skin Cancer & ATSDR Toxicology Guidelines</span>
          </div>
        </div>
      </div>

      <div class="header-center">
        <div class="stack-badge">
          <span class="badge-dot pulse-green"></span>
          <span class="stack-text">Angular 19 + .NET 9 API</span>
        </div>
        
        @if (chatState.isTemporaryMode()) {
          <div class="incognito-pill">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12h20M7 8l5-5 5 5M12 3v18"/>
            </svg>
            <span>Incognito Mode Active</span>
          </div>
        }
      </div>

      <div class="header-right">
        <!-- Health Status Pill -->
        <div class="health-pill" [class.healthy]="chatState.healthStatus()?.status === 'ok'">
          <span class="status-indicator"></span>
          <span class="health-text">
            {{ chatState.healthStatus()?.framework || '.NET 9 Core' }}
          </span>
        </div>

        <!-- Incognito Toggle Button -->
        <button 
          class="btn-icon" 
          [class.active]="chatState.isTemporaryMode()"
          (click)="chatState.toggleTemporaryMode()"
          title="Toggle Incognito Consultation (No History Stored)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>

        <!-- Theme Toggle -->
        <button class="btn-icon theme-btn" (click)="theme.toggleTheme()" title="Toggle Dark/Light Mode">
          @if (theme.isDark()) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          }
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 1.5rem;
      background: var(--bg-surface-glass);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-center {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-box {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      cursor: pointer;
    }

    .logo-icon-wrap {
      position: relative;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-cyan));
      border-radius: 10px;
      color: white;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
    }

    .logo-icon {
      width: 22px;
      height: 22px;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .brand-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      background: rgba(16, 185, 129, 0.15);
      color: var(--primary-color);
      border-radius: 6px;
      border: 1px solid rgba(16, 185, 129, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .brand-subtitle {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .stack-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      background: var(--badge-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 9999px;
      font-size: 0.78rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .pulse-green {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }

    .incognito-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .health-pill {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .health-pill.healthy .status-indicator {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .status-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #f59e0b;
    }

    .btn-icon {
      width: 38px;
      height: 38px;
      border-radius: 9px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-elevated);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-icon svg {
      width: 18px;
      height: 18px;
    }

    .btn-icon:hover {
      color: var(--text-primary);
      background: var(--bg-surface-hover);
      border-color: var(--border-hover);
      transform: translateY(-1px);
    }

    .btn-icon.active {
      background: rgba(245, 158, 11, 0.2);
      border-color: #f59e0b;
      color: #f59e0b;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.15); }
    }

    @media (max-width: 768px) {
      .header-center { display: none; }
      .brand-subtitle { display: none; }
    }
  `]
})
export class HeaderComponent {
  theme = inject(ThemeService);
  chatState = inject(ChatStateService);
}
