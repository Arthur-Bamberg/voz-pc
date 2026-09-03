# AGENTS.md — voz-pc

Guia para agentes (Cursor) trabalhando neste repositório. Leia isto antes de implementar.

## O que é

**voz-pc**: agent de desktop por voz que age no computador. Âncora de produto: acessibilidade para usuária com deficiência visual (mãe do autor).

MVP atual: **MVP-A — “Abrir e confirmar”**  
Fluxo: PTT → STT → parse `open_app` (Adaptação se o parser não fecha) → TTS pede confirmação → parse sim/não (Adaptação se o parser não fecha) → launch → TTS resultado.

Programa maior (ordem): A → B (ler tela) → C (ditar/enviar) → D (navegar/clicar) → E (agente + tools ricas).  
Doc de produto: Notion *MVPs — IA por voz que age no computador*.

## Repo e branch

- Path local: `~/Projects/voz-pc`
- Branch default: **`main`** (não usar `master`)
- Decisões confirmadas: `.scratch/feature-loop/mvp-a-abrir-confirmar/decisions.md`
- Glossário de domínio: `CONTEXT.md`

## Fases de entrega (não misturar)

| Fase | Objetivo | Inclui | Não inclui |
|------|----------|--------|------------|
| **1** (agora) | Validar **custo** do feature-loop e se o pipeline cola | Core + FSM + ports Win+Linux + Whisper + Piper + daemon Node (`pw-record`/`pw-play`, PTT Espaço/HTTP) + Vitest. Tauri tray/cpal ainda stub | NSIS/AppImage polido, autostart, export zip, sessão mãe |
| **1.1** | Aceite humano / distribuição | Instaladores, autostart, diagnóstico zip, demo na máquina da mãe (Windows) | Escopo B/C |

**Requisito de OS:** Windows **e** Fedora obrigatórios. Fase 1 já traz adapters dos **dois** (D2b=C).

## Stack confirmada

| Camada | Escolha |
|--------|---------|
| Core | TypeScript |
| Shell desktop | Tauri 2, modo **tray** (sem janela de produto no A) |
| Pacotes JS | pnpm |
| Captura voz | Push-to-talk (não always-on / wake word) |
| STT | whisper.cpp (sidecar), modelo inicial `base`, config trocável |
| TTS | **Piper** local (mesmo motor Win+Linux) — **não** SAPI |
| Intent | Parser determinístico + aliases; **Adaptação** (Gemini) só se o parser não fecha |
| Launch | Allowlist de **IDs lógicos** → resolver por OS → spawn |
| Config | JSON em dir de dados do app (`dirs`: Win AppData / Linux `~/.config/voz-pc`) + `config.default.json` no repo |
| Áudio | `cpal` no Rust do Tauri |
| Testes | Vitest unit + e2e com ports **mockados** (sem Whisper/Piper/LLM reais no CI) |
| Locale | PT-BR only |
| Instância | Single-instance |
| Hotkeys default | PTT `Ctrl+Shift+Space`; confirmar `Enter`; cancelar `Esc` (**só** no estado “aguardando confirmação”) |

## Arquitetura (Clean — alinhada ao orquestrador)

```
┌─────────────────────────────────────────────┐
│  domain: Intent, FSM, parser, ports, config │
│  application: createSession (use case)      │
└──────────────────┬──────────────────────────┘
                   │ ports (domain)
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
  infra/shared   infra/shared  infra/windows|linux
  (Whisper)      (Piper)       (AppLauncher, paths)
     ▲             ▲
     └──── src-tauri (presentation nativa: cpal + hotkeys) ────┘
```

### Dependency rule

- `presentation` → `application` → `domain`
- `infra` implementa interfaces definidas em `domain`
- `domain` nunca importa `infra`, `application` ou `presentation`
- `application` depende só de tipos/ports do `domain`

**Regra de ouro (OS):** só pode divergir entre OS em `infra/windows` e `infra/linux`:
- `AppLauncher` (resolve ID → path/desktop + spawn)
- helpers de path / autostart / packaging (1.1)

STT, TTS, áudio, FSM, parser = **shared**. Zero Win32/SAPI em `domain`/`application`.

ADR: `docs/adr/0001-clean-architecture-layout.md`

### Allowlist inicial (IDs lógicos)

`chrome`, `firefox`, `files`, `terminal`, `calculator` — mapeados por OS na config.  
Apps da mãe (WhatsApp etc.) entram na fase 1.1 se necessário.

### FSM canônica

`Idle → PTT → STT → parse open_app (Adaptação se o parser não fecha) → TTS confirma → parse sim/não (Adaptação se o parser não fecha) → launch → TTS resultado → Idle`

Confirmação: híbrido fala (`sim`/`não` + aliases; Adaptação para typo) **e** hotkeys.

## Estrutura do código

```
voz-pc/
├── AGENTS.md
├── CONTEXT.md
├── docs/adr/
├── package.json
├── src/
│   ├── domain/          # entidades, parser, config types, ports
│   ├── application/     # use cases (createSession)
│   ├── infra/           # windows/*, linux/*, shared, mocks, config loader, diag
│   ├── presentation/    # fachada TS → application (shell nativo em src-tauri)
│   └── index.ts         # API pública
├── src-tauri/           # Tauri 2 tray + cpal/hotkeys/single-instance
│   └── sidecars/        # whisper.cpp, piper (por target)
├── tests/               # espelha domain | application | infra
├── e2e/
├── config.default.json
└── .scratch/feature-loop/…
```

## Pipeline de trabalho (feature-loop)

1. Decisões (Grok) → `decisions.md` — **já feito para MVP-A fase 1**
2. Confirmação humana — **já feita**
3. TDD + impl (**Composer 2.5**)
4. Review standards+spec (Grok)
5. Suite local (format/lint/typecheck/unit)
6. E2E local **sem IA**
7. Caminho feliz manual (fase 1: você nos dois OS; fase 1.1: mãe no Windows)

Preferir pool First-party (Composer / Grok). E2E sem chamar LLM real.

Skills versionadas em `.cursor/skills/` (Cloud Agent e local): `feature-loop`, `plan-feature-loop`, `tdd`, `review`, `grill-with-docs`. Invocar com `/feature-loop` ou `/plan-feature-loop`.

## Glossário (resumo)

Ver `CONTEXT.md`. Termos canônicos: **Comando de voz**, **Intent**, **Adaptação**, **Allowlist** (IDs lógicos), **Confirmação**, **PTT**, **Adapter de OS**, **Sidecar**, **Diagnóstico**.

## O que NÃO fazer neste repo (MVP-A fase 1)

- LLM / agent tools ricas (MVP-E). **Exceção:** Adaptação Gemini só quando o parser não fecha Intent ou aceite/recusa (ADR 0002)
- Wake word / always-on
- OCR / a11y tree (MVP-B)
- Ditar e enviar (MVP-C)
- SAPI / speech APIs do OS como TTS principal
- Electron
- Telemetria cloud
- Playwright em UI Tauri como e2e principal
- Hardcodar `%AppData%` ou paths Windows em `domain` / `application`
- Commitar secrets, modelos Whisper/Piper grandes (preferir download 1ª run / LFS policy depois)

## Critérios de sucesso (fase 1)

- 1 caminho feliz e2e local verde **sem** STT/TTS/LLM reais (mocks)
- Smoke real: `pnpm start` → PTT → Whisper → parse → Piper → confirm → launch no **Fedora** (Windows smoke quando o adapter de áudio nativo existir)
- Superfície OS limitada aos adapters acima

## Notion

Página de produto/MVPs no workspace Personal (*MVPs — IA por voz que age no computador*), filha de *Ideias de Projetos*. Manter decisões fechadas alinhadas a este arquivo e a `decisions.md`.
