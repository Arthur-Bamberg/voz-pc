# voz-pc

Agent de desktop por voz que abre apps e confirma por fala. Windows + Fedora, mínimo de adaptação de OS.

- Produto / MVPs: Notion (*MVPs — IA por voz que age no computador*)
- Para agentes: [`AGENTS.md`](./AGENTS.md)
- Glossário: [`CONTEXT.md`](./CONTEXT.md)
- Decisões MVP-A fase 1: [`.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md`](./.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md)
- Arquitetura: Clean (`domain` / `application` / `infra`) — [`docs/adr/0001-clean-architecture-layout.md`](./docs/adr/0001-clean-architecture-layout.md)

## Status

**MVP-A fase 1 — core TypeScript** em Clean Architecture (parser + FSM no domain, `createSession` na application, Win/Linux + stubs em infra, e2e mockado). Tauri 2 tray stub em `src-tauri/`.

## Comandos

```bash
pnpm install
pnpm test          # unit + e2e (ports mockados)
pnpm test:unit
pnpm test:e2e
pnpm typecheck
```

## API pública

- `createSession(deps)` — use case: PTT → STT → parse → confirmação → launch → TTS
- `parseOpenApp` / `parseConfirmation` — domain
- `loadConfig({ appDataDir })` — infra (merge default + user)
- `getAppDataDir` / launchers Win+Linux — infra

## Estrutura

```
src/domain/         # Intent, FSM, parser, ports, config types
src/application/    # createSession
src/infra/          # windows/*, linux/*, shared, mocks, config, diag
src/presentation/   # fachada TS → application
src-tauri/          # presentation nativa (tray)
tests/ + e2e/
config.default.json
```
