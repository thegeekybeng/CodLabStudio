import api from './api';

export interface DebugSession {
  id: string;
  notebookId: string | null;
  userId: string;
  breakpoints: number[];
  currentLine: number | null;
  variables: Record<string, any>;
  callStack: any[];
  status: 'ACTIVE' | 'PAUSED' | 'TERMINATED';
  createdAt: string;
  updatedAt: string;
}

export interface StartDebugRequest {
  code: string;
  language: string;
  breakpoints: number[];
  notebookId?: string;
}

export interface DebugCommand {
  type: 'step_over' | 'step_into' | 'step_out' | 'continue' | 'pause' | 'evaluate';
  expression?: string;
}

export const debugApi = {
  getDebuggableLanguages: async (): Promise<string[]> => {
    const response = await api.get('/debug/languages');
    return response.data.data;
  },

  startSession: async (data: StartDebugRequest): Promise<{ sessionId: string }> => {
    const response = await api.post('/debug/start', data);
    return response.data.data;
  },

  executeCommand: async (
    sessionId: string,
    command: DebugCommand
  ): Promise<void> => {
    await api.post(`/debug/${sessionId}/command`, command);
  },

  stopSession: async (sessionId: string): Promise<void> => {
    await api.post(`/debug/${sessionId}/stop`);
  },

  getSession: async (sessionId: string): Promise<DebugSession> => {
    const response = await api.get(`/debug/${sessionId}`);
    return response.data.data;
  },
};

