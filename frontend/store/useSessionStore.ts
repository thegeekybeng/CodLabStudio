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

            addOutput: (log: string) => set((state) => {
                const newOutput = [...state.output];

                // Handle splitting by newline
                // If log contains newlines, we need to split
                // But we also need to handle the *last line* of previous output if it didn't end with a newline
                // NOTE: 'log' from execution usually comes as chunks.
                // However, our current UI renders each array item as a div. 
                // So "Line 1" is [0], "Line 2" is [1].

                // Ideally, we maintain a "buffer" but for simplicity in React state:
                // Check if the last item in 'output' is "incomplete" (doesn't end with newline?)
                // Actually, most terminal emulators just stick text together unless \n is present.
                // But here we are storing "lines".

                // Let's assume the incoming 'log' is a raw string chunk.
                // 1. Get the last line of current output.
                let lastLineIdx = newOutput.length - 1;
                let lastLine = lastLineIdx >= 0 ? newOutput[lastLineIdx] : '';

                // Problem: We strictly store "lines" for rendering, but we don't track if the last line was "finished" (\n).
                // Heuristic: If we are appending raw chunks, we should probably just effectively join and re-split?
                // Or: assume that `addOutput` is called with distinct events.
                // To support `print(.., end='')`, we should modify the stored state.

                // Let's try this:
                // If the Log string DOES NOT start with a valid new content marker (like a timestamp or prefix), 
                // we might want to append.
                // But simplified for now:
                // The issue is ASCII chars appearing on new lines. 
                // That implies `log` contains `\n`.

                // Split the incoming log by newline
                // BEWARE: "foo\nbar" -> ["foo", "bar"]
                // "foo\n" -> ["foo", ""] ?

                // Let's implement a smarter merge.
                // We will treat the Store's `output` as a list of COMPLETED lines OR pending line.
                // Actually, let's keep it simple:
                // Just use the new lines.

                // Fix for the specific issue "Formatting: ASCII characters like ^ and ~ are splitting onto new lines"
                // This suggests the backend is sending them as separate chunks without newlines, 
                // but our frontend treats every `addOutput` call as a new `div` (new line).

                // SOLUTION:
                // We should APPEND to the last line if the previous chunk didn't end with \n.
                // But we don't know if it did.
                // Safer approach: 
                // If the new log doesn't contain a newline, append it to the last line.
                // If it does, split and append.

                /*
                   Refined Logic:
                   1. Take last line from state.
                   2. Combine with new log: text = lastLine + log
                   3. Split text by '\n': lines = text.split('\n')
                   4. Replace state.output with [...output.slice(0, -1), ...lines]
                   But we have to be careful about not deleting "completed" lines if we don't have the full buffer.
                   Actually, xterm.js handles this, but here we are using a custom div renderer.
                */

                // To keep it safe and support "print(end='')":
                // We will assume that if we are receiving a chunk, it continues the stream.
                // EXCEPT if the last line was a "system" message (Start/Stop).

                // Let's try to just append to the last element if it's not a System/Debug message block?
                // No, Debug messages come line by line.

                // Let's go with the Split/Merge approach for raw output.

                if (newOutput.length === 0) {
                    // Just split and add
                    return { output: log.split(/\r?\n/) };
                }

                // Get last line
                const lastIdx = newOutput.length - 1;
                const prev = newOutput[lastIdx];

                // If previous line was a specialized system message (e.g. [System] ...), don't append to it.
                // Unless the new log is also raw text?
                if (prev.startsWith('[System]') || prev.startsWith('[Error]')) {
                    // Start new lines
                    const newLines = log.split(/\r?\n/);
                    // Filter empty trailing line from split if it's just a newline at end
                    if (newLines.length > 1 && newLines[newLines.length - 1] === '') {
                        newLines.pop();
                    }
                    return { output: [...newOutput, ...newLines] };
                }

                // Use a proper buffer approach
                const combined = prev + log;
                const lines = combined.split(/\r?\n/);

                // Check if the original log ended with newline. 
                // "foo\n".split() -> ["foo", ""]
                // "foo".split() -> ["foo"]

                // If it ends with empty string, it means the last char was newline, so the line is done.
                // We keep the empty string as a placeholder for the next line? 
                // No, UI renders empty div as nothing usually.

                // Let's replace the last line with the first part of split, and add the rest.
                newOutput[lastIdx] = lines[0];
                for (let i = 1; i < lines.length; i++) {
                    // If it's the last element and empty, it means there was a trailing newline.
                    // We can add an empty line or ignore.
                    // If we ignore, the next 'addOutput' will append to the previous line (which is what we want for buffering!)
                    // BUT, if we want to visually show a newline, we need a new line.

                    // If lines[i] is empty AND it is the last one, it implies the stream ended with \n.
                    // So we should start a new empty line for the next char to land on.
                    newOutput.push(lines[i]);
                }

                // Filter out empty lines? No, print() produces empty lines.
                // But we need to avoid indefinite growth of empty lines.
                // Actually the above logic: "foo\n" -> ["foo", ""] -> newOutput ends with "". 
                // Next addOutput("bar") -> combined = "" + "bar" = "bar" -> ["bar"] -> replaces last line.
                // This correctly simulates a buffer!

                return { output: newOutput };
            }),
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
