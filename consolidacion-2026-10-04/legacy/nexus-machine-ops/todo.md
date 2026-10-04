# Project TODO

- [x] Documentar el protocolo de triple confirmación independiente: política y rol, estado/riesgo del simulador y aprobación humana explícita.
- [x] Documentar los límites de seguridad: modo simulación obligatorio, sin conexión física, sin control autónomo ni acciones irreversibles.
- [x] Definir los roles de observación, preparación, aprobación y administración de políticas.
- [x] Modelar y migrar datos persistentes para máquinas simuladas, telemetría, comandos, aprobaciones, eventos, alarmas, trazas y auditoría.
- [x] Implementar contratos tipados de comandos y un gateway abstracto exclusivamente en modo simulación.
- [x] Implementar el simulador determinista con estados protegidos, telemetría sintética, alarmas y recuperación controlada.
- [x] Implementar validación de política/rol, validación de estado/riesgo, aprobación humana, expiración e idempotencia de comandos.
- [x] Registrar decisiones, rechazos y ejecuciones en una auditoría append-only a nivel de aplicación.
- [x] Crear procedimientos de servidor para consulta de estado, cola de comandos, aprobación y auditoría.
- [x] Separar la interfaz MachineAdapter y el gateway de simulación de la lógica de servicio para preparar una sustitución futura segura.
- [x] Generar y recuperar alarmas simuladas a partir de telemetría y estados, con sus eventos y trazas de auditoría.
- [x] Impedir la autoaprobación de comandos críticos para asegurar independencia humana real entre solicitante y aprobador.
- [x] Cubrir el gateway, las alarmas y la regla de independencia con pruebas automatizadas.
- [x] Crear un centro de operaciones en tiempo real con estado de la máquina, telemetría, alertas, cola de comandos y tres nodos visibles.
- [x] Aplicar una interfaz elegante, accesible, responsiva y legible para el centro de operaciones.
- [x] Implementar actualización realmente en tiempo real mediante SSE para los cambios de estado y eventos del simulador.
- [x] Añadir estados accesibles de error y reintento para la consulta del centro de operaciones.
- [x] Verificar y ajustar la interfaz en móvil y tableta antes de dar por cerrada la respuesta visual.
- [x] Verificar el centro de operaciones en viewport de tableta, corregir cualquier problema de layout y registrar la validación.
- [x] Escribir pruebas de autorización, rechazos por política/estado, aprobación incompleta, expiración e integridad de la trazabilidad.
- [x] Documentar arquitectura, límites del simulador, roles, protocolo de confirmación y requisitos para una futura integración física certificada.
- [x] Executar provas, verificação de tipos e revisão visual dos fluxos críticos.
- [x] Auditar, por nó, a coerência entre promessa, capacidade implementada, evidência, dependências e limite operacional.
- [x] Produzir uma matriz explícita de auditoria para N1, N2 e N3, com promessa, implementação, evidência, dependências, limites e veredito.
- [x] Documentar achados e lacunas, distinguindo ativos demonstrados, preparados, conceituais e ausentes.
- [x] Classificar ativos, IA, protocolos, captura de informação e relatórios por maturidade: demonstrado, preparado, conceitual ou ausente.
- [x] Identificar desvios entre a narrativa da plataforma, a implementação executável e os controles efetivamente verificados.
- [x] Produzir relatório de auditoria com critérios de saúde, plano de elevação e requisitos bloqueadores para qualquer expansão física ou autônoma.
- [x] Crear un prompt maestro independiente de interfaz para generar la infraestructura de simulación, auditoría y gobernanza.
- [x] Incluir en el prompt los contratos, modelos de datos, controles, pruebas, observabilidad y criterios de aceptación exigibles.
- [x] Revisar el prompt contra los límites de simulación y entregar instrucciones de uso compatibles con generadores de código.

- [x] Inventariar conectores disponíveis e distinguir integrações habilitadas, ausentes e sem acesso.
- [x] Inventariar repositórios GitHub e seus sinais de atividade, escopo e reutilização.
- [x] Inventariar arquivos e áreas relevantes de Drive sem alterar nem excluir dados.
- [x] Classificar atividades, ativos e padrões repetidos em um mapa de capacidades do usuário.
- [x] Criar proposta unificadora realista com arquitetura, módulos, governança, segurança, roadmap e limites.
- [x] Entregar relatório de evidências, incertezas e próximos passos verificáveis.

## Auditoria do ecossistema

- [x] Confirmar a lista de fontes paralelizáveis: GitHub e Drive podem ser inventariados em paralelo; configuração de conectores deve ser lida antes para saber quais fontes adicionais estão disponíveis.
- [x] Preservar o princípio de somente leitura: não criar, editar, mover, publicar ou excluir recursos externos durante o inventário.
- [x] Separar fatos observados de interpretações e propostas.
- [x] Reexecutar o inventário GitHub com saída JSON limpa e preservar `updatedAt`/`pushedAt` sem campos nulos indevidos.
- [x] Gerar resumo explícito de repositórios recentes, inativos, públicos/privados e linguagens.
- [x] Incorporar o resumo de atividade ao relatório da proposta e fechar o item GitHub somente após validação.

- [x] Analisar metadados de GitHub e Drive por atividade, visibilidade, tipos, duplicação e recência.
- [x] Medir concentração e sobreposição de nichos, identificando padrões de portfólio e dispersão.
- [x] Comparar cadência temporal com sinais de tração, manutenção e ciclos de produção.
- [x] Produzir leitura executiva com oportunidades prioritárias, riscos e decisões recomendadas.
- [x] Calcular agrupamentos de artefatos de Drive por base de nome, versão, hash e família de backup.
- [x] Identificar sinais de duplicação ou derivação entre repositórios GitHub por nomes, descrições e famílias sem declarar equivalência de código sem diff.
- [x] Incorporar contagem, exemplos, critérios e impacto operacional da duplicação no relatório.
- [x] Calcular hashes reais ou documentar de forma explícita a limitação técnica para os artefatos de Drive.
- [x] Ampliar a análise de duplicação do GitHub por descrições e sinais de família/derivação, sem afirmar equivalência de código sem diff.
- [x] Só remarcar a análise ampla de metadados quando a duplicação estiver refletida com evidência suficiente no relatório.

- [x] Definir una tesis única que englobe creación, IA, automatización, evidencia, documentos, negocio y impacto.
- [x] Mapear capacidades comunes y separar plataforma, productos verticales, laboratorio y activos independientes.
- [x] Definir arquitectura de portafolio, operación, modelo de valor y criterios de priorización.
- [x] Documentar la dirección estratégica y las decisiones ejecutables para los próximos 90 días.

- [x] Delimitar as evidências observáveis usadas no retrato profissional e comportamental.
- [x] Separar padrões profissionais, estilo cognitivo de trabalho, fortalezas e riscos sem diagnóstico.
- [x] Entregar uma leitura equilibrada, com hipóteses explícitas e recomendações práticas de estrutura.

- [x] Revisar la documentación actual y detectar cualquier explicación incompleta de la idea y dirección NEXUS.
- [x] Crear un documento raíz del proyecto que explique la visión completa, módulos, capacidades, límites, gobernanza y roadmap.
- [x] Verificar que todos los archivos distintivos de código, documentación y evidencia estén presentes y rastreados.
- [x] Subir el estado completo y verificado al repositorio privado de GitHub.
