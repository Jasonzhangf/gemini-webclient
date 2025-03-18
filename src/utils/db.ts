import { openDB, DBSchema } from 'idb';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  images?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  lastUpdated: number;
  messages: ChatMessage[];
}

interface UserCommand {
  id: string;
  content: string;
  timestamp: number;
  useCount: number;
}

interface GeminiConfig {
  apiKey: string;
  modelName: string;
  generateConfig: {
    responseModalities: string[];
  };
}

interface User {
  username: string;
  password: string;
  createdAt: number;
}

interface GeminiDB extends DBSchema {
  sessions: {
    key: string;
    value: ChatSession;
    indexes: { 'by-last-updated': number };
  };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: { 'sessionId': string };
  };
  commands: {
    key: string;
    value: UserCommand;
    indexes: { 'by-use-count': number };
  };
  config: {
    key: string;
    value: GeminiConfig;
  };
  users: {
    key: string;
    value: User;
  };
}

const DB_NAME = 'gemini-chat';
const DB_VERSION = 3;

let dbInstance: ReturnType<typeof openDB<GeminiDB>> | null = null;

export const openGeminiDB = async () => {
  if (!dbInstance) {
    dbInstance = openDB<GeminiDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        if (oldVersion < 1) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-last-updated', 'lastUpdated');

          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('sessionId', 'sessionId');

          const commandStore = db.createObjectStore('commands', { keyPath: 'id' });
          commandStore.createIndex('by-use-count', 'useCount');
        }

        if (oldVersion < 2) {
          db.createObjectStore('config', { keyPath: 'id' });
        }

        if (oldVersion < 3) {
          db.createObjectStore('users', { keyPath: 'username' });
        }
      }
    });
  }
  return dbInstance;
};

export const db = openGeminiDB();