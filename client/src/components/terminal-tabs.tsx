import type { Connection } from "@shared/schema";

interface ActiveSession {
  id: string;
  connection: Connection;
  isConnected: boolean;
}

interface TerminalTabsProps {
  sessions: ActiveSession[];
  activeSessionId: string | null;
  onTabSelect: (sessionId: string) => void;
  onTabClose: (sessionId: string) => void;
}

export default function TerminalTabs({ sessions, activeSessionId, onTabSelect, onTabClose }: TerminalTabsProps) {
  return (
    <div className="panel-bg border-b border-gray-700 px-4 py-2 flex items-center space-x-1 overflow-x-auto">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`flex items-center rounded-t-lg px-3 py-1.5 border-t border-l border-r border-gray-600 whitespace-nowrap cursor-pointer transition-colors ${
            activeSessionId === session.id 
              ? 'terminal-bg' 
              : 'panel-bg hover:bg-gray-600'
          }`}
          onClick={() => onTabSelect(session.id)}
        >
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
            session.isConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-sm text-white mr-2">{session.connection.name}</span>
          <button
            className="text-gray-400 hover:text-red-400 text-xs ml-1"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(session.id);
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
      
      {sessions.length === 0 && (
        <div className="flex items-center text-gray-500 px-3 py-1.5">
          <i className="fas fa-plus mr-2"></i>
          <span className="text-sm">No active terminals</span>
        </div>
      )}
    </div>
  );
}
