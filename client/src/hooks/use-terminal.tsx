import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";

interface UseTerminalProps {
  socket: WebSocket | null;
  sessionId: string | null;
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
}

export function useTerminal({ socket, sessionId, onData, onResize }: UseTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      theme: {
        background: '#1E1E1E',
        foreground: '#CCCCCC',
        cursor: '#CCCCCC',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#F44747',
        green: '#4EC9B0',
        yellow: '#FFCC02',
        blue: '#4FC1FF',
        magenta: '#C586C0',
        cyan: '#4ADDDF',
        white: '#CCCCCC',
        brightBlack: '#666666',
        brightRed: '#F44747',
        brightGreen: '#4EC9B0',
        brightYellow: '#FFCC02',
        brightBlue: '#4FC1FF',
        brightMagenta: '#C586C0',
        brightCyan: '#4ADDDF',
        brightWhite: '#FFFFFF',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle terminal data input
    terminal.onData((data) => {
      onData(data);
    });

    // Handle terminal resize
    terminal.onResize(({ cols, rows }) => {
      onResize(cols, rows);
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, [onData, onResize]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket || !xtermRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'output' && message.sessionId === sessionId) {
          xtermRef.current?.write(message.data);
        }
      } catch (error) {
        console.error('Failed to parse terminal message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, sessionId]);

  // Fit terminal when session changes
  useEffect(() => {
    if (fitAddonRef.current && sessionId) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 100);
    }
  }, [sessionId]);

  return {
    terminalRef,
  };
}
