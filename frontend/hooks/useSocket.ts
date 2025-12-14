import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionStore } from '@/store/useSessionStore';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const { addOutput, userId } = useSessionStore();

    useEffect(() => {
        // Initialize socket connection
        const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

        if (!socketRef.current) {
            socketRef.current = io(socketUrl, {
                path: '/socket.io',
                withCredentials: true,
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5
            });
        }

        const socket = socketRef.current;

        const onConnect = () => {
            console.log('[Socket] Connected:', socket.id);
            if (userId) {
                // Backend expects "user:guest_..." but client just sends "guest_..."
                // The backend prepends "user:" itself in the join handler.
                // NOTE: userId in store is already "guest_kjsdhf..." or "uuid"
                console.log('[Socket] Joining room for user:', userId);
                socket.emit('join:user', userId);
            }
        };

        socket.on('connect', onConnect);

        // If already connected when userId becomes available (e.g. after session create)
        if (socket.connected && userId) {
            onConnect();
        }

        socket.on('execution:status', (data: any) => {
            // console.log('[Socket] Status:', data);
        });

        socket.on('execution:output', (data: any) => {
            if (data && data.data) {
                // Remove trailing newlines for cleaner output if desired, or keep raw
                addOutput(data.data);
            }
        });

        socket.on('execution:complete', (data: any) => {
            // addOutput(`[System] Execution completed.`); 
        });

        socket.on('execution:error', (data: any) => {
            addOutput(`[Error] ${data.error}`);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err);
        });

        return () => {
            socket.disconnect();
        };
    }, [addOutput, userId]);

    return socketRef.current;
};
