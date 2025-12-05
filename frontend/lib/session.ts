import api from './api';

export interface SessionStats {
  executions: number;
  debugSessions: number;
  notebooks: number;
  totalSize: number;
}

export const sessionApi = {
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
};

