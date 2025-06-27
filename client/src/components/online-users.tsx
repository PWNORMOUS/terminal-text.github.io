interface OnlineUsersProps {
  users: string[];
  currentUser: string;
}

export default function OnlineUsers({ users, currentUser }: OnlineUsersProps) {
  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center">
        <i className="fas fa-users mr-2"></i>
        Online Users ({users.length})
      </h3>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {users.map((username) => (
          <div
            key={username}
            className={`flex items-center space-x-2 text-sm font-mono ${
              username === currentUser ? 'text-green-400' : 'text-gray-300'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>{username}</span>
            {username === currentUser && (
              <span className="text-xs text-gray-500">(you)</span>
            )}
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <i className="fas fa-user-slash text-lg mb-1 opacity-50"></i>
            <p className="text-xs">No users online</p>
          </div>
        )}
      </div>
    </div>
  );
}