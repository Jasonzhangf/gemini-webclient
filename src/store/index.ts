import { create } from 'zustand';
import { ChatMessage, ChatSession, openGeminiDB } from '../utils/db';
import { GeminiConfig } from '../config/gemini';

interface LogEntry {
  timestamp: number;
  level: 'error' | 'warn' | 'info';
  message: string;
  details?: any;
}

interface User {
  username: string;
  isLoggedIn: boolean;
  rememberMe: boolean;
}

interface AppState {
  config: GeminiConfig | null;
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isConfigured: boolean;
  showConfig: boolean;
  logs: LogEntry[];
  user: User | null;
  setConfig: (config: GeminiConfig) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  setShowConfig: (show: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  updateSession: (session: ChatSession) => void;
  addLog: (level: LogEntry['level'], message: string, details?: any) => void;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: null,
  sessions: [],
  currentSession: null,
  isConfigured: false,
  showConfig: false,
  logs: [],
  user: null,

  setConfig: async (config) => {
    try {
      const db = await openGeminiDB();
      if (!db) {
        throw new Error('数据库初始化失败，请检查浏览器是否支持IndexedDB');
      }
      await db.put('config', { ...config, id: 'default' });
      set({ config, isConfigured: true, showConfig: false });
    } catch (error) {
      console.error('配置保存失败:', error);
      set(state => ({
        ...state,
        isConfigured: false,
        logs: [...state.logs, { timestamp: Date.now(), level: 'error', message: '配置保存失败，请检查浏览器是否支持IndexedDB或刷新页面重试', details: error }]
      }));
    }
  },
  setSessions: (sessions) => set({ sessions }),
  setShowConfig: (show) => set({ showConfig: show }),
  setCurrentSession: (session) => set({ currentSession: session }),
  addMessage: (message) => {
    set((state) => {
      if (!state.currentSession) return state;
      const updatedSession = {
        ...state.currentSession,
        messages: [...state.currentSession.messages, message],
        lastMessage: message.content,
        lastUpdated: Date.now(),
      };
      
      // 立即更新UI状态
      const newState = {
        currentSession: updatedSession,
        sessions: state.sessions.map((s) =>
          s.id === updatedSession.id ? updatedSession : s
        ),
      };

      // 异步保存到数据库
      (async () => {
        try {
          const db = await openGeminiDB();
          if (!db) {
            throw new Error('数据库初始化失败，请检查浏览器是否支持IndexedDB');
          }
          await db.put('sessions', updatedSession);
        } catch (error) {
          console.error('保存会话失败:', error);
          set(state => ({
            ...state,
            logs: [...state.logs, { timestamp: Date.now(), level: 'error', message: '保存会话失败，请检查浏览器是否支持IndexedDB或刷新页面重试', details: error }]
          }));
        }
      })();

      return newState;
    });
  },
  updateSession: async (session) => {
    try {
      const db = await openGeminiDB();
      if (!db) {
        throw new Error('数据库初始化失败，请检查浏览器是否支持IndexedDB');
      }
      await db.put('sessions', session);
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
        currentSession: state.currentSession?.id === session.id ? session : state.currentSession,
      }));
    } catch (error) {
      console.error('更新会话失败:', error);
      set(state => ({
        ...state,
        logs: [...state.logs, { timestamp: Date.now(), level: 'error', message: '更新会话失败，请检查浏览器是否支持IndexedDB或刷新页面重试', details: error }]
      }));
    }
  },
  addLog: (level, message, details) =>
    set((state) => ({
      logs: [...state.logs, { timestamp: Date.now(), level, message, details }],
    })),
  setUser: (user) => set({ user }),
}));