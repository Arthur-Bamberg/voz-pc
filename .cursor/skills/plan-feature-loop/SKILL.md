---
name: plan-feature-loop
description: Planeja uma feature em lote — explora código e docs de domínio, lista decisões em markdown com opções e recomendação, revisa o conjunto e pede confirmação. Use quando o usuário pedir plano de feature, definições, /plan-feature-loop, ou só a fase de decisões do feature-loop sem implementar.
disable-model-invocation: true
---

# Feature Loop — Plano e Definições

Fases 0–2 do `feature-loop`: escopo, decisões em lote e confirmação. **Para aqui** — não implementa, não roda testes.

**Não** use o modo entrevista uma-a-uma do `grill-with-docs` nem do `grill-me`. Aqui o grill é em lote: pensar → listar em markdown → repensar o conjunto → confirmar.

**Diferença do `feature-loop` completo:** este skill entrega `decisions.md` confirmado. Para TDD → review → e2e, continue com `feature-loop` a partir da Fase 3.

Refs de domínio (ler quando precisar — paths do repo, funcionam no Cloud Agent):

- `.cursor/skills/grill-with-docs/CONTEXT-FORMAT.md`
- `.cursor/skills/grill-with-docs/ADR-FORMAT.md`

## Regra transversal

Em cada decisão: declare opções, marque a **recomendação**, e **aplique-a** salvo override explícito do usuário. Não deixe decisão empatada entre opções.

---

## Fase 0 — Escopo

Confirme em uma frase o que será construído e em qual repo/pasta. Se o workspace não for o projeto certo, mova o agent para a raiz do projeto antes de editar arquivos.

Defina um slug curto da feature (ex.: `checkout-parcial`) para os markdowns.

---

## Fase 1 — Decisões em lote (pensar → anotar → repensar)

**Proibido:** perguntar uma decisão por vez e esperar resposta entre elas.

### 1.1 Explorar

Antes de decidir, explore o que já existe:

- Código relevante
- `CONTEXT.md` / `CONTEXT-MAP.md`
- `docs/adr/` (e ADRs por contexto, se houver)

Se um fato estiver no código ou nos docs, use-o — não invente pergunta ociosa.

Durante a exploração, aplique o espírito do `grill-with-docs`:

- **Conflito de glossário:** se o pedido usa termo diferente do `CONTEXT.md`, resolva na lista (recomende o canônico).
- **Linguagem vaga:** proponha termo preciso na pergunta ou nas opções.
- **Cenários concretos:** stress-teste relações de domínio com casos que forcem fronteiras entre conceitos.
- **Código vs plano:** se o código contradiz o que seria decidido, registre como decisão explícita (manter código / mudar comportamento).

### 1.2 Pensar e anotar (passagem 1)

Percorra a árvore de design sozinho. Para cada ramo aberto, registre **uma entrada** no markdown de decisões.

Grave o arquivo (crie pastas se precisar):

`.scratch/feature-loop/<slug>/decisions.md`

Use este formato:

```markdown
# Decisões — <feature>

## Contexto
[1–3 frases do que será feito e o que já existe no domínio]

## Lista

### D1 — <título curto>
- **Pergunta:** …
- **Opções:**
  - A: …
  - B: …
  - C: … (se houver)
- **Recomendado:** A — <motivo em 1 frase>
- **Status:** proposto

### D2 — …
…
```

Regras da lista:

- Cubra dependências entre decisões (se D3 depende de D1, diga).
- Opções reais, não falsas dicotomias.
- Sempre um **Recomendado** com motivo curto.
- Vocabulário alinhado ao `CONTEXT.md`.

Ainda **não** peça confirmação do usuário neste passo.

### 1.3 Repensar o conjunto (passagem 2)

Com a lista completa, releia **tudo** de ponta a ponta e revise o mesmo arquivo:

- Contradições entre recomendações
- Lacunas (ramos esquecidos)
- Opções fracas ou redundantes
- Impacto de uma escolha nas demais

Atualize `decisions.md` no lugar (mude recomendações, una/elimine entradas, marque o que mudou).

Ao final da passagem 2, adicione:

```markdown
## Revisão global
- Data/hora da passagem 2
- O que mudou vs passagem 1 (bullets)
- Riscos remanescentes (se houver)
```

Opcional (lazy, só se couber):

- Atualizar `CONTEXT.md` com termos **já resolvidos** na lista (`CONTEXT-FORMAT.md`)
- Oferecer ADR só se for hard-to-reverse + surpreendente + trade-off real (`ADR-FORMAT.md`)

`CONTEXT.md` é glossário — sem detalhes de implementação.

---

## Fase 2 — Confirmação

Mostre o conteúdo consolidado de `decisions.md` (ou um resumo + caminho do arquivo) e peça confirmação explícita.

Template de fechamento no chat:

```markdown
## Perguntas e decisões

| # | Pergunta | Recomendado | Override do usuário |
|---|----------|-------------|---------------------|
| D1 | … | … | (vazio = aceito) |

## Escopo da implementação
- Comportamentos a cobrir (unit): …
- Fora de escopo: …
```

**Pare aqui** até o usuário confirmar ou ajustar. Aplique overrides no `decisions.md` (`Status: confirmado` / `Status: override — …`).

**Não** inicie implementação, TDD ou testes nesta skill — salvo pedido explícito do usuário para continuar com `feature-loop`.

---

## Entrega

Ao concluir (ou se o usuário interromper na confirmação):

1. Caminho de `decisions.md`
2. Tabela resumo de decisões (template da Fase 2)
3. Atualizações feitas em `CONTEXT.md` / ADRs (se houver)
4. Próximo passo sugerido: `/feature-loop` a partir da Fase 3, ou ajustes no plano

Não faça commit/PR a menos que o usuário peça.
