# CivicPulse - Civic Engagement Platform

## Overview

CivicPulse is a comprehensive civic-tech platform that enables citizens to report local issues, vote on priorities, and connect with government officials through verified community engagement. The platform features a star-based voting system (VIS - Voter Impact Score), real-time updates via WebSocket, and separate dashboards for citizens and government officials.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket server for live updates
- **File Upload**: Multer for handling media attachments
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type-safe database operations
- **Key Tables**: users, issues, votes, comments, status_updates, user_activity, user_badges
- **Migration**: Database migrations stored in `./migrations` directory

## Key Components

### Core Features
1. **Issue Management**: Citizens can create, view, and track local issues with media attachments
2. **VIS Voting System**: 5-star voting system that calculates Voter Impact Scores
3. **Real-time Updates**: Live notifications for new issues, votes, and status changes
4. **Government Dashboard**: Dedicated interface for officials to manage and respond to issues
5. **User Profiles**: Comprehensive user management with badges and activity tracking

### Authentication & Authorization
- User verification through Aadhaar integration
- Role-based access (citizens vs government officials)
- Session-based authentication with PostgreSQL storage

### File Handling
- Media upload support (images, videos, PDFs up to 10MB)
- File validation and storage in local `uploads/` directory
- Support for issue documentation with multiple attachments

## Data Flow

### Issue Creation Flow
1. User submits issue through CreateIssueModal component
2. Server validates data and stores in PostgreSQL via Drizzle ORM
3. WebSocket broadcasts new issue to connected clients
4. Dashboard and Issues pages update in real-time

### Voting System Flow
1. Users vote on issues using VotingStars component (1-5 stars)
2. VIS score calculated based on weighted voting algorithm
3. Vote data stored with user association for preventing duplicate votes
4. Real-time vote count updates via WebSocket

### Government Response Flow
1. Officials view prioritized issues in Government dashboard
2. Status updates and comments tracked in dedicated tables
3. Citizens receive notifications of official responses
4. Issue resolution workflow with proper audit trail

## External Dependencies

### Primary Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **react-hook-form**: Form handling with validation
- **zod**: Runtime type validation and schema definition

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

### Real-time Communication
- **ws**: WebSocket library for real-time features
- **WebSocket Server**: Custom implementation for broadcasting updates

## Deployment Strategy

### Environment Configuration
- **Development**: `npm run dev` - Runs both client and server with hot reload
- **Production**: `npm run build && npm run start` - Optimized build with static serving
- **Database**: PostgreSQL with environment-based connection string

### Build Process
1. Vite builds React frontend to `dist/public`
2. ESBuild bundles Express server to `dist/index.js`
3. Static files served by Express in production
4. Database migrations applied via `npm run db:push`

### Hosting Requirements
- Node.js 20+ runtime environment
- PostgreSQL database instance
- File storage for media uploads
- WebSocket support for real-time features

### Port Configuration
- **Development**: Port 5000 (configurable via environment)
- **Production**: Supports reverse proxy setup
- **WebSocket**: Same port with `/ws` endpoint

## Changelog
- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.