# Voz PC

Agent de desktop que interpreta comandos de voz e age no computador, com confirmação falada. Roda em **Windows e Fedora** com o mesmo core; âncora de produto: acessibilidade para usuária com deficiência visual.

## Language

**Comando de voz**:
Texto proveniente do STT (ou injeção de teste) após um push-to-talk — inclusive na confirmação falada e quando o texto é vazio. Falha do STT e confirmação por hotkey não produzem Comando de voz.
_Avoid_: prompt, utterance crua sem passar pelo parser, confirmação por tecla, texto inventado após falha do STT

**Intent**:
Intenção estruturada extraída do comando de voz (no MVP-A: `open_app`) pelo parser ou, se o parser não fecha, por Adaptação. É o que a Confirmação apresenta à usuária.
_Avoid_: ação genérica, tool call, skill, Comando de voz

**Usuária**:
Pessoa para quem o agent age no computador; âncora de acessibilidade. Recebe Confirmação e resultado por fala; não depende de ver o Comando de voz.
_Avoid_: operador, desenvolvedor, quem lê o terminal

**Operador**:
Quem observa o Comando de voz (terminal ou Diagnóstico). Não substitui a usuária na Confirmação.
_Avoid_: usuária, admin

**Adaptação**:
Validação, pela IA, de um Comando de voz que o parser não fecha contra as opções possíveis (typos e erros de fala): comandos da Allowlist, ou aceite/recusa da Confirmação. Não executa o app e não pula a Confirmação. Sem mapeamento válido, a abertura permanece desconhecida; na Confirmação a Intent é apresentada de novo.
_Avoid_: o interpretador lançar o app, ID fora da Allowlist, pular a Confirmação, substituir o parser no caminho feliz

**Comando possível**:
Frase que o agent sabe cumprir na Allowlist (ex.: abrir Calculadora), enviada à Adaptação junto com o Comando de voz.
_Avoid_: comando de shell, qualquer app do sistema, tool rica

**Allowlist**:
Conjunto configurável de **IDs lógicos** de apps que o agent pode lançar. Cada ID é resolvido para o app **já presente** no OS da usuária; o agent não instala software.
_Avoid_: lista negra invertida, busca livre no sistema, path absoluto como identidade do app, instalar o app no fluxo de voz

**ID lógico**:
Nome estável na allowlist (`chrome`, `calculator`) usado no Comando de voz e na Confirmação. Não é o binário, o pacote nem o arquivo `.desktop`.
_Avoid_: command no PATH, id Flatpak, nome de pacote dnf como identidade falada

**Confirmação**:
Passo obrigatório em que a usuária aceita ou recusa a Intent, apresentada a ela por fala. Permanece aberto até aceite, recusa ou timeout. Sem Comando de voz (STT ou captura falhou) ou Comando de voz que não é aceite nem recusa: a Intent é apresentada de novo — não é recusa e não volta ao idle. O timeout conta desde a última apresentação da Intent.
_Avoid_: preview, dry-run, eco do STT, silêncio após fala irreconhecível, “Não entendi.” como recusa implícita

**Push-to-talk (PTT)**:
Modo de captura em que o áudio só é gravado enquanto a hotkey de gravação está ativa.
_Avoid_: always-on, wake word (fora do MVP-A)

**Adapter de OS**:
Implementação fina, em `infra`, de ports do `domain` que **precisam** divergir (`AppLauncher`, paths, autostart/packaging). STT/TTS/áudio/FSM ficam compartilhados (ports no domain; wiring em infra/shared ou Tauri).
_Avoid_: service, driver, fork do domain/application por plataforma, pasta `adapters/` na raiz

**Port**:
Interface no `domain` que isola o application de detalhes de I/O (Stt, Tts, AppLauncher, Hotkeys, AudioCapture, Timer, observação do Comando de voz, Adaptação).
_Avoid_: service interface espalhada em infra, contrato só em presentation

**Sidecar**:
Binário auxiliar empacotado com o app (ex.: whisper.cpp, piper), mesmo papel em Windows e Fedora.
_Avoid_: dependência instalada manualmente no PATH (fase 1)

**Diagnóstico**:
Pacote exportável (zip) com logs e config redactada para suporte (fase 1.1).
_Avoid_: telemetria, analytics
