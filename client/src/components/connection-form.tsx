import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertConnectionSchema, type Connection, type InsertConnection } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ConnectionFormProps {
  onConnect: (connection: Connection) => void;
  onConnectionSaved: () => void;
  isConnecting: boolean;
}

export default function ConnectionForm({ onConnect, onConnectionSaved, isConnecting }: ConnectionFormProps) {
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
  const { toast } = useToast();

  const form = useForm<InsertConnection>({
    resolver: zodResolver(insertConnectionSchema),
    defaultValues: {
      name: "",
      hostname: "",
      port: 22,
      username: "",
      authMethod: "password",
      password: "",
      privateKey: "",
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (data: InsertConnection) => {
      const response = await apiRequest("POST", "/api/connections", data);
      return response.json();
    },
    onSuccess: (connection: Connection) => {
      toast({
        title: "Connection Saved",
        description: `Connection "${connection.name}" has been saved successfully.`,
      });
      onConnectionSaved();
      onConnect(connection);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save connection",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertConnection) => {
    const connectionData = {
      ...data,
      authMethod,
      password: authMethod === 'password' ? data.password : undefined,
      privateKey: authMethod === 'key' ? data.privateKey : undefined,
    };
    createConnectionMutation.mutate(connectionData);
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center">
        <i className="fas fa-plug mr-2 text-blue-400"></i>
        New Connection
      </h2>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label className="block text-xs font-medium text-gray-400 mb-1">
            Connection Name
          </Label>
          <Input
            {...form.register("name")}
            placeholder="My Server"
            className="w-full terminal-bg border border-gray-600 rounded px-3 py-2 text-sm terminal-text placeholder-gray-500 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <Label className="block text-xs font-medium text-gray-400 mb-1">
            Hostname/IP
          </Label>
          <Input
            {...form.register("hostname")}
            placeholder="192.168.1.100"
            className="w-full terminal-bg border border-gray-600 rounded px-3 py-2 text-sm terminal-text placeholder-gray-500 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="block text-xs font-medium text-gray-400 mb-1">
              Port
            </Label>
            <Input
              {...form.register("port", { valueAsNumber: true })}
              type="number"
              placeholder="22"
              className="w-full terminal-bg border border-gray-600 rounded px-3 py-2 text-sm terminal-text placeholder-gray-500 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <Label className="block text-xs font-medium text-gray-400 mb-1">
              Username
            </Label>
            <Input
              {...form.register("username")}
              placeholder="ubuntu"
              className="w-full terminal-bg border border-gray-600 rounded px-3 py-2 text-sm terminal-text placeholder-gray-500 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div>
          <Label className="block text-xs font-medium text-gray-400 mb-2">
            Authentication
          </Label>
          <RadioGroup 
            value={authMethod} 
            onValueChange={(value: 'password' | 'key') => setAuthMethod(value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="password" id="password" />
              <Label htmlFor="password" className="text-sm">Password</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="key" id="key" />
              <Label htmlFor="key" className="text-sm">Private Key</Label>
            </div>
          </RadioGroup>
        </div>

        {authMethod === 'password' && (
          <div>
            <Label className="block text-xs font-medium text-gray-400 mb-1">
              Password
            </Label>
            <Input
              {...form.register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full terminal-bg border border-gray-600 rounded px-3 py-2 text-sm terminal-text placeholder-gray-500 focus:outline-none focus:border-blue-400"
            />
          </div>
        )}

        {authMethod === 'key' && (
          <div>
            <Label className="block text-xs font-medium text-gray-400 mb-1">
              Private Key
            </Label>
            <Textarea
              {...form.register("privateKey")}
              rows={3}
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
              className="w-full terminal-bg border border-gray-600 rounded px-3 py-2 text-sm font-mono terminal-text placeholder-gray-500 focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={isConnecting || createConnectionMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded text-sm transition-colors duration-200 flex items-center justify-center"
        >
          <i className="fas fa-link mr-2"></i>
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      </form>
    </div>
  );
}
