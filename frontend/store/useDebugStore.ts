import { create } from 'zustand';

interface DebugState {
    isActive: boolean;
    isPaused: boolean;
    currentLine: number | null;
    variables: Record<string, any>;

    setIsActive: (active: boolean) => void;
    setIsPaused: (paused: boolean) => void;
    setCurrentLine: (line: number | null) => void;
    setVariables: (vars: Record<string, any>) => void;
    reset: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
    isActive: false,
    isPaused: false,
    currentLine: null,
    variables: {},

    setIsActive: (active) => set({ isActive: active }),
    setIsPaused: (paused) => set({ isPaused: paused }),
    setCurrentLine: (line) => set({ currentLine: line }),
    setVariables: (vars) => set({ variables: vars }),
    reset: () => set({ isActive: false, isPaused: false, currentLine: null, variables: {} }),
}));
