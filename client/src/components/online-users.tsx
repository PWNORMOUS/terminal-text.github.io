interface OnlineUsersProps {
  users: string[];
  currentUser: string;
}

export default function OnlineUsers({ users, currentUser }: OnlineUsersProps) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-header">
        <span>◉ ONLINE USERS ({users.length})</span>
      </div>
      
      <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
        {users.map((username) => (
          <div
            key={username}
            className={`flex items-center space-x-2 text-sm chat-message ${
              username === currentUser ? 'terminal-user' : 'terminal-text'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: 'var(--terminal-success)'}}></div>
            <span>{username}</span>
            {username === currentUser && (
              <span className="text-xs terminal-system">(you)</span>
            )}
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center py-4 terminal-system">
            <div className="text-lg mb-1 opacity-50">◯</div>
            <p className="text-xs">No users online</p>
          </div>
        )}
      </div>
    </div>
  );
}