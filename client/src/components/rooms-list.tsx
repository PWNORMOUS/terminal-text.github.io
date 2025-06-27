import type { ChatRoom } from "@shared/schema";

interface RoomsListProps {
  rooms: ChatRoom[];
  currentRoom: string;
  onJoinRoom: (roomName: string) => void;
}

export default function RoomsList({ rooms, currentRoom, onJoinRoom }: RoomsListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sidebar-section">
        <div className="sidebar-header">
          <span># CHAT ROOMS</span>
        </div>
        
        <div className="p-3 space-y-1">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`cursor-pointer rounded px-2 py-1.5 text-sm chat-message transition-colors ${
                room.name === currentRoom 
                  ? 'terminal-prompt' 
                  : 'terminal-text hover:terminal-user'
              }`}
              onClick={() => onJoinRoom(room.name)}
              style={room.name === currentRoom ? {backgroundColor: 'rgba(86, 156, 214, 0.1)'} : {}}
            >
              <div className="flex items-center space-x-2">
                <span className="terminal-cyan">#</span>
                <span>{room.name}</span>
                {room.name === currentRoom && (
                  <span className="text-xs ml-auto terminal-success">●</span>
                )}
              </div>
              {room.description && (
                <div className="text-xs terminal-system mt-1 ml-4 opacity-80">
                  {room.description}
                </div>
              )}
            </div>
          ))}
          
          {rooms.length === 0 && (
            <div className="text-center py-4 terminal-system">
              <div className="text-lg mb-1 opacity-50">#</div>
              <p className="text-xs">No rooms available</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="sidebar-section mt-2">
        <div className="sidebar-header">
          <span>⚡ QUICK COMMANDS</span>
        </div>
        <div className="p-3 text-xs space-y-1 chat-message">
          <div><span className="terminal-command">/join general</span> <span className="terminal-system">- Join general room</span></div>
          <div><span className="terminal-command">/rooms</span> <span className="terminal-system">- List all rooms</span></div>
          <div><span className="terminal-command">/help</span> <span className="terminal-system">- Show all commands</span></div>
        </div>
      </div>
    </div>
  );
}