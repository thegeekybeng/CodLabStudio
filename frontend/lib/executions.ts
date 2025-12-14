import api from './api';

export interface Execution {
  id: string;
  notebookId: string | null;
  userId: string;
  code: string;
  language: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  stdout: string | null;
  stderr: string | null;
  exitCode: number | null;
  executionTimeMs: number | null;
  resourceUsage: Record<string, any> | null;
  createdAt: string;
}

export interface ExecuteCodeRequest {
  code: string;
  sessionId: string;
  language: string;
  notebookId?: string;
}

export const executionsApi = {
  execute: async (data: ExecuteCodeRequest): Promise<{ executionId: string }> => {
    // Backend expects { code, language } and infers session from user/guest context
    const response = await api.post(`/executions/execute`, {
      code: data.code,
      language: data.language,
      notebookId: data.notebookId
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<Execution> => {
    const response = await api.get(`/executions/${id}`);
    return response.data.data;
  },

  getAll: async (limit?: number): Promise<Execution[]> => {
    const response = await api.get('/executions', {
      params: { limit },
    });
    return response.data.data;
  },
};
