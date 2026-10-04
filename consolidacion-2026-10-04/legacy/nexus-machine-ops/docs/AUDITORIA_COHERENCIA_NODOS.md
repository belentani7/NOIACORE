# Auditoria de coerência — NEXUS Machine Ops

**Escopo auditado:** implementação, documentação, testes e interface do checkpoint `096d3753`.  
**Natureza da auditoria:** observação de coerência entre promessa, mecanismo executável, evidência, dependência e limite.  
**Data:** 26 de agosto de 2026.  
**Veredito global:** **coerente como plataforma de operação exclusivamente simulada e de baixo alcance; não coerente se for descrita como IA autônoma, sistema de captura geral, motor de relatórios completo, gateway industrial real ou infraestrutura máxima de controle.**

> A plataforma atual é um **ambiente de demonstração e validação de fluxo de decisão seguro em simulação**. É um bom núcleo de protocolo. Ainda não é uma plataforma industrial, nem uma fábrica de agentes, nem uma “consciência” operacional.

---

## 1. O que a plataforma é — e o que ela não é

O NEXUS Machine Ops implementa um ciclo restrito: um usuário autenticado solicita um comando em modo simulado; a política e o papel avaliam a solicitação; o estado e o risco do simulador avaliam a transição; um segundo humano autorizado decide; o gateway de simulação executa apenas a transição permitida; e cada decisão fica persistida em comandos, validações, eventos e auditoria encadeada.[1] [2]

Em termos de produto, ela é um **control room de simulação com autorização em três etapas**, telemetria sintética, alarmes sintéticos, trilha de auditoria e atualização de interface por SSE. O contrato de gateway restringe o adaptador ao modo `simulation`, e a documentação proíbe expressamente comunicação direta com hardware físico nesta fase.[1] [3]

Ela **não contém uma IA operacional**: não há chamada de modelo, classificação por LLM, agente, avaliação de modelo, roteamento de modelos, memória semântica, RAG ou captura documental externa no código auditado. Também não há “consciência” mensurável ou declarada como mecanismo técnico. O termo correto para a capacidade presente é **observabilidade operacional limitada**, não consciência.

| Afirmação possível | Veredito | Formulação correta |
|---|---|---|
| “Controla uma máquina” | **Incorreta fora da simulação** | Controla o estado de um simulador determinista por gateway abstrato |
| “Tem tripla confirmação independente” | **Parcialmente demonstrada** | N1, N2 e N3 são persistidos; a independência de usuário é aplicada, mas não há autenticação reforçada nem segregação organizacional completa |
| “Tem telemetria em tempo real” | **Parcialmente demonstrada** | A UI recebe eventos SSE; a telemetria sintética é materializada quando o snapshot é consultado |
| “Tem auditoria imutável” | **Parcialmente demonstrada** | A aplicação oferece trilha append-only e hashes encadeados; a imutabilidade não é garantida contra acesso administrativo direto ao banco |
| “É seguro para ambiente físico” | **Não demonstrada e não alegável** | Apenas define pré-requisitos documentais para uma futura fase física |
| “É uma plataforma de IA” | **Não demonstrada** | É uma plataforma de protocolo, simulação e governança que poderia receber IA consultiva no futuro |

---

## 2. Método e escala de maturidade

A auditoria considera uma capacidade demonstrada somente quando há **código executável**, **efeito observável ou persistido**, e **evidência verificável**, como teste, build, trace ou inspeção de banco. O método completo está registrado em `CRITERIOS_AUDITORIA_COHERENCIA.md`.[4]

| Maturidade | Definição prática | Pode ser chamada de “capacidade”? |
|---|---|---|
| **Demonstrada** | Implementada, observável e com evidência de teste/execução | Sim, dentro do seu limite |
| **Preparada** | Tem interface, contrato ou arquitetura, mas não opera no domínio final | Apenas como “preparada para extensão” |
| **Conceitual** | Existe em visão, interface ou documento sem mecanismo correspondente | Não como funcionalidade atual |
| **Ausente** | Não há código, contrato, teste ou artefato operacional | Não |

Os valores de coerência a seguir não são métricas de desempenho da máquina. São juízos de maturidade da auditoria, calculados qualitativamente a partir dos cinco critérios: promessa, implementação, evidência, dependência e limite.

---

## 3. Matriz de auditoria dos três nós

### 3.1. N1 — Política e papel

| Campo | Observação auditada |
|---|---|
| **Promessa** | Bloquear solicitações incompatíveis com papel, escopo e modo de simulação.[1] |
| **Implementação** | `evaluatePolicy()` calcula papel efetivo, aceita somente `simulation` com `testMode` e restringe o operador a um conjunto limitado de comandos. O `policy_admin` pode preparar mais comandos.[5] |
| **Evidência** | Testes cobrem bloqueio de observador e autorização de operador. A execução é tipada, persistida e passa por validação N1 no momento da solicitação e antes da execução.[6] [7] |
| **Dependências** | Sessão autenticada, usuário persistido, papel operacional correto e banco acessível. |
| **Limite real** | A política é estática no código, identificada apenas como `SIM-1.0`. Não há editor de políticas, versionamento persistente de regras, aprovação de alteração de política, ABAC, escopo por máquina ou histórico de policy-as-code. |
| **Veredito** | **Coerente para RBAC simples em simulação; não suficiente como governança de política de alta criticidade.** |

O N1 é honesto quando afirma que protege o modo atual. Ele não é suficiente para afirmar governança empresarial completa, porque a regra operacional está codificada e a identidade de `policy_admin` decorre do papel administrativo global. A plataforma ainda não demonstra uma separação de deveres completa entre administrador de aplicação, administrador de política e operador de máquina.

**Risco de coerência:** médio. O que é dito sobre RBAC existe; o que ainda falta é governança de mudança da política.

### 3.2. N2 — Estado e risco do simulador

| Campo | Observação auditada |
|---|---|
| **Promessa** | Decidir se uma transição é segura pelo estado, alarmes, telemetria, heartbeat e pré-condições.[1] |
| **Implementação** | O simulador define estados e transições protegidas. `evaluateRisk()` consulta máquina, última telemetria, alarme crítico e heartbeat; `commandRiskSummary()` bloqueia transições inválidas e temperatura acima do limiar.[7] [8] |
| **Evidência** | Testes cobrem transições permitidas, rejeição por estado inseguro e limite de temperatura. Alarmes `SIM_ESTOP_ACTIVE` e `SIM_OVER_TEMPERATURE` têm regra testada.[9] [10] |
| **Dependências** | Máquina simulada persistida, snapshot de telemetria recente, banco e chamadas ao endpoint de snapshot. |
| **Limite real** | A telemetria não é gerada por um loop independente contínuo: ela é persistida quando o snapshot é solicitado. Os alarmes são reconciliados dentro do mesmo fluxo. O histórico exibido no gráfico é derivado visualmente do último ponto, e não uma série temporal consultada do banco.[11] |
| **Veredito** | **Coerente como validação de risco em simulação sob demanda; não coerente como monitoramento contínuo ou digital twin de alta fidelidade.** |

O N2 é o maior ponto de atenção. A plataforma pode bloquear uma transição em função do último estado observado, mas não possui uma “vida própria” de simulação independente da interface. Se nenhum snapshot ocorre, não há produção contínua de telemetria, evolução temporal de falhas, backlog de eventos ou detecção autônoma de degradação. Por isso, a expressão “tempo real” deve ser usada com precisão: há **notificação em tempo real de alterações auditadas dentro de uma instância**, mas não há simulação contínua garantida.

**Risco de coerência:** médio-alto. O protocolo de risco existe e é testado; a observabilidade subjacente ainda é limitada.

### 3.3. N3 — Aprovação humana independente

| Campo | Observação auditada |
|---|---|
| **Promessa** | Exigir aprovação humana explícita, válida no tempo e independente do solicitante.[1] |
| **Implementação** | `evaluateHumanApproval()` bloqueia autoaprovação, papel não autorizado e expiração. O serviço revalida N1 e N2 antes da aprovação produzir execução.[5] [7] |
| **Evidência** | Testes cobrem autoaprovação bloqueada, expiração e completude dos três nós. A interface apresenta o motivo da decisão e desabilita aprovação pelo próprio solicitante.[6] [11] |
| **Dependências** | Duas contas distintas ou papéis distintos, sessão confiável, horário do servidor e armazenamento persistente de comando. |
| **Limite real** | Não há step-up authentication, assinatura criptográfica de aprovação, justificativa obrigatória para aprovação, quorum, quatro-olhos por organização, mecanismo de delegação, ou trava transacional explícita contra concorrência entre aprovação e mudança de estado. O modelo atual não contém payload parametrizável de comando; portanto, a referência documental a um “hash de parâmetros” é aspiracional, não implementada. |
| **Veredito** | **Coerente para separação mínima de pessoa na aplicação; não é uma prova de separação de deveres forte.** |

O N3 é importante porque evita que o mesmo usuário prepare e aprove uma ordem. Esse controle é real. Contudo, “independente” significa, no nível atual, apenas `userId` distinto e papel adequado. Para um ambiente mais rigoroso, seriam necessários segundo fator ou assinatura de aprovação, justificativa, confirmação do contexto, revisão de conflito de interesses e uma política de quorum para comandos classificados como críticos.

**Risco de coerência:** médio. A alegação de independência deve ser qualificada como **independência de conta dentro da aplicação**, não independência organizacional ou certificada.

---

## 4. Inventário de ativos, IA, protocolo, captura e relatórios

| Ativo / capacidade | Estado de maturidade | Evidência | Limite que não deve ser ocultado |
|---|---|---|---|
| Autenticação e sessão | Demonstrada | OAuth da plataforma, procedimentos protegidos e teste de logout | Não há autenticação reforçada específica para aprovação crítica |
| Papéis operacionais | Demonstrada, com escopo simples | Enum persistido, N1 e UI | Não há gestão de papéis, escopo por ativo ou ABAC na interface |
| Simulador de estados | Demonstrada | Estados, transições e testes | Modelo físico não existe; `calibrating` não possui fluxo visual próprio |
| Telemetria sintética | Demonstrada sob demanda | Geração determinista e persistência no snapshot | Não é coleta periódica autônoma nem série histórica fiel |
| Gateway e adaptador | Preparada para extensão | Interface `MachineAdapter` e `SimulationGateway` | Só aceita o modo simulado; não há adaptador físico, reconexão real ou fila offline |
| N1, N2 e N3 | Demonstrada no domínio simulado | Código, persistência e testes | Falta isolamento transacional e controles de identidade reforçada |
| Auditoria hash-chain | Demonstrada no nível de aplicação | `eventHash`, `previousHash`, testes e UI | Administrador do banco ainda poderia alterar linhas; não é WORM nem ledger externo |
| SSE | Demonstrada dentro da instância | Endpoint autenticado e teste de publicação | `EventEmitter` em memória não tem replay, persistência, entrega garantida nem coordenação entre instâncias |
| Alarmes | Demonstrada para dois cenários | E-STOP e sobretemperatura simulados | Sem motor de cenários, correlação, escalonamento ou política de reconhecimento |
| Centro de operações | Demonstrada | UI responsiva verificada em três viewports | Algumas afirmações são simplificadas: gráfico derivado e badge de gateway estático |
| Captura de informação | Parcialmente demonstrada | Captura de comando, decisão, evento, telemetria e alarme | Não captura documentos, fontes externas, evidência de campo ou dados de manutenção |
| Relatórios completos e saudáveis | Ausente | Não há gerador, exportação, esquema de relatório, métricas de qualidade ou distribuição | A auditoria pode ser consultada na UI; isso não equivale a relatório operacional completo |
| IA / agentes / memória inteligente | Ausente | Não há chamada de modelo nem camada de IA no código auditado | Não alegar IA operacional, consciência, raciocínio ou autonomia |
| “Consciência” | Conceitual e indefinida | Não há definição operacional ou medida | Deve ser substituída por consciência situacional, com dados e critérios verificáveis |
| Integração física | Ausente deliberadamente | O código e os documentos a bloqueiam | Só há requisitos preliminares, não capacidade de conexão |

### 4.1. Conclusão sobre IA e “consciência”

Não existe uma IA no caminho de decisão atual, e isso é uma qualidade para este estágio. Os nós são determinísticos, auditáveis e mais fáceis de testar. Inserir um LLM na rota N1, N2 ou N3 agora **reduziria** a confiabilidade, porque o sistema ainda não tem benchmark de decisão, conjunto de casos, mecanismo de avaliação, isolamento de modelo, logs de prompt/resposta, orçamento, política de dados nem fallback comprovado.

O objetivo correto não é “construir consciência”. É construir **consciência situacional operacional**: fatos com origem, estado atual, alarmes, incertezas, impacto, decisão pendente e evidência recuperável. Essa capacidade pode ser máxima no sentido responsável sem afirmar fenômenos que a plataforma não mede.

---

## 5. Desvios entre narrativa, interface e mecanismo real

| Elemento observado | Grau | Diagnóstico | Correção requerida |
|---|---|---|---|
| “Actualización 2,5 s” na interface | Alto | A consulta usa `refetchInterval: false`; SSE atualiza após evento auditado. Não há atualização periódica de 2,5 segundos.[11] | Remover o texto ou implementar scheduler/loop de telemetria com medição real |
| Gráfico “Live telemetry” | Alto | Os quatro pontos anteriores são calculados a partir do último valor, não consultados do histórico persistido.[11] | Consultar série temporal real de `machineTelemetry` e rotular fonte/frequência |
| “Gateway conectado” | Médio | O badge é apresentado sem uma consulta visível de saúde na UI; o adaptador simulado responde sempre conectado.[11] | Exibir resultado de `healthCheck`, tempo de última verificação e estado de SSE |
| “Auditoria imutável” | Médio | O mecanismo é append-only no nível de aplicação, não uma imutabilidade de infraestrutura.[1] | Trocar a formulação para “trilha encadeada verificável” ou elevar a proteção do armazenamento |
| “Tempo real” | Médio | SSE existe, mas é evento em memória por instância e telemetria é sob demanda.[11] [12] | Chamar de “atualização por evento na sessão” até haver barramento e série contínua |
| Triple confirmation “absoluta” | Médio | Três decisões existem; independência humana é por `userId`, sem assinatura/segundo fator/quorum.[5] | Chamar de “tripla confirmação de aplicação” e elevar a prova de identidade no próximo estágio |
| “Hash de parâmetros” no protocolo | Médio | O protocolo afirma vinculação a hash de parâmetros, mas o comando atual possui tipo e chave de idempotência, sem payload de parâmetros nem hash persistido.[1] [7] | Corrigir o documento ou implementar payload canônico, hash e invalidação por alteração |

Esses desvios não invalidam a plataforma. Eles definem exatamente onde a linguagem precisa ser mais precisa que o marketing. Uma plataforma saudável é aquela que expõe a incerteza e o limite, não aquela que mascara os dois.

---

## 6. Saúde atual da plataforma

### 6.1. O que está saudável e verificável

O projeto compilou com `pnpm check`, produziu build com `pnpm build` e executou quatorze testes em seis arquivos. Os testes cobrem estado do simulador, política, autoaprovação, expiração, gateway de simulação, alarmes, hash-chain e stream de atualizações. A interface foi revisada em desktop, móvel e tableta.[13] [14]

A arquitetura também preserva o limite mais importante: não há referência operacional a drivers de PLC, OPC UA, Modbus ou protocolos físicos no código de operação. O gateway limita explicitamente o adaptador ao modo `simulation`.[1] [3]

### 6.2. O que não foi verificado

Não há teste end-to-end com duas contas reais, teste de concorrência, teste de reinício de servidor durante uma aprovação, teste de indisponibilidade do banco, teste de restauração, teste de carga, SAST/DAST, pentest, verificação de integridade da cadeia a partir do banco ou teste de migração em banco completamente vazio. Também não há medição de latência, disponibilidade, taxa de eventos perdidos ou fidelidade da simulação.

Logo, a expressão adequada é: **o núcleo tem verificação unitária e build saudável; a resiliência operacional ainda não foi comprovada.**

---

## 7. A capacidade máxima responsável nesta fase

Não existe “máximo” universal para uma plataforma de operações. Existe um teto responsável definido por escopo, evidência, orçamento, riscos e dados disponíveis. Para a fase atual, o máximo defensável não é integrar hardware, inserir IA ou multiplicar interfaces. É atingir um **Simulador Confiável de Decisão Operacional** com sete propriedades comprováveis:

1. **Verdade temporal:** telemetria e eventos são gerados continuamente por um processo de simulação claramente separado da UI; o gráfico mostra série persistida, não valores derivados.
2. **Decisão atômica:** solicitação, revalidação de N1/N2, N3 e transição usam lock/versão de estado para impedir corrida e replay concorrente.
3. **Política governada:** regras têm versão persistida, alteração aprovada, teste de regressão, escopo por máquina e histórico de mudança.
4. **Aprovação forte:** N3 exige segundo fator, justificativa, contexto assinado e, conforme risco, quorum de duas pessoas distintas.
5. **Auditoria verificável:** a cadeia é verificada periodicamente, há exportação assinada e o armazenamento possui retenção e proteção contra alteração administrativa comum.
6. **Saúde mensurável:** banco, stream, gateway, simulador, eventos e integridade de dados possuem check real, limites e alertas.
7. **Relatório honesto:** cada relatório informa fonte, período, lacunas, qualidade de dados, decisões, exceções e conclusão — sem preencher ausência com narrativa.

Essas sete propriedades elevam a plataforma muito mais do que uma camada de “IA”. Elas criam a base para qualquer inteligência futura ser usada sem destruir o controle humano.

---

## 8. Roteiro de elevação até o topo responsável

### Horizonte P0 — corrigir alegações e lacunas de verdade

Substituir o gráfico derivado por leitura de séries persistidas. Remover a alegação de atualização em 2,5 segundos até que exista um processo de simulação com cadência observável. Tornar status de gateway e SSE dinâmicos. Adicionar indicadores de idade de dado, última atualização, integridade da cadeia e estado de conexão.

**Gate de saída:** cada elemento exibido na UI aponta para fonte real, timestamp e método de atualização.

### Horizonte P1 — simulador contínuo e determinação atômica

Executar o motor de simulação por mecanismo de job compatível com o ambiente de hospedagem, ou, em desenvolvimento, por tick controlado e testável. Persistir uma série temporal verdadeira. Adicionar versão de estado da máquina, idempotência por escopo e revalidação dentro de transação. Criar cenários de falha: heartbeat vencido, sobretemperatura, desconexão de gateway, atraso, evento duplicado e recuperação.

**Gate de saída:** um conjunto de cenários reproduzíveis demonstra que nenhum comando executa quando os fatos avaliados mudam entre aprovação e despacho.

### Horizonte P2 — política, identidade e relatório saudável

Separar `policy_admin` de administrador geral, armazenar política e versão em banco, exigir revisão em alterações e aplicar escopo por máquina. Adicionar segundo fator ou confirmação criptográfica em N3. Criar relatórios de turno, incidentes, comandos, alarmes e integridade da auditoria, com fonte, período, itens ausentes e assinatura/exportação verificável.

**Gate de saída:** uma revisão independente reconstrói uma decisão completa apenas pelos dados e pelo relatório gerado.

### Horizonte P3 — IA consultiva e governada

Somente após P0–P2, acrescentar IA em posição **consultiva**, nunca diretamente autorizadora. A IA pode resumir turnos, detectar anomalias candidatas, explicar divergências, sugerir testes e preparar relatórios. Ela deve produzir proposta, evidência, confiança, custo e incerteza; N1, N2 e N3 permanecem determinísticos e humanos.

Cada output precisa de avaliação, logs, proteção de dados, controle de modelo, fallback e teste de regressão. Não chamar esta camada de consciente. O nome correto é **copiloto de consciência situacional**, desde que a origem de cada afirmação seja rastreável.

**Gate de saída:** a IA melhora um indicador mensurável de triagem ou documentação sem receber permissão de executar controle.

### Horizonte P4 — preparação para integração física, sem ativá-la

Construir simuladores de adaptador e contratos de integração, mas manter o modo físico desabilitado. Para abrir uma fase física futura, criar uma iniciativa separada de engenharia, risco, conectividade, identidade de dispositivos, testes de degradação e resposta de emergência independente. O critério de sucesso não é “conectar”; é provar que a conexão falha de forma segura.

---

## 9. Veredito final

O NEXUS Machine Ops já possui um ativo valioso: um **protocolo de decisão controlada** que não promete controle físico e que preserva a explicação de cada nó. Esse é o núcleo certo.

O que ainda não existe é a camada de máxima capacidade: telemetria contínua, relatórios íntegros, captura abrangente de evidências, resiliência distribuída, política governada, identidade forte e IA consultiva avaliada. Isso não é fracasso; é a fronteira honesta entre uma plataforma bem construída para simulação e uma infraestrutura operacional madura.

> A maneira de levar o sistema ao topo não é adicionar “consciência” por discurso nem conectá-lo a hardware por pressa. É elevar sucessivamente a **verdade dos dados, a prova das decisões, a saúde dos relatórios e o limite das permissões**. Só então a inteligência — humana ou artificial — ganha o direito de participar.

---

## Referências de auditoria

[1]: ./PROTOCOLO_TRIPLE_CONFIRMACION.md "Protocolo de Triple Confirmación — NEXUS Machine Ops"
[2]: ./OPERACION_Y_ARQUITECTURA.md "NEXUS Machine Ops — Operação e arquitetura"
[3]: ../server/machine/gateway.ts "Contrato MachineAdapter e SimulationGateway"
[4]: ./CRITERIOS_AUDITORIA_COHERENCIA.md "Critérios de auditoria de coerência"
[5]: ../server/machine/protocol.ts "Avaliação de política e aprovação humana"
[6]: ../server/machine/protocol.test.ts "Testes de tripla confirmação e integridade da auditoria"
[7]: ../server/machine/service.ts "Persistência, revalidação, eventos e execução simulada"
[8]: ../server/machine/simulator.ts "Estados protegidos, telemetria e avaliação de risco"
[9]: ../server/machine/simulator.test.ts "Testes de transição e risco do simulador"
[10]: ../server/machine/alarms.ts "Política de alarmes sintéticos"
[11]: ../client/src/pages/Home.tsx "Interface, SSE e apresentação de telemetria"
[12]: ../server/machine/stream.ts "Canal de atualização SSE em memória"
[13]: ../todo.md "Registro de verificações executadas"
[14]: ./VALIDACION_RESPONSIVA.md "Validação visual em desktop, móvel e tableta"
