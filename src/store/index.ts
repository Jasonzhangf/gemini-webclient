import { create } from 'zustand';
import { ChatMessage, ChatSession, openGeminiDB } from '../utils/db';
import { GeminiConfig } from '../config/gemini';

interface LogEntry {
  timestamp: number;
  level: 'error' | 'warn' | 'info';
  message: string;
  details?: any;
}

interface AppState {
  config: GeminiConfig | null;
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isConfigured: boolean;
  showConfig: boolean;
  logs: LogEntry[];
  setConfig: (config: GeminiConfig) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  setShowConfig: (show: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  updateSession: (session: ChatSession) => void;
  addLog: (level: LogEntry['level'], message: string, details?: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: null,
  sessions: [],
  currentSession: null,
  isConfigured: false,
  showConfig: false,
  logs: [],

  setConfig: (config) => set({ config, isConfigured: true }),
  setSessions: (sessions) => set({ sessions }),
  setShowConfig: (show) => set({ showConfig: show }),
  setCurrentSession: (session) => set({ currentSession: session }),
  addMessage: (message) =>
    set((state) => {
      if (!state.currentSession) return state;
      const updatedSession = {
        ...state.currentSession,
        messages: [...state.currentSession.messages, message],
        lastMessage: message.content,
        lastUpdated: Date.now(),
      };
      // 自动保存会话到数据库
      openGeminiDB().then(db => {
        db.put('sessions', updatedSession).catch(error => {
          console.error('Failed to save session:', error);
          state.addLog('error', '保存会话失败', error);
        });
      });
      return {
        currentSession: updatedSession,
        sessions: state.sessions.map((s) =>
          s.id === updatedSession.id ? updatedSession : s
        ),
      };
    }),
  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
      currentSession: state.currentSession?.id === session.id ? session : state.currentSession,
    })),
  addLog: (level, message, details) =>
    set((state) => ({
      logs: [...state.logs, { timestamp: Date.now(), level, message, details }],
    })),
}));