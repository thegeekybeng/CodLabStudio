import api from './api';

export interface GitStatus {
  branch: string;
  changes: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export const gitApi = {
  init: async (notebookId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/git/init', { notebookId });
    return response.data.data;
  },

  commit: async (notebookId: string, message: string): Promise<{ success: boolean; commitHash: string }> => {
    const response = await api.post('/git/commit', { notebookId, message });
    return response.data.data;
  },

  getStatus: async (notebookId: string): Promise<GitStatus> => {
    const response = await api.get(`/git/status/${notebookId}`);
    return response.data.data;
  },

  getLog: async (notebookId: string, limit?: number): Promise<GitCommit[]> => {
    const response = await api.get(`/git/log/${notebookId}`, {
      params: { limit },
    });
    return response.data.data;
  },

  push: async (notebookId: string, remote: string = 'origin', branch: string = 'main'): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/git/push', { notebookId, remote, branch });
    return response.data.data;
  },

  pull: async (notebookId: string, remote: string = 'origin', branch: string = 'main'): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/git/pull', { notebookId, remote, branch });
    return response.data.data;
  },
};

