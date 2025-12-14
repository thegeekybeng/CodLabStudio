import api from './api';

export interface StartDebugRequest {
  code: string;
  language: string;
  breakpoints: number[];
  sessionId: string;
}

export interface DebugResponse {
  sessionId: string; // Internal Debug Session ID possibly, or just reuse Session ID
}

export const debugApi = {
  startDebugSession: async (data: StartDebugRequest): Promise<DebugResponse> => {
    // Backend: POST /debug/start
    const response = await api.post(`/debug/start`, {
      code: data.code,
      language: data.language,
      breakpoints: data.breakpoints || [],
      // Session ID is inferred via middleware or passed explicitly if guest?
      // Backend debug route: checks for auth or guest cookie.
      // But we are in a persistent session.
      // The backend `start` route expects NO session ID in body, it gets user from context.
      // HOWEVER, `frontend` has `sessionId` from `useSessionStore`.
      // The backend route implementation: `userId = ...` then `debugService.startDebugSession`.
      // It DOES NOT take `sessionId` in the body.
      // Wait, if I am a guest, how does it know which session I am?
      // `guestSessionMiddleware` reads the cookie.
      // So we just need to send code/lang.
      // BUT, `useSessionStore` has `sessionId`.
      // If we are strictly following the backend:
      // POST /debug/start with body { code, language, ... }
    });
    return response.data.data;
  },

  stopDebugSession: async (sessionId: string) => {
    await api.post(`/debug/${sessionId}/stop`);
  },

  stepOver: async (sessionId: string) => {
    await api.post(`/debug/${sessionId}/command`, { type: 'step_over' });
  },

  stepInto: async (sessionId: string) => {
    await api.post(`/debug/${sessionId}/command`, { type: 'step_into' });
  },

  stepOut: async (sessionId: string) => {
    await api.post(`/debug/${sessionId}/command`, { type: 'step_out' });
  },

  continue: async (sessionId: string) => {
    await api.post(`/debug/${sessionId}/command`, { type: 'continue' });
  },

  evaluate: async (sessionId: string, expression: string) => {
    const response = await api.post(`/debug/${sessionId}/command`, {
      type: 'evaluate',
      expression
    });
    return response.data;
  }
};
