.PHONY: install install-frontend install-backend setup-hooks clean

install: install-frontend install-backend setup-hooks

install-frontend:
	cd frontend && bun install

install-backend:
	cd backend && uv sync

setup-hooks:
	bun run prepare

clean:
	cd frontend && rm -rf node_modules .next/
	cd backend && rm -rf .venv