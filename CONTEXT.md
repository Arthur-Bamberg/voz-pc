# Voz PC

Agent de desktop que interpreta comandos de voz e age no computador, com confirmação falada. Roda em **Windows e Fedora** com o mesmo core; âncora de produto: acessibilidade para usuária com deficiência visual.

## Language

**Comando de voz**:
Texto proveniente do STT (ou injeção de teste) após um push-to-talk.
_Avoid_: prompt, utterance crua sem passar pelo parser

**Intent**:
Intenção estruturada extraída do comando de voz (no MVP-A: `open_app`).
_Avoid_: ação genérica, tool call, skill

**Allowlist**:
Conjunto configurável de **IDs lógicos** de apps que o agent pode lançar (resolvidos por OS).
_Avoid_: lista negra invertida, busca livre no sistema, path absoluto como identidade do app

**Confirmação**:
Passo obrigatório em que a usuária aceita ou recusa a intent antes da execução.
_Avoid_: preview, dry-run

**Push-to-talk (PTT)**:
Modo de captura em que o áudio só é gravado enquanto a hotkey de gravação está ativa.
_Avoid_: always-on, wake word (fora do MVP-A)

**Adapter de OS**:
Implementação fina de portas que **precisam** divergir (`AppLauncher`, paths, autostart/packaging). STT/TTS/áudio/FSM são compartilhados.
_Avoid_: service, driver, fork do core por plataforma

**Sidecar**:
Binário auxiliar empacotado com o app (ex.: whisper.cpp, piper), mesmo papel em Windows e Fedora.
_Avoid_: dependência instalada manualmente no PATH (fase 1)

**Diagnóstico**:
Pacote exportável (zip) com logs e config redactada para suporte (fase 1.1).
_Avoid_: telemetria, analytics
