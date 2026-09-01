# Sidecars (Whisper + Piper)

Binários auxiliares empacotados por target (Windows / Linux):

| Sidecar | Papel |
|---------|-------|
| `whisper.cpp` | STT local (modelo inicial `base`, trocável via config) |
| `piper` | TTS local PT-BR (mesmo motor nos dois OS) |

## Fase 1

- **Não commitar** modelos grandes (`.gguf`, `.onnx`) nem binários compilados.
- Download na 1ª execução ou via CI do target (ver D28 em `decisions.md`).
- Infra TypeScript: `src/infra/shared/stt-whisper.ts`, `src/infra/shared/tts-piper.ts` (spawn; `pnpm sidecars:ensure` baixa para `~/.config/voz-pc`).
- Daemon: `pnpm start` — PTT Espaço ou HTTP `127.0.0.1:9847`.

## Layout esperado (por target)

```
src-tauri/sidecars/
├── README.md          # este arquivo
├── windows/
│   ├── whisper.exe
│   └── piper.exe
└── linux/
    ├── whisper
    └── piper
```

Modelos de voz e Whisper ficam no diretório de dados do app (`~/.config/voz-pc` / `%AppData%/voz-pc`).
