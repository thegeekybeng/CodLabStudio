import api from './api';

export interface PackageInfo {
  name: string;
  version?: string;
  description?: string;
}

export interface InstallPackageRequest {
  packages: string[];
  sessionId: string;
  language?: string;
}

export const packagesApi = {
  install: async (data: InstallPackageRequest & { language: string }): Promise<{ success: boolean; output: string }> => {
    // Backend: POST /packages/install
    const response = await api.post(`/packages/install`, {
      packages: data.packages,
      language: data.language,
      // notebookId is optional, we don't strictly need it for session-based install if we have implicit session
      // But wait, the backend `install` route allows guest session via middleware.
    });
    return response.data;
  },

  search: async (language: string, query: string): Promise<PackageInfo[]> => {
    const response = await api.post('/packages/search', { language, query });
    return response.data.data;
  },

  listInstalled: async (sessionId: string, language: string): Promise<PackageInfo[]> => {
    // Backend: GET /packages/installed?language=...
    const response = await api.get(`/packages/installed`, {
      params: { language }
    });
    return response.data.data;
  },
};
