# AGENTS.md

## Project Overview

This project is an AI-powered web application builder that transforms natural language prompts into fully functional web applications with instant live preview.

## Project Structure

- `frontend/`: Next.js frontend application.
- `backend/`: FastAPI backend application.
- `docker/`: Docker configuration files.
- `AGENTS.md`: Project documentation.
- `LICENSE`: Project license.

## Getting Started

### Frontend
```bash
cd frontend
bun install
bun dev
```

### Backend
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

## Core Functionality

**Natural Language Prompt Input** - Users describe their desired application in a text box and click Generate to start the AI-powered code generation process.

**Claude Agent Integration** - The backend uses Claude Agent SDK with custom tools to interpret prompts, generate minimal React and Vite projects, and manage preview servers.

**Monaco Code Editor** - Generated source code is displayed in a professional Monaco-based editor with syntax highlighting, file tabs, and read-only viewing.

**Live Preview Window** - An embedded iframe displays the running application in real-time, allowing users to interact with their generated app immediately.

**Project Management** - Users can create multiple projects, switch between them, and continue refining their applications with new prompts.

## Development Tips

Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

Use `uv` for Python dependency management in backend projects for fast, reliable package installation and virtual environment management. Available commands include `uv init`, `uv add <package>`, `uv remove <package>`, and `uv run <script>`.

## TypeScript

- Only create an abstraction if it’s actually needed
- Prefer clear function/variable names over inline comments
- Avoid helper functions when a simple inline expression would suffice
- Use `knip` to remove unused code if making large changes
- The `gh` CLI is installed, use it
- Don’t use emojis


## React

- Avoid massive JSX blocks and compose smaller components
- Colocate code that changes together
- Avoid `useEffect` unless absolutely needed


## Tailwind

- Mostly use built-in values, occasionally allow dynamic values, rarely globals
- Always use v4 + global CSS file format + shadcn/ui


## Next

- Prefer fetching data in RSC (page can still be static)
- Use next/font   next/script when applicable
- next/image above the fold should have `sync` / `eager` / use `priority` sparingly
- Be mindful of serialized prop size for RSC → child components


## TypeScript

- Don’t unnecessarily add `try`/`catch`
- Don’t cast to `any`
