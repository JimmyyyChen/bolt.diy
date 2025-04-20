import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import type { ApiActions } from '~/types/ApiTypes';
import type { MCPConfig } from '~/lib/hooks/useMCPConfig';

export interface IChatMetadata {
  gitUrl: string;
  gitBranch?: string;
  netlifySiteId?: string;
  apiActionIds?: string[]; // IDs of API actions associated with this chat
}

const logger = createScopedLogger('ChatHistory');

// this is used at the top level and never rejects
export async function openDatabase(): Promise<IDBDatabase | undefined> {
  if (typeof indexedDB === 'undefined') {
    console.error('indexedDB is not available in this environment.');
    return undefined;
  }

  return new Promise((resolve) => {
    const request = indexedDB.open('boltHistory', 3); // Increment version to trigger upgrade

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Create chats store if it doesn't exist (for new databases or version 0)
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('chats')) {
          const store = db.createObjectStore('chats', { keyPath: 'id' });
          store.createIndex('id', 'id', { unique: true });
          store.createIndex('urlId', 'urlId', { unique: true });
        }
      }

      // Add apiActions store for version 2
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('apiActions')) {
          const apiActionsStore = db.createObjectStore('apiActions', { keyPath: 'id' });
          apiActionsStore.createIndex('id', 'id', { unique: true });
        }
      }

      // Add mcpConfig store for version 3
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('mcpConfig')) {
          db.createObjectStore('mcpConfig', { keyPath: 'id' });
        }
      }
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      resolve(undefined);
      logger.error((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getAll(db: IDBDatabase): Promise<ChatHistoryItem[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as ChatHistoryItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function setMessages(
  db: IDBDatabase,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
  metadata?: IChatMetadata,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');

    if (timestamp && isNaN(Date.parse(timestamp))) {
      reject(new Error('Invalid timestamp'));
      return;
    }

    const request = store.put({
      id,
      messages,
      urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
      metadata,
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMessages(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return (await getMessagesById(db, id)) || (await getMessagesByUrlId(db, id));
}

export async function getMessagesByUrlId(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const index = store.index('urlId');
    const request = index.get(id);

    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function getMessagesById(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteById(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.delete(id);

    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function getNextId(db: IDBDatabase): Promise<string> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAllKeys();

    request.onsuccess = () => {
      const highestId = request.result.reduce((cur, acc) => Math.max(+cur, +acc), 0);
      resolve(String(+highestId + 1));
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getUrlId(db: IDBDatabase, id: string): Promise<string> {
  const idList = await getUrlIds(db);

  if (!idList.includes(id)) {
    return id;
  } else {
    let i = 2;

    while (idList.includes(`${id}-${i}`)) {
      i++;
    }

    return `${id}-${i}`;
  }
}

async function getUrlIds(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const idList: string[] = [];

    const request = store.openCursor();

    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        idList.push(cursor.value.urlId);
        cursor.continue();
      } else {
        resolve(idList);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function forkChat(db: IDBDatabase, chatId: string, messageId: string): Promise<string> {
  const chat = await getMessages(db, chatId);

  if (!chat) {
    throw new Error('Chat not found');
  }

  // Find the index of the message to fork at
  const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

  if (messageIndex === -1) {
    throw new Error('Message not found');
  }

  // Get messages up to and including the selected message
  const messages = chat.messages.slice(0, messageIndex + 1);

  return createChatFromMessages(db, chat.description ? `${chat.description} (fork)` : 'Forked chat', messages);
}

export async function duplicateChat(db: IDBDatabase, id: string): Promise<string> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  return createChatFromMessages(db, `${chat.description || 'Chat'} (copy)`, chat.messages);
}

export async function createChatFromMessages(
  db: IDBDatabase,
  description: string,
  messages: Message[],
  metadata?: IChatMetadata,
): Promise<string> {
  const newId = await getNextId(db);
  const newUrlId = await getUrlId(db, newId); // Get a new urlId for the duplicated chat

  await setMessages(
    db,
    newId,
    messages,
    newUrlId, // Use the new urlId
    description,
    undefined, // Use the current timestamp
    metadata,
  );

  return newUrlId; // Return the urlId instead of id for navigation
}

export async function updateChatDescription(db: IDBDatabase, id: string, description: string): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!description.trim()) {
    throw new Error('Description cannot be empty');
  }

  await setMessages(db, id, chat.messages, chat.urlId, description, chat.timestamp, chat.metadata);
}

export async function updateChatMetadata(
  db: IDBDatabase,
  id: string,
  metadata: IChatMetadata | undefined,
): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  await setMessages(db, id, chat.messages, chat.urlId, chat.description, chat.timestamp, metadata);
}

// API Actions Store Functions

/**
 * Get all API actions from the API actions store
 */
export async function getAllApiActions(db: IDBDatabase): Promise<ApiActions[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('apiActions', 'readonly');
    const store = transaction.objectStore('apiActions');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as ApiActions[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get an API action by its ID
 */
export async function getApiActionById(db: IDBDatabase, id: string): Promise<ApiActions | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('apiActions', 'readonly');
    const store = transaction.objectStore('apiActions');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as ApiActions | undefined);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an API action to the store
 */
export async function saveApiAction(db: IDBDatabase, apiAction: ApiActions): Promise<string> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('apiActions', 'readwrite');
    const store = transaction.objectStore('apiActions');

    // Ensure the API action has an ID
    if (!apiAction.id) {
      apiAction.id = `api-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    const request = store.put(apiAction);

    request.onsuccess = () => resolve(apiAction.id as string);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save multiple API actions to the store
 */
export async function saveApiActions(db: IDBDatabase, apiActions: ApiActions[]): Promise<string[]> {
  const ids: string[] = [];

  for (const action of apiActions) {
    const id = await saveApiAction(db, action);
    ids.push(id);
  }

  return ids;
}

/**
 * Delete an API action by its ID
 */
export async function deleteApiActionById(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('apiActions', 'readwrite');
    const store = transaction.objectStore('apiActions');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// MCP Configuration functions

/**
 * Save MCP configuration to IndexedDB
 * @param db The IndexedDB database instance
 * @param config The MCP configuration to save
 */
export async function saveMCPConfig(db: IDBDatabase, config: MCPConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('mcpConfig', 'readwrite');
    const store = transaction.objectStore('mcpConfig');

    const configObject = {
      id: 'default', // We use a fixed ID since we only have one config
      config,
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(configObject);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get MCP configuration from IndexedDB
 * @param db The IndexedDB database instance
 * @returns The MCP configuration or null if not found
 */
export async function getMCPConfig(db: IDBDatabase): Promise<MCPConfig | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('mcpConfig', 'readonly');
    const store = transaction.objectStore('mcpConfig');
    const request = store.get('default');

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.config);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete MCP configuration from IndexedDB
 * @param db The IndexedDB database instance
 */
export async function deleteMCPConfig(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('mcpConfig', 'readwrite');
    const store = transaction.objectStore('mcpConfig');
    const request = store.delete('default');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
