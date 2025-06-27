import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import ConnectionForm from "@/components/connection-form";
import TerminalTabs from "@/components/terminal-tabs";
import SessionList from "@/components/session-list";
import { useToast } from "@/hooks/use-toast";
import { useTerminal } from "@/hooks/use-terminal";
import type { Connection } from "@shared/schema";

interface ActiveSession {
  id: string;
  connection: Connection;
  isConnected: boolean;
}

export default function Terminal() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const { data: connections = [], refetch: refetchConnections } = useQuery({
    queryKey: ["/api/connections"],
  });

  const { socket, isConnected } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'connected':
          setActiveSessions(prev => prev.map(session => 
            session.id === message.sessionId 
              ? { ...session, isConnected: true }
              : session
          ));
          setIsConnecting(false);
          toast({
            title: "Connected",
            description: `Successfully connected to ${message.connection.hostname}`,
          });
          break;
        case 'error':
          setIsConnecting(false);
          toast({
            title: "Connection Error",
            description: message.message,
            variant: "destructive",
          });
          break;
        case 'disconnected':
          setActiveSessions(prev => prev.filter(session => session.id !== message.sessionId));
          if (activeSessionId === message.sessionId) {
            setActiveSessionId(null);
          }
          toast({
            title: "Disconnected",
            description: "SSH session ended",
          });
          break;
      }
    }
  });

  const { terminalRef } = useTerminal({
    socket,
    sessionId: activeSessionId,
    onData: (data) => {
      if (socket && activeSessionId) {
        socket.send(JSON.stringify({
          type: 'input',
          sessionId: activeSessionId,
          data
        }));
      }
    },
    onResize: (cols, rows) => {
      if (socket && activeSessionId) {
        socket.send(JSON.stringify({
          type: 'resize',
          sessionId: activeSessionId,
          cols,
          rows
        }));
      }
    }
  });

  const handleConnect = (connection: Connection) => {
    if (!socket) {
      toast({
        title: "Connection Error",
        description: "WebSocket not connected",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    const sessionId = `session_${Date.now()}`;
    
    setActiveSessions(prev => [...prev, {
      id: sessionId,
      connection,
      isConnected: false
    }]);
    
    setActiveSessionId(sessionId);

    socket.send(JSON.stringify({
      type: 'connect',
      connectionId: connection.id
    }));
  };

  const handleDisconnect = (sessionId: string) => {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'disconnect',
        sessionId
      }));
    }
    setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  const handleTabSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const activeSession = activeSessions.find(session => session.id === activeSessionId);

  return (
    <div className="h-screen bg-terminal-bg text-terminal-text overflow-hidden">
      {/* Header */}
      <header className="panel-bg border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fas fa-terminal accent-blue text-xl"></i>
          <h1 className="text-lg font-semibold text-white">SSH Terminal</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${!isConnected ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="text-sm text-gray-400">
            <span>{activeSessions.length}</span> active sessions
          </div>
        </div>
      </header>

      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="w-80 panel-bg border-r border-gray-700 flex flex-col h-full">
          <ConnectionForm 
            onConnect={handleConnect}
            onConnectionSaved={() => refetchConnections()}
            isConnecting={isConnecting}
          />
          
          <SessionList 
            connections={connections}
            activeSessions={activeSessions}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSessionSelect={handleTabSelect}
            activeSessionId={activeSessionId}
          />
        </aside>

        {/* Main Terminal Area */}
        <main className="flex-1 flex flex-col h-full">
          <TerminalTabs 
            sessions={activeSessions}
            activeSessionId={activeSessionId}
            onTabSelect={handleTabSelect}
            onTabClose={handleDisconnect}
          />

          {/* Terminal Container */}
          <div className="flex-1 relative terminal-bg">
            <div ref={terminalRef} className="w-full h-full" />

            {/* No Session Overlay */}
            {!activeSessionId && (
              <div className="absolute inset-0 terminal-bg bg-opacity-90 flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-terminal text-4xl text-gray-600 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Terminal Session</h3>
                  <p className="text-gray-500 mb-4">Connect to a server to start a terminal session</p>
                </div>
              </div>
            )}

            {/* Connecting Overlay */}
            {isConnecting && (
              <div className="absolute inset-0 terminal-bg bg-opacity-90 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Connecting...</h3>
                  <p className="text-gray-500">
                    Establishing SSH connection to {activeSession?.connection.hostname}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Footer */}
          <div className="panel-bg border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>80x24</span>
              <span>UTF-8</span>
              {activeSession && (
                <span>Connected to {activeSession.connection.hostname}</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="hover:text-blue-400 transition-colors" 
                title="Clear Terminal"
                onClick={() => {
                  // Terminal clear will be handled by the terminal hook
                }}
              >
                <i className="fas fa-broom"></i>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
