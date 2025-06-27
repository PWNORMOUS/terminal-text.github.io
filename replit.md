# Terminal Chat Application

## Overview

This is a full-stack web application that provides a terminal-style chat interface. Users can join chat rooms, communicate using terminal-like commands, and interact in real-time through WebSocket connections. The interface mimics a command-line terminal experience for a unique chatting experience.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Terminal**: xterm.js for terminal emulation with WebSocket communication
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **WebSocket**: Native WebSocket server for real-time terminal communication
- **SSH Client**: ssh2 library for SSH connections
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage with option for database persistence

### Data Storage Solutions
- **Primary Database**: PostgreSQL for connection configurations and user data
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Session Storage**: In-memory Map for active SSH sessions
- **Database Provider**: Neon Database (serverless PostgreSQL)

## Key Components

### Database Schema
- **Chat Rooms Table**: Stores chat room configurations (name, description, privacy settings)
- **Chat Messages Table**: Stores all chat messages with metadata (room, user, type, timestamp)
- **Users Table**: User management (username, display name, online status, last seen)

### Chat Session Management
- Real-time chat sessions managed through WebSocket connections
- Room-based messaging with persistent message history
- Command system for user interactions (/help, /users, /rooms, /join, etc.)
- Online user tracking and status management

### Terminal-Style Interface
- Command-line inspired chat interface
- Terminal prompt styling with user@hostname format
- Monospace font and terminal color scheme
- System messages and command responses formatted like terminal output

### UI Components
- **Username Form**: Initial user authentication and joining
- **Terminal Chat**: Main chat interface with terminal styling
- **Online Users**: Real-time list of connected users
- **Rooms List**: Available chat rooms with join functionality

## Data Flow

1. **Connection Creation**: User creates SSH connection configurations through the web form
2. **Session Initiation**: WebSocket connection established, SSH session created
3. **Terminal Communication**: Bidirectional data flow between browser terminal and SSH server
4. **Session Management**: Active sessions tracked in memory with proper cleanup
5. **State Synchronization**: React Query handles client-server state synchronization

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, Radix UI primitives, shadcn/ui components
- **Terminal**: xterm.js with addons (fit, web-links)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: TanStack Query for API management

### Backend Dependencies
- **SSH Client**: ssh2 for SSH protocol implementation
- **WebSocket**: ws library for WebSocket server
- **Database**: Neon Database with Drizzle ORM
- **Validation**: Zod for runtime type checking

### Development Tools
- **TypeScript**: Full-stack type safety
- **ESLint/Prettier**: Code quality and formatting
- **Vite**: Fast development and optimized builds

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit configuration
- **Database**: PostgreSQL 16 module in Replit
- **Dev Server**: Vite dev server with HMR for frontend, tsx for backend
- **Port Configuration**: Frontend on 5000, WebSocket on same port

### Production Build
- **Frontend**: Vite production build with static asset optimization
- **Backend**: ESBuild bundling for Node.js deployment
- **Database Migrations**: Drizzle Kit for schema management
- **Environment**: Environment variables for database and configuration

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Build Process**: npm run build (Vite + ESBuild)
- **Start Command**: npm run start (production server)
- **Port Mapping**: Internal 5000 → External 80

## Changelog
```
Changelog:
- June 27, 2025. Initial setup
- June 27, 2025. Complete architectural change: Converted from SSH terminal to terminal-style chat application
  * Replaced SSH connection management with chat room system
  * Implemented real-time messaging with WebSocket communication
  * Added terminal-style command system (/help, /users, /rooms, /join, etc.)
  * Created username-based authentication and online user tracking
  * Built terminal-themed UI with monospace fonts and command-line styling
- June 27, 2025. Enhanced terminal authenticity and mobile responsiveness
  * Applied authentic terminal colors and JetBrains Mono font
  * Created realistic terminal window with titlebar and control buttons
  * Added blinking cursor animation and proper terminal styling
  * Implemented mobile-responsive layout for phone compatibility
  * Fixed message ordering and WebSocket stability issues
  * Added 5 default chat rooms (general, random, tech, gaming, help)
  * Cleared all user data for public release
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```