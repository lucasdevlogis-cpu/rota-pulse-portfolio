# Rota Pulse Baseline - interface minima do baseline oficial Fleetbase/FleetOps

POWERSHELL ?= pwsh

.PHONY: sync-upstream doctor bootstrap smoke verify-upstream seed-demo check-publication help

sync-upstream:
	@echo "=== Sync upstream mirrors ==="
	$(POWERSHELL) -NoProfile -ExecutionPolicy Bypass -File tools/sync/sync-upstream-mirror.ps1

doctor:
	@echo "=== Doctor ==="
	$(POWERSHELL) -NoProfile -ExecutionPolicy Bypass -File tools/doctor/doctor.ps1

bootstrap: doctor
	@echo "=== Bootstrap official runtime ==="
	$(POWERSHELL) -NoProfile -ExecutionPolicy Bypass -File tools/bootstrap/start-official-product.ps1 -RunDeploy

smoke:
	@echo "=== Smoke official runtime ==="
	$(POWERSHELL) -NoProfile -ExecutionPolicy Bypass -File tools/smoke/smoke-official.ps1

verify-upstream:
	@echo "=== Verify upstream mirrors ==="
	$(POWERSHELL) -NoProfile -ExecutionPolicy Bypass -File tools/sync/verify-upstream.ps1

seed-demo:
	@echo "=== Seed demo case ==="
	node tools/demo/seed-demo-case.js

check-publication:
	@echo "=== Check publication safety ==="
	$(POWERSHELL) -NoProfile -ExecutionPolicy Bypass -File tools/security/check-publication-safety.ps1

help:
	@echo ""
	@echo "Targets disponiveis:"
	@echo "  make sync-upstream"
	@echo "  make doctor"
	@echo "  make bootstrap"
	@echo "  make smoke"
	@echo "  make verify-upstream"
	@echo "  make seed-demo"
	@echo "  make check-publication"
