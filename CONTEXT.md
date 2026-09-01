# Voz PC

Agent de desktop que interpreta comandos de voz e age no computador, com confirmação falada. Roda em **Windows e Fedora** com o mesmo core; âncora de produto: acessibilidade para usuária com deficiência visual.

## Language

**Comando de voz**:
Texto proveniente do STT (ou injeção de teste) após um push-to-talk — inclusive na confirmação falada e quando o texto é vazio. Falha do STT e confirmação por hotkey não produzem Comando de voz.
_Avoid_: prompt, utterance crua sem passar pelo parser, confirmação por tecla, texto inventado após falha do STT

**Intent**:
Intenção estruturada extraída do comando de voz (no MVP-A: `open_app`).
_Avoid_: ação genérica, tool call, skill

**Allowlist**:
Conjunto configurável de **IDs lógicos** de apps que o agent pode lançar. Cada ID é resolvido para o app **já presente** no OS da usuária; o agent não instala software.
_Avoid_: lista negra invertida, busca livre no sistema, path absoluto como identidade do app, instalar o app no fluxo de voz

**ID lógico**:
Nome estável na allowlist (`chrome`, `calculator`) usado no Comando de voz e na Confirmação. Não é o binário, o pacote nem o arquivo `.desktop`.
_Avoid_: command no PATH, id Flatpak, nome de pacote dnf como identidade falada

**Confirmação**:
Passo obrigatório em que a usuária aceita ou recusa a intent antes da execução.
_Avoid_: preview, dry-run

**Push-to-talk (PTT)**:
Modo de captura em que o áudio só é gravado enquanto a hotkey de gravação está ativa.
_Avoid_: always-on, wake word (fora do MVP-A)

**Adapter de OS**:
Implementação fina, em `infra`, de ports do `domain` que **precisam** divergir (`AppLauncher`, paths, autostart/packaging). STT/TTS/áudio/FSM ficam compartilhados (ports no domain; wiring em infra/shared ou Tauri).
_Avoid_: service, driver, fork do domain/application por plataforma, pasta `adapters/` na raiz

**Port**:
Interface no `domain` que isola o application de detalhes de I/O (Stt, Tts, AppLauncher, Hotkeys, AudioCapture, Timer, observação do Comando de voz).
_Avoid_: service interface espalhada em infra, contrato só em presentation

**Sidecar**:
Binário auxiliar empacotado com o app (ex.: whisper.cpp, piper), mesmo papel em Windows e Fedora.
_Avoid_: dependência instalada manualmente no PATH (fase 1)

**Diagnóstico**:
Pacote exportável (zip) com logs e config redactada para suporte (fase 1.1).
_Avoid_: telemetria, analytics
