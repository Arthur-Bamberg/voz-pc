# voz-pc

Agent de desktop por voz que abre apps e confirma por fala. Windows + Fedora, mínimo de adaptação de OS.

- Produto / MVPs: Notion (*MVPs — IA por voz que age no computador*)
- Para agentes: [`AGENTS.md`](./AGENTS.md)
- Glossário: [`CONTEXT.md`](./CONTEXT.md)
- Decisões MVP-A fase 1: [`.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md`](./.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md)
- Arquitetura: Clean (`domain` / `application` / `infra`) — [`docs/adr/0001-clean-architecture-layout.md`](./docs/adr/0001-clean-architecture-layout.md)

## Status

**MVP-A fase 1 — loop de voz no Fedora.** Parser + FSM + ports Win/Linux, Whisper.cpp + Piper (download na 1ª run), captura `pw-record` / playback `pw-play`, daemon `pnpm start` (PTT por Espaço ou HTTP). Se o parser não fecha, Gemini valida o Comando de voz contra a allowlist ou contra sim/não. Tauri tray continua stub; cpal entra quando o shell nativo for ligado (D26).

## Comandos

```bash
pnpm install
pnpm test          # unit + e2e (ports mockados)
pnpm test:unit
pnpm test:e2e
pnpm typecheck
pnpm sidecars:ensure   # baixa Whisper + Piper + modelos (~200 MB) para ~/.config/voz-pc
pnpm start             # daemon: voz → abrir app da allowlist → confirmação falada
# cp .env.example .env   # GEMINI_API_KEY para validar erros de fala do Whisper
```

## API pública

- `bootSession(deps)` / `createSession(deps)` — PTT → STT → parse → confirmação → launch → TTS
- `parseOpenApp` / `parseConfirmation` — domain
- `loadConfig({ appDataDir })` — infra (merge default + user)
- `ensureSidecars(deps)` — download Whisper/Piper na 1ª run
- `getAppDataDir` / launchers Win+Linux — infra

## Estrutura

```
src/domain/         # Intent, FSM, parser, ports, config types
src/application/    # createSession, bootSession
src/infra/          # windows/*, linux/*, shared, mocks, config, diag
src/presentation/   # daemon Node (`pnpm start`) + fachada TS
src-tauri/          # tray stub (hotkeys/cpal nativos na fase do shell)
tests/ + e2e/
config.default.json
```

## Caminho feliz (manual)

1. `pnpm install && pnpm sidecars:ensure` (só na 1ª vez; ~200 MB). Opcional: copie `.env.example` para `.env` e coloque a `GEMINI_API_KEY` para adaptar “Abrei o calculador.” → Calculadora.
2. `pnpm start` — Piper fala “Voz PC pronto.”
3. Aperte **Espaço**, diga **“abrir calculadora”**, Espaço de novo.
4. Ouça “Quer abrir Calculadora?” — **Enter** ou fale **“sim”**.
5. A calculadora abre; Piper fala “Abrindo Calculadora.”

Atalho GNOME (Wayland): Configurações → Teclado → atalho personalizado `Ctrl+Shift+Space` → `curl -s -X POST http://127.0.0.1:9847/ptt/toggle`.

