# Decisões — mvp-a-abrir-confirmar

## Contexto

MVP-A: voz (PTT) → abrir app da allowlist → confirmação falada → resultado. Repo `/home/arthur/Projects/voz-pc`. **Fedora e Windows são requisitos** — superfície específica de OS deve ser mínima. A **fase 1 deste plano** valida custo do feature-loop e se o pipeline cola; aceite com a mãe / instalador polido fica na fase seguinte.

## Lista

### D0 — Escopo da fase 1 (este feature-loop)
- **Pergunta:** O que entra na 1ª implementação?
- **Opções:**
  - A: Loop completo testável (parser + FSM + ports + Whisper/Piper sidecars) rodando em **pelo menos um OS real**; e2e mockado; **sem** NSIS polido, autostart, export-zip, sessão mãe
  - B: Já incluir instalador + demo na máquina da mãe
  - C: Só unit/mocks, zero áudio real
- **Recomendado:** A — mede custo Cursor + latência real STT/TTS; packaging/mãe = fase 1.1.
- **Status:** confirmado (ajuste pós-grill: validação de custo)
- **Depende de:** —

### D1 — Nome e pasta do repo
- **Pergunta:** Onde vive o projeto e qual o nome?
- **Opções:**
  - A: `~/Projects/voz-pc`
  - B: `~/Projects/agente-voz`
  - C: `~/personal/voz-pc`
- **Recomendado:** A — já criado; workspace apontado.
- **Status:** confirmado (aplicado)
- **Depende de:** —

### D2 — Plataformas (requisito)
- **Pergunta:** Qual o contrato Windows ↔ Fedora?
- **Opções:**
  - A: **Ambos obrigatórios**; mesmo core; só ports finos diferem; ordem de *entrega humana* pode priorizar um OS
  - B: Windows produto; Fedora “se der”
  - C: Dois codebases
- **Recomendado:** A — requisito explícito; meta = **mínimo de adaptações** (ver D8, D10, D16, D27).
- **Status:** confirmado (ajuste: Fedora deixou de ser “depois” aspiracional)
- **Depende de:** —

### D2b — Onde roda a fase 1 (validação de custo)
- **Pergunta:** Em qual OS você valida custo/latência primeiro?
- **Opções:**
  - A: **Fedora primeiro** (sua máquina) — Windows no mesmo desenho, smoke depois
  - B: **Windows primeiro** (VM/CI/PC da mãe) — Fedora smoke depois
  - C: **Os dois no mesmo loop** (dois adapters finos já na fase 1)
- **Recomendado:** A — você já está no Fedora; feedback diário sem depender da mãe/VM; stack compartilhada (Whisper+Piper+cpal+Tauri) faz o port Windows ser fino.
- **Status:** override — **C** (Windows + Fedora na fase 1; dois adapters finos no mesmo loop)
- **Depende de:** D0, D2

### D3 — Linguagem / runtime do core
- **Pergunta:** Em que linguagem vive a lógica?
- **Opções:**
  - A: TypeScript
  - B: Python
  - C: Rust no core
  - D: C# / .NET
- **Recomendado:** A — Composer/feature-loop; ports stubáveis; C# atrapalha Fedora.
- **Status:** confirmado (aceito no grill)
- **Depende de:** D2

### D4 — Forma do app (ambos OS)
- **Pergunta:** Como o processo mora no desktop?
- **Opções:**
  - A: Tauri 2 tray (sem janela de produto) — Windows **e** Linux
  - B: Electron tray
  - C: Daemon + tray mínimo
  - D: Só CLI
- **Recomendado:** A — um shell pros dois; instaladores (NSIS / AppImage|deb) só na fase 1.1.
- **Status:** confirmado (aceito no grill; reframed cross-OS)
- **Depende de:** D3

### D5 — Captura de voz
- **Pergunta:** PTT ou always-on?
- **Opções:**
  - A: Push-to-talk
  - B: Always-on + wake word
  - C: Always-on sem wake word
- **Recomendado:** A — igual nos dois OS; wake word depois.
- **Status:** confirmado (aceito no grill)
- **Depende de:** D4

### D6 — STT (compartilhado)
- **Pergunta:** Qual motor fala→texto?
- **Opções:**
  - A: Whisper local (whisper.cpp sidecar) — **mesmo** nos dois OS
  - B: Speech API do OS (SAPI / speech-dispatcher)
  - C: Cloud
  - D: Híbrido
- **Recomendado:** A — zero adaptação de algoritmo entre Windows/Fedora; só path do binário.
- **Status:** confirmado (aceito no grill; reforçado cross-OS)
- **Depende de:** D5

### D7 — Modelo Whisper inicial
- **Pergunta:** Qual tamanho no MVP-A?
- **Opções:**
  - A: `base`
  - B: `small`
  - C: `medium`
- **Recomendado:** A — trocável via config; PC da mãe desconhecido.
- **Status:** confirmado
- **Depende de:** D6

### D8 — TTS (compartilhado) ⚡ mudou
- **Pergunta:** Qual motor texto→fala?
- **Opções:**
  - A: Windows SAPI + TTS Linux diferente (dois stacks)
  - B: **Piper local** nos dois OS (mesmo motor; voz PT-BR empacotada)
  - C: edge-tts (rede)
  - D: Cloud
- **Recomendado:** B — **mínimo de adaptação**: um sidecar + um modelo de voz; SAPI era atalho Windows que dobrava trabalho no Fedora.
- **Status:** confirmado (revisão: sobrescreve aceite grill SAPI)
- **Depende de:** D2

### D9 — Interpretação do comando
- **Pergunta:** Como sair de texto para intent?
- **Opções:**
  - A: Parser determinístico + aliases
  - B: LLM cloud
  - C: LLM local
  - D: Híbrido rules→LLM
- **Recomendado:** A — OS-agnóstico; e2e sem LLM.
- **Status:** confirmado (aceito no grill)
- **Depende de:** D3

### D10 — Lançar app (única porta “gorda”) ⚡ mudou
- **Pergunta:** Como abrir apps com mínimo delta Win/Linux?
- **Opções:**
  - A: Allowlist de **IDs lógicos** (`chrome`, `firefox`…) → resolver por OS (Win: App Paths/`.lnk`; Linux: `.desktop`/`Exec`) → spawn
  - B: ShellExecute / Start Menu só Windows; Linux depois
  - C: Paths absolutos no código por OS
  - D: PowerShell / bash sempre
- **Recomendado:** A — uma allowlist; **só o resolver+spawn** muda (~dezenas de linhas por OS).
- **Status:** confirmado (revisão do grill)
- **Depende de:** D2, D9

### D11 — Allowlist inicial (IDs lógicos)
- **Pergunta:** Quais IDs no default da fase 1?
- **Opções:**
  - A: `chrome`, `firefox`, `files` (explorer/nautilus), `terminal`, `calculator` — mapeados por OS na config
  - B: Só `chrome` + `files`
  - C: Lista grande estilo Start Menu
- **Recomendado:** A — útil nos dois desktops; WhatsApp/notepad ficam na fase 1.1 (mãe/Windows) se precisar.
- **Status:** confirmado (ajuste: menos Win-only)
- **Depende de:** D10, D16

### D12 — Política de confirmação
- **Pergunta:** Sempre pedir sim/não antes de abrir?
- **Opções:**
  - A: Sempre
  - B: Anunciar e ir
  - C: Janela curta de cancelar
  - D: Só apps sensíveis
- **Recomendado:** A — OS-agnóstico; prepara MVP-C.
- **Status:** confirmado (aceito no grill)
- **Depende de:** D9

### D13 — Resposta à confirmação
- **Pergunta:** Como responder sim/não?
- **Opções:**
  - A: Só fala
  - B: Só hotkeys
  - C: Híbrido fala + hotkeys
- **Recomendado:** C — e2e via hotkeys; Enter/Esc **só no estado aguardando confirmação**.
- **Status:** confirmado (aceito no grill)
- **Depende de:** D5, D12

### D14 — Timeout da confirmação
- **Pergunta:** Sem resposta?
- **Opções:**
  - A: 30s → cancela + TTS
  - B: 10s
  - C: Infinito
- **Recomendado:** A
- **Status:** confirmado
- **Depende de:** D12

### D15 — Stack de testes
- **Pergunta:** Como validar sem IA real no CI?
- **Opções:**
  - A: Vitest unit + e2e com ports mockados (roda igual em Fedora/Windows)
  - B: Playwright Tauri
  - C: Só manual
  - D: Cucumber
- **Recomendado:** A — custo zero de OS no CI unitário.
- **Status:** confirmado (aceito no grill)
- **Depende de:** D3

### D16 — Config (paths portáveis) ⚡ mudou
- **Pergunta:** Onde vive a config?
- **Opções:**
  - A: JSON via **dir de dados do app** (`dirs`: Win `%AppData%/voz-pc`, Linux `~/.config/voz-pc`) + `config.default.json` no repo
  - B: Só `%AppData%` hardcoded
  - C: Embutido no binário
  - D: SQLite
- **Recomendado:** A — mesmo schema JSON; só a raiz muda (1 helper).
- **Status:** confirmado (revisão)
- **Depende de:** D4

### D17 — Instalação (fase 1.1, não fase 1)
- **Pergunta:** Como distribuir?
- **Opções:**
  - A: Fase 1 = **cargo/tauri dev** (ou bundle local); fase 1.1 = NSIS (Win) + AppImage/deb (Fedora)
  - B: NSIS já na fase 1
  - C: Portable forever
- **Recomendado:** A — alinhado a validar custo primeiro.
- **Status:** confirmado (adiado vs grill)
- **Depende de:** D0, D4

### D18 — Validação humana
- **Pergunta:** Quem valida o quê?
- **Opções:**
  - A: **Fase 1:** você no OS da D2b (custo/latência). **Fase 1.1:** mãe no Windows dela (aceite produto)
  - B: Mãe desde a fase 1
  - C: Só você, sem mãe no programa A
- **Recomendado:** A — preserva override “mãe no PC dela” no aceite, sem forçar instalador na validação de custo.
- **Status:** confirmado (reconciliado com override + D0)
- **Depende de:** D0, D2b

### D19 — Diagnóstico
- **Pergunta:** Como debugar no PC dela (fase 1.1)?
- **Opções:**
  - A: Log local + hotkey export zip (fase 1: só log rotativo)
  - B: Só log
  - C: Sentry
  - D: Só TTS
- **Recomendado:** A — export zip na 1.1; na fase 1 log basta.
- **Status:** confirmado
- **Depende de:** D18

### D20 — Ordem das fatias
- **Pergunta:** A→B→C?
- **Opções:**
  - A: A → B → C → (D) → E
  - B: A → C → B
  - C: Só A sem comprometer ordem
- **Recomendado:** A — este plano = só fatia A (fase 1 + 1.1).
- **Status:** confirmado
- **Depende de:** —

### D21 — Autostart (fase 1.1)
- **Pergunta:** Iniciar no login?
- **Opções:**
  - A: Fase 1.1: default ligado; Win Run key / Linux `~/.config/autostart/*.desktop`; desliga na config
  - B: Default desligado
  - C: Sempre forçado
- **Recomendado:** A — dois adapters finos de autostart; fora da fase 1.
- **Status:** confirmado (adiado)
- **Depende de:** D17, D18

### D22 — Gerenciador de pacotes JS
- **Pergunta:** pnpm / npm / yarn?
- **Opções:**
  - A: pnpm
  - B: npm
  - C: yarn
- **Recomendado:** A
- **Status:** confirmado
- **Depende de:** D3

### D23 — Locale
- **Pergunta:** Idiomas?
- **Opções:**
  - A: Só PT-BR
  - B: PT-BR + EN
  - C: Locale do OS
- **Recomendado:** A
- **Status:** confirmado
- **Depende de:** D9, D8

### D24 — Instância única
- **Pergunta:** Single-instance?
- **Opções:**
  - A: Sim (Tauri)
  - B: Não
- **Recomendado:** A — comportamento igual nos dois OS.
- **Status:** confirmado
- **Depende de:** D4

### D25 — Hotkeys padrão
- **Pergunta:** Defaults?
- **Opções:**
  - A: PTT `Ctrl+Shift+Space`; confirmar `Enter`; cancelar `Esc` (só no estado confirm)
  - B: `Ctrl+Alt+V` / F8 / F9
  - C: Sem defaults
- **Recomendado:** A — override JSON; validar no GNOME na fase Fedora.
- **Status:** confirmado
- **Depende de:** D5, D13, D16

### D26 — Captura de áudio
- **Pergunta:** Como gravar o mic?
- **Opções:**
  - A: `cpal` (Rust/Tauri) — funciona Win + Linux
  - B: `getUserMedia` no WebView
  - C: ffmpeg externo
- **Recomendado:** A — compartilhado; PipeWire/WASAPI por baixo do cpal.
- **Status:** confirmado
- **Depende de:** D4, D5, D6

### D27 — Portas de OS (regra de ouro) ⚡ mudou
- **Pergunta:** O que pode divergir entre Windows e Fedora?
- **Opções:**
  - A: **Só** `AppLauncher` (resolve+spawn) e helpers de path/autostart/packaging. STT/TTS/áudio/hotkeys/FSM = **shared**. Impls `windows/*` e `linux/*` desde o início do que a D2b exigir; a outra OS pode ser thin stub até o smoke.
  - B: Win32 no core; extrair depois
  - C: Framework enorme de plugins
- **Recomendado:** A — meta explícita: **mínimo de adaptações**. Com D2b=C, `windows/*` e `linux/*` de `AppLauncher` (+ path helper) nascem **juntos** na fase 1; sem stub “depois”.
- **Status:** confirmado (revisão + D2b=C)
- **Depende de:** D2, D2b, D8, D10, D16

### D28 — Sidecars (Whisper + Piper)
- **Pergunta:** Como empacotar engines?
- **Opções:**
  - A: Sidecars por target (`whisper.cpp` + `piper` + modelos); download na 1ª run se ausente
  - B: Tudo no instalador sempre
  - C: Exigir bins no PATH do sistema
- **Recomendado:** A — mesmo esquema nos dois OS; CI baixa artefatos do target.
- **Status:** confirmado
- **Depende de:** D6, D8, D7

### D29 — Onde testar o que é específico de OS
- **Pergunta:** Estratégia de verificação?
- **Opções:**
  - A: Unit/e2e mock no dia a dia (Fedora) + smoke real no OS da D2b + CI matrix Win+Linux quando houver bundle
  - B: VM Windows obrigatória todo commit
  - C: Só PC da mãe
- **Recomendado:** A
- **Status:** confirmado (revisão: sem SAPI/NSIS na fase 1)
- **Depende de:** D2b, D15

### D30 — Fluxo canônico
- **Pergunta:** FSM do caminho feliz?
- **Opções:**
  - A: Idle → PTT → STT → parse `open_app` → TTS confirma → (sim|não|timeout) → launch → TTS resultado → Idle
  - B: Launch sem confirmação
  - C: Anuncia e lança sem sim/não
- **Recomendado:** A — 100% no core; OS só nos ports.
- **Status:** confirmado
- **Depende de:** D5, D9, D12, D13, D14

## Revisão global
- Data/hora da passagem 3 (ajuste Fedora + fase custo): 2026-07-22 ~02:00 UTC-3
- O que mudou vs passagem 2:
  - **D0** nova: fase 1 = validação custo/pipeline; 1.1 = mãe/instalador
  - **D2** Fedora = requisito; **D2b** pergunta aberta onde rodar a fase 1
  - **D8** SAPI → **Piper** (stack TTS única)
  - **D10/D11** allowlist por IDs lógicos + resolver fino por OS
  - **D16** paths via `dirs` (não AppData hardcoded)
  - **D17/D18/D19/D21** adiados/particionados (fase 1 vs 1.1); mãe permanece no aceite 1.1
  - **D27/D28/D29** reforçam superfície OS mínima e sidecars compartilhados
- Riscos remanescentes:
  - Piper voz PT-BR: escolher voice id cedo (qualidade vs tamanho)
  - Resolver `.desktop` vs UWP/App Execution Aliases ainda é o ponto frágil do launcher
  - D2b=C: fase 1 precisa de ambiente Windows acessível (VM/CI/máquina) além do Fedora — senão um adapter fica só compilado, não smoke
  - Hotkeys no GNOME podem precisar de permissão “teclas de atalho”

## Confirmação do lote
- Data/hora: 2026-07-22 ~02:05 UTC-3
- Usuário confirmou o lote com override **D2b=C** (adapters Windows + Fedora na fase 1)
- Demais recomendações aceitas como estavam após passagem 3
