# SSH Terminal Web Application

## Overview

This is a full-stack web application that provides a browser-based SSH terminal interface. Users can create, manage, and connect to SSH servers through a modern web interface with real-time terminal sessions powered by WebSockets.

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
- **SSH Connections Table**: Stores connection configurations (hostname, port, username, auth method, credentials)
- **Users Table**: Basic user management (username, password)
- **Authentication Methods**: Support for both password and SSH key authentication

### SSH Session Management
- Real-time SSH sessions managed through WebSocket connections
- Session lifecycle management (connect, disconnect, cleanup)
- Multi-session support with tabbed interface
- Terminal resize handling and proper cleanup

### Authentication and Authorization
- Basic user authentication system
- SSH credential management (passwords and private keys)
- Session-based authentication with Express sessions

### UI Components
- **Connection Form**: Create and configure SSH connections
- **Terminal Tabs**: Multi-session terminal interface
- **Session List**: Manage active and saved connections
- **Toast Notifications**: User feedback for operations

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
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```