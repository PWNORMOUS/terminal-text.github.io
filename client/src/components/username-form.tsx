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
    <div className="terminal-bg border border-gray-600 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center">
          <i className="fas fa-user mr-2 text-blue-400"></i>
          Choose Username
        </h2>
        <p className="text-sm text-gray-400">
          Enter a username to join the terminal chat
        </p>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label className="block text-xs font-medium text-gray-400 mb-1">
            Username
          </Label>
          <Input
            {...form.register("username")}
            placeholder="your_username"
            className="w-full terminal-bg border border-gray-600 rounded px-3 py-2 text-sm terminal-text placeholder-gray-500 focus:outline-none focus:border-blue-400"
            autoFocus
          />
          {form.formState.errors.username && (
            <p className="text-red-400 text-xs mt-1">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!isConnected || isJoining}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded text-sm transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-sign-in-alt mr-2"></i>
          {isJoining ? 'Joining...' : 'Join Chat'}
        </Button>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Commands available after joining:</p>
        <ul className="mt-1 space-y-1">
          <li><span className="terminal-prompt">/help</span> - Show available commands</li>
          <li><span className="terminal-prompt">/users</span> - List online users</li>
          <li><span className="terminal-prompt">/rooms</span> - List chat rooms</li>
          <li><span className="terminal-prompt">/join &lt;room&gt;</span> - Switch rooms</li>
        </ul>
      </div>
    </div>
  );
}