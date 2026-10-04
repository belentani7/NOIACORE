# Critérios de auditoria de coerência

Esta auditoria usa uma matriz simples e exigente. Uma capacidade só pode ser considerada **demonstrada** se existir implementação executável, persistência ou efeito observável quando aplicável, e teste ou evidência de execução. Uma capacidade é **preparada** quando possui contratos e arquitetura, mas ainda não opera no domínio prometido. Uma capacidade é **conceitual** quando aparece em textos, planos ou interfaces sem implementação correspondente. Ela é **ausente** quando não há evidência de código, contrato, teste ou operação.

| Critério | Pergunta de auditoria | Evidência aceitável | Falha de coerência |
|---|---|---|---|
| Promessa | O que a plataforma declara fazer? | Documento, interface, contrato ou API | Texto mais amplo que a operação real |
| Implementação | Onde a capacidade existe no sistema? | Código, esquema, procedimento ou adaptador | Não há caminho executável |
| Evidência | Como se verifica a alegação? | Teste, build, trace, banco ou revisão visual | Afirmação sem prova reproduzível |
| Dependência | O que é necessário para funcionar? | Usuário, dados, processo, serviço ou hardware declarado | Dependência oculta ou não atendida |
| Limite | O que o sistema bloqueia ou não faz? | Política, tipo, teste ou rejeição explícita | Limite declarado sem bloqueio técnico |
| Saúde | O sistema pode detectar degradação e recuperar? | Health check, alarme, trace, teste de erro ou runbook | Indicador meramente visual |
| Maturidade | Qual o estado real do ativo? | Classificação demonstrado/preparado/conceitual/ausente | Maturidade inflada |

O relatório final separará sempre **fato verificado**, **inferência técnica**, **hipótese de evolução** e **alegação não sustentada**. Nenhuma expressão como “máximo”, “autônomo”, “consciente”, “industrial” ou “pronto para produção física” será aceita sem evidência proporcional.
