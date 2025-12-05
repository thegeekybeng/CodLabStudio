import api from './api';

export interface Notebook {
  id: string;
  userId: string;
  title: string;
  content: string;
  language: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const notebooksApi = {
  getAll: async (): Promise<Notebook[]> => {
    const response = await api.get('/notebooks');
    return response.data.data;
  },

  getById: async (id: string): Promise<Notebook> => {
    const response = await api.get(`/notebooks/${id}`);
    return response.data.data;
  },

  create: async (data: {
    title: string;
    content: string;
    language: string;
    metadata?: Record<string, any>;
  }): Promise<Notebook> => {
    const response = await api.post('/notebooks', data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: {
      title?: string;
      content?: string;
      language?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Notebook> => {
    const response = await api.put(`/notebooks/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notebooks/${id}`);
  },
};

