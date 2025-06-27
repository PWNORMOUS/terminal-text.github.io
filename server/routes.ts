import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Client as SSHClient } from "ssh2";
import { storage } from "./storage";
import { insertConnectionSchema } from "@shared/schema";

interface SSHSession {
  id: string;
  connectionId: number;
  ssh: SSHClient;
  stream?: any;
  ws: WebSocket;
}

const activeSessions = new Map<string, SSHSession>();

export async function registerRoutes(app: Express): Promise<Server> {
  // SSH Connections API
  app.get("/api/connections", async (req, res) => {
    try {
      const connections = await storage.getConnections();
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      const connectionData = insertConnectionSchema.parse(req.body);
      const connection = await storage.createConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating connection:", error);
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  app.delete("/api/connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteConnection(id);
      if (success) {
        res.json({ message: "Connection deleted" });
      } else {
        res.status(404).json({ message: "Connection not found" });
      }
    } catch (error) {
      console.error("Error deleting connection:", error);
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for terminal communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'connect':
            await handleSSHConnect(ws, message);
            break;
          case 'input':
            handleTerminalInput(message.sessionId, message.data);
            break;
          case 'resize':
            handleTerminalResize(message.sessionId, message.cols, message.rows);
            break;
          case 'disconnect':
            handleSSHDisconnect(message.sessionId);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Clean up any sessions associated with this websocket
      for (const [sessionId, session] of activeSessions.entries()) {
        if (session.ws === ws) {
          handleSSHDisconnect(sessionId);
        }
      }
    });
  });

  async function handleSSHConnect(ws: WebSocket, message: any) {
    try {
      const connection = await storage.getConnection(message.connectionId);
      if (!connection) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Connection not found'
        }));
        return;
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ssh = new SSHClient();

      ssh.on('ready', () => {
        console.log('SSH connection established');
        storage.updateConnection(connection.id, { isActive: true });
        
        ssh.shell((err, stream) => {
          if (err) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to start shell: ' + err.message
            }));
            return;
          }

          const session: SSHSession = {
            id: sessionId,
            connectionId: connection.id,
            ssh,
            stream,
            ws
          };

          activeSessions.set(sessionId, session);

          stream.on('data', (data: Buffer) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'output',
                sessionId,
                data: data.toString()
              }));
            }
          });

          stream.on('close', () => {
            console.log('SSH stream closed');
            activeSessions.delete(sessionId);
            storage.updateConnection(connection.id, { isActive: false });
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'disconnected',
                sessionId
              }));
            }
          });

          ws.send(JSON.stringify({
            type: 'connected',
            sessionId,
            connection: {
              id: connection.id,
              name: connection.name,
              hostname: connection.hostname,
              username: connection.username
            }
          }));
        });
      });

      ssh.on('error', (err) => {
        console.error('SSH connection error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'SSH connection failed: ' + err.message
        }));
      });

      // Connect to SSH server
      const connectOptions: any = {
        host: connection.hostname,
        port: connection.port,
        username: connection.username,
      };

      if (connection.authMethod === 'password' && connection.password) {
        connectOptions.password = connection.password;
      } else if (connection.authMethod === 'key' && connection.privateKey) {
        connectOptions.privateKey = connection.privateKey;
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid authentication method or missing credentials'
        }));
        return;
      }

      ssh.connect(connectOptions);

    } catch (error) {
      console.error('SSH connect error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to establish SSH connection'
      }));
    }
  }

  function handleTerminalInput(sessionId: string, data: string) {
    const session = activeSessions.get(sessionId);
    if (session?.stream) {
      session.stream.write(data);
    }
  }

  function handleTerminalResize(sessionId: string, cols: number, rows: number) {
    const session = activeSessions.get(sessionId);
    if (session?.stream) {
      session.stream.setWindow(rows, cols);
    }
  }

  function handleSSHDisconnect(sessionId: string) {
    const session = activeSessions.get(sessionId);
    if (session) {
      if (session.stream) {
        session.stream.end();
      }
      session.ssh.end();
      storage.updateConnection(session.connectionId, { isActive: false });
      activeSessions.delete(sessionId);
    }
  }

  return httpServer;
}
