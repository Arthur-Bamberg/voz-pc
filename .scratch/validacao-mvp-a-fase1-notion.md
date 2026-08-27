# Validação de código — MVP-A fase 1

> **Como usar no Notion:** copie este arquivo inteiro e cole numa página nova (filha de *MVPs — IA por voz que age no computador*). O Notion converte `- [ ]` em blocos de to-do marcáveis.
>
> **Branch:** `cursor/mvp-a-fase1-core-d874` · **PR:** #1 · **Decisões:** `.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md` · **ADR:** `docs/adr/0001-clean-architecture-layout.md`

**Progresso:** 0 / 31

---

## Documentação

- [ ] `README.md` — Status, comandos e API pública batem com Clean Architecture atual
- [ ] `AGENTS.md` — Camadas domain/application/infra + dependency rule
- [ ] `CONTEXT.md` — Vocabulário (Intent, Allowlist, Port, Adapter de OS…)
- [ ] `.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md` — D0–D30 ainda cobertos
- [ ] `docs/adr/0001-clean-architecture-layout.md` — Layout alinhado ao orquestrador

---

## Domain

- [ ] `src/domain/intent.ts` — Tipos `OpenAppIntent` e `ConfirmationResponse`
- [ ] `src/domain/fsm.ts` — Estados idle / recording / recording_confirmation / awaiting_confirmation
- [ ] `src/domain/messages.ts` — Mensagens PT-BR estáveis
- [ ] `src/domain/config.ts` — Schema allowlist/hotkeys/timeout/aliases
- [ ] `src/domain/ports.ts` — Contratos Stt, Tts, AppLauncher, Hotkeys, Audio, Timer, Clock
- [ ] `src/domain/parser/open-app.ts` — Frases PT-BR → `open_app`
- [ ] `src/domain/parser/confirmation.ts` — sim/não → confirm|cancel

---

## Application

- [ ] `src/application/create-session.ts` — FSM D30; PTT confirmação; timeout; allowlist

---

## Infra

- [ ] `src/infra/config/load-config.ts` — Merge default + user; sem paths OS no domain
- [ ] `src/infra/shared/app-launcher.ts` — Resolve ID → command/args; spawn injetável
- [ ] `src/infra/shared/paths.ts` — Facade Win/Linux
- [ ] `src/infra/shared/stt-whisper.ts` / `tts-piper.ts` — stubs
- [ ] `src/infra/windows/*` e `src/infra/linux/*` — AppLauncher + paths
- [ ] `src/infra/diag/rotating-log.ts` — log rotativo

---

## Presentation / shell

- [ ] `src/presentation/index.ts` — Fachada TS → application
- [ ] `src-tauri/src/main.rs` — Tray stub
- [ ] `src-tauri/tauri.conf.json` / `Cargo.toml` / `build.rs` — stub fase 1

---

## Config

- [ ] `config.default.json` — 5 IDs + mappings Win/Linux
- [ ] `package.json` / `tsconfig.json` — scripts e include `src/**`

---

## Critérios transversais

- [ ] Dependency rule: presentation → application → domain; infra implementa ports
- [ ] Nenhum Win32/AppData em domain/application
- [ ] STT/TTS/FSM/parser shared; OS só em infra/windows|linux
- [ ] Locale PT-BR nas mensagens ao usuário

---

## Notas da validação

_(espaço livre)_
