import api from './api';

export interface SessionStats {
  executions: number;
  debugSessions: number;
  notebooks: number;
  totalSize: number;
}

export interface CreateSessionRequest {
  language: string;
}

export interface SessionResponse {
  sessionId: string;
  userId: string;
}

export const sessionApi = {
  createSession: async (data: CreateSessionRequest): Promise<SessionResponse> => {
    const response = await api.post('/session', data);
    return response.data.data;
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/session/${sessionId}`);
    return response.data.data;
  },

  stopSession: async (sessionId: string) => {
    await api.delete(`/session/${sessionId}`);
  },

  /**
   * Download session zip file
   */
  downloadSessionZip: async (): Promise<Blob> => {
    const response = await api.get('/session/download', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get session statistics
   */
  getSessionStats: async (): Promise<SessionStats> => {
    const response = await api.get('/session/stats');
    return response.data.data;
  },

  /**
   * Get supported languages
   */
  getSupportedLanguages: async (): Promise<string[]> => {
    const response = await api.get('/session/languages');
    return response.data.data;
  },
};
