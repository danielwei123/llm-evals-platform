.PHONY: help up down logs migrate fe

help:
	@echo "Targets:"
	@echo "  up       - start db + backend (docker)"
	@echo "  down     - stop containers"
	@echo "  logs     - follow logs"
	@echo "  migrate  - run alembic migrations in a one-shot container"
	@echo "  fe       - start frontend in docker (optional)"

up:
	cd infra && docker compose up --build

down:
	cd infra && docker compose down

logs:
	cd infra && docker compose logs -f

migrate:
	cd infra && docker compose --profile tools run --rm migrate

fe:
	cd infra && docker compose --profile dev up frontend
