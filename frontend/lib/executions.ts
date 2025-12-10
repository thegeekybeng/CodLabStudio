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
  language: string;
  notebookId?: string;
}

export const executionsApi = {
  execute: async (data: ExecuteCodeRequest): Promise<{ executionId: string }> => {
    const response = await api.post('/executions/execute', data);
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

