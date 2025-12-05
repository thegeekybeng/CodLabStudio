import api from './api';

export interface PackageInfo {
  name: string;
  version?: string;
  description?: string;
}

export interface InstallPackageRequest {
  language: string;
  packages: string[];
  notebookId?: string;
}

export const packagesApi = {
  getSupportedLanguages: async (): Promise<string[]> => {
    const response = await api.get('/packages/languages');
    return response.data.data;
  },

  install: async (data: InstallPackageRequest): Promise<{ success: boolean; output: string }> => {
    const response = await api.post('/packages/install', data);
    return response.data.data;
  },

  search: async (language: string, query: string): Promise<PackageInfo[]> => {
    const response = await api.post('/packages/search', { language, query });
    return response.data.data;
  },

  listInstalled: async (language: string): Promise<PackageInfo[]> => {
    const response = await api.get('/packages/installed', {
      params: { language },
    });
    return response.data.data;
  },
};

