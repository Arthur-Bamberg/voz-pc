# Validação de código — MVP-A fase 1

> **Como usar no Notion:** copie este arquivo inteiro e cole numa página nova (filha de *MVPs — IA por voz que age no computador*). O Notion converte `- [ ]` em blocos de to-do marcáveis.
>
> **Branch:** `cursor/mvp-a-fase1-core-d874` · **PR:** #1 · **Decisões:** `.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md`

**Progresso:** 0 / 31

---

## Documentação

- [ ] `README.md` — Status, comandos (`pnpm test`, `typecheck`) e API pública batem com o código atual
- [ ] `AGENTS.md` — Escopo fase 1 vs 1.1, stack e estrutura de pastas ainda corretos
- [ ] `CONTEXT.md` — Vocabulário canônico (Intent, Allowlist, Confirmação, PTT, Adapter, Sidecar) usado no código
- [ ] `.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md` — Implementação cobre D0–D30 confirmados (override D2b=C)
- [ ] `src-tauri/sidecars/README.md` — Documenta whisper.cpp + piper por target; sem binários commitados

---

## Core — domínio

- [ ] `src/domain/intent.ts` — Tipos `OpenAppIntent` e `ConfirmationResponse` alinhados ao glossário
- [ ] `src/domain/fsm.ts` — Estados: `idle`, `recording`, `recording_confirmation`, `awaiting_confirmation`
- [ ] `src/domain/messages.ts` — Mensagens PT-BR estáveis: confirmação, sucesso, cancelado, desconhecido, falha de launch

---

## Core — parser

- [ ] `src/parser/open-app.ts` — Frases PT-BR (`abrir`/`abre`/…) → `open_app` com IDs da allowlist; normalização de acentos/artigos
- [ ] `src/parser/confirmation.ts` — `sim`/`não` + aliases → `confirm` | `cancel` | `null`

---

## Core — config

- [ ] `src/config/types.ts` — Schema: allowlist por OS, hotkeys, timeout 30s, aliases, whisper model
- [ ] `src/config/load-config.ts` — Merge `config.default.json` + `config.json` do usuário; **sem** paths Windows hardcoded no core

---

## Core — ports e session

- [ ] `src/ports/index.ts` — Contratos Stt, Tts, AppLauncher, Hotkeys, AudioCapture, Timer, Clock injetáveis
- [ ] `src/session/create-session.ts` — FSM D30: PTT → STT → parse → TTS confirma → (voz/hotkey/timeout) → launch → TTS resultado → Idle
- [ ] `src/session/create-session.ts` — PTT em `awaiting_confirmation` grava sim/não (`recording_confirmation`); Enter/Esc só nesse estado
- [ ] `src/session/create-session.ts` — Timeout 30s cancela sem launch; allowlist bloqueia IDs desconhecidos

---

## Core — diagnóstico e API pública

- [ ] `src/diag/rotating-log.ts` — Log rotativo mínimo (D19 fase 1); API simples e sem telemetria
- [ ] `src/index.ts` — Re-exports da API pública; paths OS exportados dos adapters, não do core config

---

## Adapters — shared

- [ ] `adapters/shared/app-launcher.ts` — Resolve ID lógico → `command`+`args` por plataforma; spawn injetável; erros em PT-BR
- [ ] `adapters/shared/paths.ts` — Delega `getAppDataDir` para windows/linux conforme `platform`
- [ ] `adapters/shared/stt-whisper.ts` — Stub “not wired”; estrutura pronta para sidecar whisper.cpp
- [ ] `adapters/shared/tts-piper.ts` — Stub “not wired”; estrutura pronta para sidecar piper

---

## Adapters — Windows

- [ ] `adapters/windows/app-launcher.ts` — Thin wrapper com `platform: "windows"`
- [ ] `adapters/windows/paths.ts` — `%AppData%/Roaming/voz-pc` (só aqui, não no core)

---

## Adapters — Linux

- [ ] `adapters/linux/app-launcher.ts` — Thin wrapper com `platform: "linux"`
- [ ] `adapters/linux/paths.ts` — `~/.config/voz-pc` (só aqui, não no core)

---

## Tauri (shell)

- [ ] `src-tauri/src/main.rs` — Tray mínimo com menu Sair; sem janela de produto
- [ ] `src-tauri/tauri.conf.json` — Single-instance anotado; config coerente com fase 1 stub
- [ ] `src-tauri/Cargo.toml` — Deps Tauri 2 mínimas; sem cpal/hotkeys ainda (débito aceito)
- [ ] `src-tauri/build.rs` — Build script padrão Tauri

---

## Config do projeto

- [ ] `config.default.json` — 5 IDs (`chrome`, `firefox`, `files`, `terminal`, `calculator`); mappings Win+Linux; aliases PT-BR; hotkeys default
- [ ] `package.json` — Scripts `test`, `test:unit`, `test:e2e`, `typecheck`
- [ ] `tsconfig.json` — Strict; paths/imports ESM corretos

---

## Critérios transversais (marque quando revisar o conjunto)

- [ ] Nenhum Win32/SAPI/AppData hardcoded no core TypeScript
- [ ] Nenhum LLM, Electron, Playwright Tauri e2e, telemetria
- [ ] STT/TTS/FSM/parser compartilhados; divergência OS só em adapters
- [ ] Locale PT-BR nas mensagens faladas ao usuário
- [ ] Débitos conhecidos aceitos: cpal, hotkeys globais, whisper/piper reais, single-instance plugin, resolve `.desktop`/App Paths avançado

---

## Notas da validação

_(espaço livre — use para anotações por arquivo ou bloqueios)_
