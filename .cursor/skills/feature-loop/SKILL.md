---
name: feature-loop
description: Pipeline completo de feature — decisões em lote (lista em markdown com opções + recomendação, depois revisão global), confirmação, TDD unitário, implementação, review, testes locais, e2e e guia do caminho feliz. Use quando o usuário pedir feature-loop, /feature-loop, ou o fluxo decisões→TDD→review→e2e.
disable-model-invocation: true
---

# Feature Loop

Pipeline sequencial para entregar uma feature com decisões documentadas, TDD e verificação ponta a ponta.

**Não** use o modo entrevista uma-a-uma do `grill-with-docs`. Aqui o grill é em lote: pensar → listar em markdown → repensar o conjunto → confirmar.

Só plano e definições (Fases 0–2), sem implementar: use `plan-feature-loop`.

Skills / refs (ler quando a fase exigir — paths do repo, funcionam no Cloud Agent):

- Plano isolado: `.cursor/skills/plan-feature-loop/SKILL.md`
- Domínio / formatos: `.cursor/skills/grill-with-docs/` (`CONTEXT-FORMAT.md`, `ADR-FORMAT.md`)
- `tdd` — `.cursor/skills/tdd/SKILL.md`
- `review` — `.cursor/skills/review/SKILL.md`

## Regras transversais

### Sempre seguir a recomendação

Em cada decisão: declare opções, marque a **recomendação**, e **aplique-a** salvo override explícito do usuário. Não deixe decisão empatada entre opções.

### Loop de correção (progresso vs stuck)

Ao encontrar um problema (review, unit, local, e2e ou outro):

1. Registre o bug (assinatura curta + fase).
2. Tente corrigir **uma vez**.
3. Reexecute a verificação que falhou.
4. **Mesma assinatura** após a correção → **pare**, reporte o bug, o que tentou e o estado atual. Não continue o pipeline.
5. **Assinatura diferente** (novo problema) → progresso: corrija o novo, continue o mesmo loop.
6. Só avance de fase quando a verificação atual estiver verde (ou o usuário autorizar seguir com débito explícito).

Assinatura = mensagem/erro estável + arquivo/teste/check que falhou (não o número da linha sozinho).

### Diário de bugs

Mantenha um diário durante toda a sessão. No fim (ou na parada), entregue a tabela:

```markdown
| # | Bug | Fase | Status | Notas |
|---|-----|------|--------|-------|
| 1 | … | unit / e2e / review / local / outro | resolvido / bloqueado | … |
```

Fases válidas: `decisions`, `unit`, `impl`, `review`, `local`, `e2e`, `outro` (nomear o outro).

---

## Fase 0 — Escopo

Confirme em uma frase o que será construído e em qual repo/pasta. Se o workspace não for o projeto certo, mova o agent para a raiz do projeto antes de editar código.

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
- Vocabulário alinhado ao `CONTEXT.md`; se houver conflito de termo, resolva na lista (recomendando o canônico).

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

- Atualizar `CONTEXT.md` com termos **já resolvidos** na lista (formato em `CONTEXT-FORMAT.md`)
- Oferecer ADR só se for hard-to-reverse + surpreendente + trade-off real (`ADR-FORMAT.md`)

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

Só então vá para a Fase 3. A implementação segue as recomendações confirmadas.

---

## Fase 3 — TDD unitário → implementação

Siga `tdd`:

1. Planeje comportamentos e interface pública; alinhe com `CONTEXT.md` / ADRs / `decisions.md`.
2. **Vertical slices**: um teste → implementação mínima → próximo. Proibido escrever todos os testes e depois toda a impl.
3. RED → GREEN; refactor só em GREEN.
4. Testes de comportamento via interface pública (não detalhes internos).

Aplique o **loop de correção** se um teste ou implementação emperrar no mesmo erro.

---

## Fase 4 — Revisão de código

Revise o diff da feature (base combinada com o usuário, default `main`):

- Eixos: **Standards** (convenções do repo) e **Spec** (`decisions.md` confirmado + comportamentos acordados).
- Preferir a skill `review` quando houver ponto fixo e spec; senão, revisão direta equivalente.

Para cada achado acionável: corrija seguindo o **loop de correção**. Achados cosméticos opcionais: listar, não bloquear.

---

## Fase 5 — Testar tudo local

Na raiz do projeto, rode o que o repo já usa (detectar scripts/docs; não inventar stack):

- format / lint
- typecheck
- testes unitários / suite de CI local

Corrija falhas com o **loop de correção**. Só avance com suite local verde.

---

## Fase 6 — Testes e2e

1. Descubra a stack e2e do repo (Playwright, Cypress, etc.) e os padrões existentes.
2. Cubra o **caminho feliz** da feature acordada (e só edge cases críticos se já fizerem parte do escopo).
3. Escreva e rode os e2e; corrija com o **loop de correção**.

Se o projeto não tiver e2e: proponha o mínimo viável no padrão mais próximo do repo, confirme com o usuário, então implemente.

---

## Fase 7 — Caminho feliz manual

Explique o passo a passo para o usuário validar na mão:

```markdown
## Caminho feliz (manual)

Pré-requisitos: …

1. …
2. …
3. …

Resultado esperado: …
```

Seja concreto (URLs, comandos, dados de exemplo). Um caminho feliz claro.

---

## Entrega final

Ao concluir (ou ao parar por erro repetido), entregue nesta ordem:

1. Status do pipeline (qual fase terminou / onde parou).
2. Caminho de `decisions.md` (se existir).
3. Tabela de bugs (diário).
4. Caminho feliz manual (se chegou na Fase 7).
5. Próximo passo sugerido só se bloqueado.

Não faça commit/PR a menos que o usuário peça.
