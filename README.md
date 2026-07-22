# voz-pc

Agent de desktop por voz que abre apps e confirma por fala. Windows + Fedora, mínimo de adaptação de OS.

- Produto / MVPs: Notion (*MVPs — IA por voz que age no computador*)
- Para agentes: [`AGENTS.md`](./AGENTS.md)
- Glossário: [`CONTEXT.md`](./CONTEXT.md)
- Decisões MVP-A fase 1: [`.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md`](./.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md)

## Status

**MVP-A fase 1 — core TypeScript implementado** (parser, config, FSM/session, ports, adapters Win/Linux, e2e mockado). Tauri 2 tray stub em `src-tauri/` (single-instance anotado na config; plugin a conectar na integração). Sidecar stubs (`stt-whisper`, `tts-piper`) e log rotativo mínimo em `src/diag/`.

## Comandos

```bash
pnpm install
pnpm test          # unit + e2e (ports mockados)
pnpm test:unit
pnpm test:e2e
pnpm typecheck
```

## API pública (core)

- `createSession(deps)` — orquestra FSM: PTT → STT → parse → confirmação → launch → TTS
- `parseOpenApp(text, aliases?)` — intent `open_app` a partir de frases PT-BR
- `parseConfirmation(text)` — `confirm` | `cancel`
- `loadConfig({ appDataDir, readFile? })` — merge `config.default.json` + user config (sem conhecimento de OS)
- `getAppDataDir(homeDir, platform)` — re-export de `adapters/shared/paths` (Win/Linux separados)
- `createWindowsAppLauncher(config)` / `createLinuxAppLauncher(config)` — resolve ID lógico → spawn

## Estrutura

```
src/           # core TypeScript (FSM, parser, ports, config)
adapters/      # windows/*, linux/*, mocks/
e2e/           # caminho feliz com ports mockados
src-tauri/     # Tauri 2 tray stub
config.default.json
```
