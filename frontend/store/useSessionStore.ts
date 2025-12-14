import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sessionApi } from '@/lib/session';

interface SessionState {
    sessionId: string | null;
    userId: string | null; // Added userId
    language: string | null;
    status: 'idle' | 'running' | 'installing' | 'debugging' | 'connecting' | 'restoring';
    output: string[]; // Console logs
    isOutputOpen: boolean;
    supportedLanguages: string[];

    // Actions
    createSession: (language: string) => Promise<void>;
    stopSession: () => Promise<void>;
    addOutput: (log: string) => void;
    clearOutput: () => void;
    setStatus: (status: SessionState['status']) => void;
    toggleOutput: () => void;
    fetchSupportedLanguages: () => Promise<void>;
    checkSession: () => Promise<void>;
    downloadAndStop: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            sessionId: null,
            userId: null,
            language: null,
            status: 'idle',
            output: [],
            isOutputOpen: false,
            supportedLanguages: [],

            createSession: async (language: string) => {
                set({ status: 'connecting', output: [], isOutputOpen: true });
                try {
                    // Update: response.data.data now includes userId
                    const { sessionId, userId } = await sessionApi.createSession({ language });
                    set({ sessionId, userId, language, status: 'idle' });
                    get().addOutput(`[System] Session started for ${language} (ID: ${sessionId})`);
                } catch (error) {
                    set({ status: 'idle' });
                    get().addOutput(`[System] Failed to start session: ${error}`);
                    console.error(error);
                }
            },

            stopSession: async () => {
                const { sessionId } = get();
                if (sessionId) {
                    // Optimistic update
                    set({ sessionId: null, language: null, status: 'idle' });
                    get().addOutput('[System] Session stopped');
                    try {
                        await sessionApi.stopSession(sessionId);
                    } catch (error) {
                        console.error('Failed to stop session on backend:', error);
                    }
                }
            },

            addOutput: (log: string) => set((state) => ({ output: [...state.output, log] })),
            clearOutput: () => set({ output: [] }),
            setStatus: (status) => set({ status }),
            toggleOutput: () => set((state) => ({ isOutputOpen: !state.isOutputOpen })),

            fetchSupportedLanguages: async () => {
                try {
                    const languages = await sessionApi.getSupportedLanguages();
                    set({ supportedLanguages: languages });
                } catch (error) {
                    console.error('Failed to fetch supported languages:', error);
                    // Fallback to basic list if API fails
                    set({ supportedLanguages: ['python', 'javascript'] });
                }
            },

            checkSession: async () => {
                const { sessionId } = get();
                if (!sessionId) return;

                set({ status: 'restoring' });
                try {
                    await sessionApi.getSession(sessionId);
                    // If successful, session is valid
                    set({ status: 'idle' });
                    get().addOutput('[System] Session restored');
                } catch (error) {
                    // If 404/error, clear session
                    console.warn('Session expired or invalid:', error);
                    set({ sessionId: null, language: null, status: 'idle' });
                    get().addOutput('[System] Previous session expired');
                }
            },

            downloadAndStop: async () => {
                const { sessionId } = get();
                if (!sessionId) return;

                try {
                    // 1. Trigger Download
                    const blob = await sessionApi.downloadSessionZip();

                    // Create download link programmatically
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `codlab_session_${sessionId.slice(0, 8)}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    // 2. Stop Session
                    const { stopSession } = get();
                    await stopSession();
                } catch (error) {
                    console.error('Download failed:', error);
                    get().addOutput(`[Error] Download failed: ${error}`);
                }
            }
        }),
        {
            name: 'codlab-session-storage',
            storage: createJSONStorage(() => sessionStorage), // Use Session Storage (clears on browser close)
            partialize: (state) => ({
                sessionId: state.sessionId,
                userId: state.userId,
                language: state.language
            }),
        }
    )
);
