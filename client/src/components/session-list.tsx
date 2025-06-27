import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Connection } from "@shared/schema";

interface ActiveSession {
  id: string;
  connection: Connection;
  isConnected: boolean;
}

interface SessionListProps {
  connections: Connection[];
  activeSessions: ActiveSession[];
  onConnect: (connection: Connection) => void;
  onDisconnect: (sessionId: string) => void;
  onSessionSelect: (sessionId: string) => void;
  activeSessionId: string | null;
}

export default function SessionList({ 
  connections, 
  activeSessions, 
  onConnect, 
  onDisconnect, 
  onSessionSelect,
  activeSessionId 
}: SessionListProps) {
  const { toast } = useToast();

  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("DELETE", `/api/connections/${connectionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Connection Deleted",
        description: "Connection has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete connection",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConnection = (connectionId: number) => {
    deleteConnectionMutation.mutate(connectionId);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
          Active Sessions
        </h3>
        
        {activeSessions.map((session) => (
          <div
            key={session.id}
            className={`terminal-bg rounded-lg p-3 mb-3 border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer ${
              activeSessionId === session.id ? 'border-blue-400' : ''
            }`}
            onClick={() => onSessionSelect(session.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  session.isConnected ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm font-medium text-white">
                  {session.connection.name}
                </span>
              </div>
              <button
                className="text-gray-400 hover:text-red-400 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDisconnect(session.id);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="text-xs text-gray-400">
              <div>{session.connection.hostname}:{session.connection.port}</div>
              <div>{session.connection.username}@{session.connection.hostname}</div>
            </div>
          </div>
        ))}

        <h3 className="text-xs font-semibold text-gray-400 mb-3 mt-6 uppercase tracking-wide">
          Saved Connections
        </h3>

        {connections.map((connection) => {
          const isActive = activeSessions.some(session => session.connection.id === connection.id);
          
          return (
            <div
              key={connection.id}
              className="terminal-bg rounded-lg p-3 mb-3 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-white">
                    {connection.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!isActive && (
                    <button
                      className="text-gray-400 hover:text-blue-400 text-xs"
                      onClick={() => onConnect(connection)}
                    >
                      <i className="fas fa-play"></i>
                    </button>
                  )}
                  <button
                    className="text-gray-400 hover:text-red-400 text-xs"
                    onClick={() => handleDeleteConnection(connection.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                <div>{connection.hostname}:{connection.port}</div>
                <div>{connection.username}@{connection.hostname}</div>
              </div>
            </div>
          );
        })}

        {connections.length === 0 && activeSessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-server text-2xl mb-2 opacity-50"></i>
            <p className="text-sm">No connections</p>
            <p className="text-xs mt-1">Create a connection to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
