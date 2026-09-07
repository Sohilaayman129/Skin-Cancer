import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChatConsoleComponent } from './components/chat-console/chat-console.component';
import { EvidenceDrawerComponent } from './components/evidence-drawer/evidence-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    ChatConsoleComponent,
    EvidenceDrawerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
