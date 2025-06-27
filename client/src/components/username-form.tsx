import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const usernameSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(20, "Username must be less than 20 characters").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
});

type UsernameFormData = z.infer<typeof usernameSchema>;

interface UsernameFormProps {
  onJoin: (username: string) => void;
  isConnected: boolean;
}

export default function UsernameForm({ onJoin, isConnected }: UsernameFormProps) {
  const [isJoining, setIsJoining] = useState(false);

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });

  const onSubmit = (data: UsernameFormData) => {
    if (!isConnected) return;
    
    setIsJoining(true);
    onJoin(data.username);
    
    // Reset joining state after a delay in case of error
    setTimeout(() => setIsJoining(false), 3000);
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <button className="terminal-button close"></button>
        <button className="terminal-button minimize"></button>
        <button className="terminal-button maximize"></button>
        <span className="terminal-title">Terminal Login - chatserver.local</span>
      </div>
      
      <div className="p-6">
        <div className="mb-6 chat-message">
          <div className="terminal-system mb-2">
            ╭─────────────────────────────────────╮
          </div>
          <div className="terminal-system mb-2">
            │     TERMINAL CHAT LOGIN PORTAL     │
          </div>
          <div className="terminal-system mb-2">
            │                                     │
          </div>
          <div className="terminal-system mb-4">
            ╰─────────────────────────────────────╯
          </div>
          <p className="text-sm terminal-text">
            <span className="terminal-prompt">$</span> Enter your username to access the chat system
          </p>
        </div>
      
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex items-center text-sm chat-message mb-2">
              <span className="terminal-user">user</span>
              <span className="terminal-text">@</span>
              <span className="terminal-prompt">chatserver</span>
              <span className="terminal-text">:</span>
              <span className="terminal-path">~</span>
              <span className="terminal-success ml-1">$</span>
              <span className="terminal-cursor ml-1">_</span>
            </div>
            <input
              {...form.register("username")}
              placeholder="enter_username_here"
              className="w-full terminal-input py-2"
              autoFocus
            />
            {form.formState.errors.username && (
              <p className="terminal-error text-xs mt-1">
                ERROR: {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isConnected || isJoining}
            className="w-full terminal-bg panel-bg px-4 py-2.5 chat-message transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: '1px solid var(--terminal-border)',
              borderRadius: '4px',
              color: 'var(--terminal-success)'
            }}
          >
            <span className="mr-2">►</span>
            {isJoining ? 'CONNECTING...' : 'CONNECT TO CHAT'}
          </button>
        </form>
      
        <div className="mt-4 text-xs terminal-system chat-message">
          <p>Commands available after joining:</p>
          <ul className="mt-1 space-y-1">
            <li><span className="terminal-command">/help</span> <span className="terminal-system">- Show available commands</span></li>
            <li><span className="terminal-command">/users</span> <span className="terminal-system">- List online users</span></li>
            <li><span className="terminal-command">/rooms</span> <span className="terminal-system">- List chat rooms</span></li>
            <li><span className="terminal-command">/join &lt;room&gt;</span> <span className="terminal-system">- Switch rooms</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}