import type { ChatRoom } from "@shared/schema";

interface RoomsListProps {
  rooms: ChatRoom[];
  currentRoom: string;
  onJoinRoom: (roomName: string) => void;
}

export default function RoomsList({ rooms, currentRoom, onJoinRoom }: RoomsListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center">
        <i className="fas fa-hashtag mr-2"></i>
        Chat Rooms
      </h3>
      
      <div className="space-y-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`cursor-pointer rounded px-3 py-2 text-sm font-mono transition-colors ${
              room.name === currentRoom 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-gray-700 text-gray-300'
            }`}
            onClick={() => onJoinRoom(room.name)}
          >
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">#</span>
              <span>{room.name}</span>
              {room.name === currentRoom && (
                <i className="fas fa-check text-xs ml-auto"></i>
              )}
            </div>
            {room.description && (
              <div className="text-xs text-gray-500 mt-1 ml-4">
                {room.description}
              </div>
            )}
          </div>
        ))}
        
        {rooms.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <i className="fas fa-comments text-lg mb-1 opacity-50"></i>
            <p className="text-xs">No rooms available</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <p className="font-medium">Quick commands:</p>
        <div className="space-y-1 font-mono">
          <div><span className="text-blue-400">/join general</span> - Join general room</div>
          <div><span className="text-blue-400">/rooms</span> - List all rooms</div>
          <div><span className="text-blue-400">/help</span> - Show all commands</div>
        </div>
      </div>
    </div>
  );
}