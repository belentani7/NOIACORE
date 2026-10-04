# Cómo escribir preguntas que este motor conteste bien

Reglas obtenidas midiendo sobre este proyecto, más los límites documentados del
model card de [`convaiinnovations/laya`](https://huggingface.co/convaiinnovations/laya).
No son opiniones de estilo: cada una viene de un fallo observado.

```bash
PORT=3100 node scripts/ask.mjs examples/repo-audit.json
```

---

## 1. La ventaja real es preguntar mucho, no preguntar bien una vez

Leer el estado se paga una vez; cada pregunta añadida es casi gratis. Medido
aquí: 13 preguntas en 49 ms, **3,8 ms por pregunta**. Laya publica la misma
curva: 39,5 ms con 1 pregunta, 15,9 ms/pregunta con 10, 6,8 ms/pregunta con 50.

Así que no hagas tres preguntas. Haz quince y quédate con las que vuelvan con
confianza. Es lo que hace `scripts/ask.mjs`: ordena y separa.

## 2. Cada opción necesita vocabulario propio

**Esta es la regla que más daño evita.** El scorer offline compara términos. No
entiende negaciones ni cantidades.

Escrito así, contestó `tiene` con **0.94** sobre un estado que decía *"sin licencia"*:

```json
"licencia": { "criteria": {
  "tiene": "El estado menciona una licencia concreta",
  "falta": "El estado dice explicitamente que no tiene licencia"
}}
```

Las dos opciones contienen la palabra `licencia`. El `no` es invisible. Reescrito
para que cada opción tenga palabras que sólo aparecen si esa opción es la buena,
contestó `ninguna` con **1.000**:

```json
"licencia": { "criteria": {
  "permisiva": "MIT BSD ISC Apache",
  "copyleft":  "GPL AGPL LGPL MPL",
  "ninguna":   "sin licencia unlicensed propietario reservados"
}}
```

Lo mismo pasó con `actividad`: describir los niveles como *"Actualizado en
horas"* / *"Actualizado hace meses"* comparte `Actualizado` en las tres y dio
`dormido` 0.94 sobre *"hace 6 horas"*. Dejando sólo `horas hoy ayer` frente a
`meses anos abandonado`: `activo` 0.938.

**El peligro no es que falle, es que falla con confianza alta.** El error ocurre
al casar términos, antes de formarse la distribución, así que el `confidence` no
te avisa. Ninguna otra regla de este documento importa tanto.

## 3. No uses `noul` para nada que importe

El model card documenta que `noul` renderiza sus opciones como `false:` / `true:`
y **puede seguir esas etiquetas en vez del estado**, devolviendo un "no" seguro
ante una entrada claramente positiva
([issue #156](https://github.com/NandhaKishorM/laya/issues/156)).

Además, en este proyecto `noul` no lleva `confidence` propio, así que
`ask.mjs` no puede ordenarlo ni escalarlo: se queda en un limbo sin verificar.

Usa un `choice` de dos opciones:

```json
"riesgo_credenciales": { "type": "choice",
  "instructions": "Puede contener secretos filtrados?",
  "criteria": {
    "sospechoso": "backup copia volcado workspace escritorio snapshot",
    "limpio":     "libreria componentes documentacion diseno"
  }}
```

## 4. Prefiere `choice` a `score`

`score` es la primitiva más débil (Laya mide 0.372 en SST-5). Se confirmó aquí
por partida doble: en los dos ficheros de ejemplo, **casi todo lo que escaló era
un `score`** (`urgencia` 0.423, `esfuerzo` 0.217, `valor` 0.754). Si necesitas un
nivel y la respuesta importa, pártelo en un `choice` de tres opciones con
vocabulario propio.

## 5. Máximo ~10 opciones por pregunta

Las opciones se reparten un presupuesto fijo de tokens (`head_max_len`: 192 en
el checkpoint inglés, 256 en el multilingüe). Con 77 opciones tocan 3–4 tokens
cada una y dejan de distinguirse: Laya cae a 0.425 donde Jev saca 0.870.

Para taxonomías grandes, dos pasos: una pregunta gruesa de 5 opciones y luego
otra fina dentro de la ganadora.

## 6. Sabe qué estados le van bien

Medido: el backend offline rinde con **texto denso en términos propios** y se
queda plano ante **lenguaje humano parafraseado**, sobre todo en otro idioma.

| estado | offline |
|---|---|
| metadatos de un repo | 11 de 13 fiables |
| un hallazgo de escaneo | 10 de 14 fiables |
| mensaje de alguien pidiendo ayuda, en portugués | 0.214 → escala todo |

Para lo tercero no hay truco de redacción que valga: hace falta el checkpoint
multilingüe de Laya (`DECISION_BACKEND=laya`).

## 7. La confianza no es exactitud hasta que la calibres

Laya "ships over-confident": refitear una temperatura por (tipo de pregunta,
número de opciones) mueve el ECE de 0.466 a 0.081. Y las tres primitivas base
rinden cerca del azar en zero-shot (0.362); el 0.766 del benchmark es del
checkpoint afinado con el split de entrenamiento de ese mismo benchmark.

Traducido: **un 0.9 aquí significa "las opciones se separaron mucho", no "acierta
el 90% de las veces"**. Para que signifique lo segundo hay que calibrarlo contra
casos tuyos etiquetados. Hasta entonces, usa el umbral para decidir a qué mirar,
no para decidir a qué obedecer.

---

## Ficheros

| fichero | preguntas | estado | offline |
|---|---|---|---|
| `repo-audit.json` | 13 | metadatos de un repositorio | 11 fiables |
| `security-finding.json` | 14 | hallazgo de escaneo | 10 fiables |
