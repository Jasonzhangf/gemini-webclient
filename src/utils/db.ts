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

interface GeminiDB extends DBSchema {
  sessions: {
    key: string;
    value: ChatSession;
    indexes: { 'by-last-updated': number };
  };
  commands: {
    key: string;
    value: UserCommand;
    indexes: { 'by-use-count': number };
  };
}

const DB_NAME = 'gemini-chat';
const DB_VERSION = 1;

let dbInstance: ReturnType<typeof openDB<GeminiDB>> | null = null;

export const openGeminiDB = async () => {
  if (!dbInstance) {
    dbInstance = openDB<GeminiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-last-updated', 'lastUpdated');
        }

        if (!db.objectStoreNames.contains('commands')) {
          const commandStore = db.createObjectStore('commands', { keyPath: 'id' });
          commandStore.createIndex('by-use-count', 'useCount');
        }
      },
    });
  }
  return dbInstance;
};

export const db = openGeminiDB();