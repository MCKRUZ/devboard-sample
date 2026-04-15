# DevBoard

Minimal task-tracking app. Used for live demos in the Agentic SDLC Hackathon.

## Setup

Requirements: Node.js 20+

```bash
npm install
npm start
```

Open http://localhost:3000

## Run tests

```bash
npm test
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | List all tasks |
| GET | /api/tasks?status=todo | Filter by status |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/users | List all users |
| POST | /api/users | Create user |
| GET | /api/users/:id | Get user with tasks |
| DELETE | /api/users/:id | Delete user |

## What the Demo Shows

This project is intentionally imperfect. The agent demos use it to find and fix:
- Missing input validation on several endpoints
- No cascade delete when deleting users who have tasks
- No authentication on any endpoint
- No request logging middleware
- The GET /api/users/:id endpoint doesn't handle the case where the user doesn't exist
