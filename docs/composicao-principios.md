# Principios de Composicao — Deduzidos do Motor Fonetico e Corpus

O que o motor fonetico (`lib/motor-fonetico.js`) e os dados de corpus (88K pares de rima, 170K finais de frase, 5.600+ musicas) revelam sobre escrita de letras em portugues brasileiro.

---

## 1. A morfologia do portugues e uma maquina de rima

Os sufixos mais frequentes no corpus sao `-ar`, `-ao`, `-er`, `-or`, `-ia` — quase todos terminacoes de infinitivo ou de substantivo/adjetivo comuns. Diferente do ingles, o portugues oferece clusters enormes de palavras que rimam naturalmente. O desafio nao e *encontrar* rima, e evitar rima previsivel.

## 2. A rima perfeita e o chao, nao o teto

Dos 88K pares, 26K sao rima perfeita. Mas o que separa letra boa de letra generica e o uso intencional das outras faixas — quase-rima, eco, assonancia. Trap/rap vive de assonancia interna e polissilabica; sertanejo vive de oxitonas abertas e limpas (-ao, -or); MPB mistura tudo com sofisticacao.

## 3. A unidade real de composicao e a frase, nao a palavra

"amor/calor" qualquer um acha. A arte esta em construir finais de frase multi-palavra que rimam naturalmente: "sentir saudade" / "de verdade", "meu coracao" / "sem perdao". O indice de frases mostra que os finais que mais se repetem no corpus sao unidades semanticas completas.

## 4. Padrao de acentuacao cria o esqueleto ritmico

Versos terminados em oxitona (amor, perdao, cantar) soam abertos, dramaticos — dominam sertanejo e pagode. Paroxitonas no final (vida, saudade, destino) soam mais introspectivas — frequentes em MPB. Misturar sem intencao quebra o ritmo.

## 5. Espinha vocalica e a melodia escondida

Palavras com `espinhaVocal` similar cantam parecido mesmo sem rima de sufixo. "coracao" (o-a-ao) e "solidao" (o-i-ao) compartilham a estrutura vocalica, o que faz o encaixe melodico funcionar antes mesmo da rima bater.

## 6. Esquema rimico controla o ritmo narrativo

- **AABB** acelera — cada rima resolve rapido, sensacao de urgencia ou comedia.
- **ABAB** respira — a rima suspende e resolve, sensacao narrativa.
- **Misturar AABB e ABAB** entre secoes cria contraste dinamico (verso narrativo ABAB -> refrão martelado AABB).

## 7. Desvio de corpus = surpresa

Usar uma palavra em uma posicao de rima inesperada (nao no seu par de corpus habitual) cria frescor. O corpus permite saber o que e esperado para poder subverter. "amor/horror" surpreende porque o par habitual e "amor/calor/dor/valor".

## 8. Genero e codificado na estrategia de rima

| Genero | Estrategia dominante | Exemplos |
|---|---|---|
| Sertanejo | Oxitonas limpas, rima perfeita, vogais abertas | -ao, -or, -ar |
| Trap/Rap | Assonancia interna, rimas polissilabicas, flow | espinha vocalica > sufixo |
| MPB | Near-rhymes sofisticados, misturas de acentuacao | centenaria/calendario |
| Pagode | Pares de alta frequencia, familiaridade | atencao/perdao, amor/dor |
| Brega | Rima perfeita emocional, dramatica | fazer/prazer, historia/vitoria |

---

## Exemplo aplicado: "Vampira de Apartamento"

Letra escrita aplicando conscientemente todos os principios acima. Tema: "a sua namorada e vampira, voce esqueceu disso e quase matou ela sem querer."

### [Verso 1] — ABAB, alternando px/ox (ritmo narrativo, sertanejo-pop)

```
Domingo de manha, fui abrir a cortina          rima=-ina  (px)
Botar alho no feijao, fazer cafe com pao        rima=-ao   (ox)
Esqueci que minha gata e vampirina              rima=-ina  (px)
E o sol bateu na cara dela sem perdao            rima=-ao   (ox)
```

**Analise:**
- `cortina/vampirina` — rima perfeita, score ~305. Espinha vocalica: o-i-a / a-i-i-a (eco no -i-a).
- `pao/perdao` — par de corpus classico, frequencia altissima. Oxitonas abertas = punch dramatico no fim.
- O verso instala a cena com dois perigos (sol + alho) antes de revelar o motivo.

### [Verso 2] — AABB, tudo px (ritmo acelerado, como a correria)

```
Ela voou pro quarto escuro num segundo           rima=-undo (px)
Se enrolou no cobertor dos pes ao pescoco        rima=-oco  (px)
E eu fiquei ali, o cara mais burro do mundo      rima=-undo (px)
Com a espatula na mao e cara de moco             rima=-oco  (px)
```

**Analise:**
- `segundo/mundo` — rima perfeita, espinha vocalica e-u-o / u-o (eco vocalico forte).
- `pescoco/moco` — rima perfeita (-oco), score alto. Par inesperado, nao e cliche de corpus.
- AABB acelera o ritmo — cada rima resolve rapido, sensacao de atropelo.
- A imagem da espatula + cara de moco e o detalhe que ancora a cena.

### [Refrao] — ABAB, tudo ox (martelando vogais abertas)

```
Quase te matei de novo, meu amor                 rima=-or   (ox)
Sem querer, sem perceber, sem prestar atencao     rima=-ao   (ox)
Abri a janela e entrou o clarao do horror         rima=-or   (ox)
Minha vampira, meu eterno perdao                  rima=-ao   (ox)
```

**Analise:**
- `amor/horror` — rima perfeita (-or), score ~305. Par raro no corpus (nao e o cliche amor/calor/dor). A inversao semantica (amor->horror) espelha o tema.
- `atencao/perdao` — par de alta frequencia no corpus, aparece em Pagode, MPB, Sertanejo. Funciona porque e familiar ao ouvido.
- As tres repeticoes "sem querer, sem perceber, sem prestar" criam assonancia interna (e-e / e-e / e-a) — espinha vocalica uniforme que faz a frase cantar em uma nota so antes de abrir no "-ao".

### [Verso 3] — ABAB, tudo px (volta ao narrativo)

```
Levei ela pra jantar num italiano                 rima=-ano  (px)
Esqueci que tinha alho em tudo que e prato        rima=-ato  (px)
Ela olhou pra mim com aquele olhar insano         rima=-ano  (px)
Eu pedi desculpa e engoli meu nhoque ingrato      rima=-ato  (px)
```

**Analise:**
- `italiano/insano` — rima perfeita (-ano), score alto. Espinha vocalica i-a-i-a-o / i-a-o — eco forte nos mesmos eixos.
- `prato/ingrato` — rima perfeita (-ato) com relacao morfologica (prefixo in-). O motor marca isso no criterio de assimilacao consonantal.
- "meu nhoque ingrato" e um final de frase improvavel — desvio de corpus que cria surpresa.

### [Bridge] — ABAB, tudo px (desacelera, reflexivo)

```
Mas ela me perdoa, e centenaria                   rima=-aria (px)
Ja viu coisa pior em mil e oitocentos             rima=-entos(px)
E eu sou so mais um desastre do calendario        rima=-ario (px)
Que ela ama apesar dos meus tormentos             rima=-entos(px)
```

**Analise:**
- `centenaria/calendario` — quase-rima (-aria/-ario), score ~250. A vogal final difere (a/o) mas a rimaPerfeita e quase identica. Near-rhyme no estilo MPB — soa sofisticado.
- `oitocentos/tormentos` — rima perfeita (-entos), score ~305. Espinha vocalica oi-o-e-o / o-e-o — eco forte.
- O bridge muda de perspectiva (dela, nao dele) e o near-rhyme reflete isso — a rima "quase" encaixa como o relacionamento "quase" funciona.

### [Refrao final] — variacao que resolve a narrativa

```
Quase te matei de novo, meu amor
Sem querer, sem perceber, sem prestar atencao
Mas prometo: blackout em toda janela, por favor
Pra minha vampira, meu eterno perdao
```

**Analise:**
- `amor/favor` — rima perfeita (-or). "por favor" e o 4o final de frase mais frequente em -or no corpus (193x). Funciona como apelo genuino.
- A troca do verso 3 ("blackout em toda janela") resolve o conflito narrativo com acao concreta, nao so sentimento.

---

## Resumo: principios x aplicacao

| Principio | Onde aparece na letra |
|---|---|
| Oxitonas abertas = punch emocional | Refrao inteiro em -or/-ao |
| Paroxitonas = narrativa fluida | Versos 2 e 3, Bridge |
| AABB acelera, ABAB respira | Verso 2 (correria) vs Verso 1 (cena) |
| Near-rhyme = sofisticacao | Bridge: centenaria/calendario |
| Espinha vocalica = coesao melodica | "sem querer, sem perceber, sem prestar" |
| Desvio de corpus = surpresa | "nhoque ingrato", "cara de moco" |
| Par de corpus = familiaridade | atencao/perdao, pao/perdao |
| Final de frase > palavra solta | "sem prestar atencao", "por favor" |
