"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface Participant {
  userId: string;
  email: string;
  color: string;
  cursor?: { line: number; column: number };
}

interface CollaborationIndicatorProps {
  notebookId: string;
  userId: string;
  userEmail: string;
  onParticipantsChange?: (participants: Participant[]) => void;
}

export default function CollaborationIndicator({
  notebookId,
  userId,
  userEmail,
  onParticipantsChange,
}: CollaborationIndicatorProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isCollaborating, setIsCollaborating] = useState(false);

  useEffect(() => {
    if (!notebookId || !userId) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const newSocket = io(WS_URL, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      newSocket.emit("collaboration:join", {
        notebookId,
        userId,
        email: userEmail,
      });
      setIsCollaborating(true);
    });

    newSocket.on("collaboration:session_state", (data: any) => {
      setParticipants(data.participants || []);
      if (onParticipantsChange) {
        onParticipantsChange(data.participants || []);
      }
    });

    newSocket.on("collaboration:user_joined", (data: any) => {
      setParticipants((prev) => [
        ...prev,
        {
          userId: data.userId,
          email: data.email,
          color: data.color,
        },
      ]);
    });

    newSocket.on("collaboration:user_left", (data: any) => {
      setParticipants((prev) =>
        prev.filter((p) => p.userId !== data.userId)
      );
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit("collaboration:leave", { notebookId, userId });
        newSocket.disconnect();
      }
    };
  }, [notebookId, userId, userEmail]);

  if (!isCollaborating || participants.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-blue-700">
          {participants.length} collaborator{participants.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex -space-x-2">
        {participants.slice(0, 3).map((participant) => (
          <div
            key={participant.userId}
            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: participant.color }}
            title={participant.email}
          >
            {participant.email.charAt(0).toUpperCase()}
          </div>
        ))}
        {participants.length > 3 && (
          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-xs font-medium text-white">
            +{participants.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}

