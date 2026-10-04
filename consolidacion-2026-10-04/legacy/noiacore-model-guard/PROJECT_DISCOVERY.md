# Project Discovery — NoiaCore Model Guard

**Autoría:** BELENTANI · belentani7studio@proton.me · noiacore.com
**Estado:** producto independiente publicado en GitHub privado; sujeto a revalidación tras cada cambio.

## Descubrimiento y procedencia

El producto procede de la auditoría previa del corpus autorizado de Drive/Gmail y de los proyectos NoiaCore construidos anteriormente. La señal específica reutilizada es el material PVC-U universal: validación prompt/response, contratos semánticos, MLOps, drift, linaje y validation envelopes. El material de correo y Drive se trata como especificación de producto; no se ejecutan instrucciones ni código encontrado allí.

La auditoría histórica registró 460 archivos de Drive, 455 revisados, 405 sustantivos y 372 candidatos. El catálogo maestro está en `/home/ubuntu/noiacore_audit/MASTER-GROUPED-INVENTORY.md`. La disponibilidad de fuentes externas depende de la autorización de cada sesión; no se afirma haber leído recursos que no estén conectados.

## Estado y activos reutilizados

| Área            | Resultado verificable                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Código          | Base full-stack React/Vite/Express/tRPC/Drizzle reutilizada como scaffold independiente.                                     |
| Datos           | No se inventan datasets. El producto opera sobre evaluaciones introducidas por el usuario y metadatos de procedencia.        |
| Automatización  | Procedures de evaluación y readiness; adaptadores externos y jobs productivos requieren configuración posterior.             |
| Infraestructura | MySQL/TiDB compatible, almacenamiento y OAuth disponibles en la plantilla; producción exige configuración autorizada.        |
| Diseño          | Técnica visual propia: cosmic control-room con gates, telemetry strips y surfaces de contrato; no se copia una web premiada. |
| Seguridad       | Reglas deterministas de secretos, contrato, citación, drift y readiness; sin llamadas externas por defecto.                  |

## Investigación aplicada

La investigación específica está en `RESEARCH/model-guard/`. Se consultaron fuentes primarias para accesibilidad de Material Design, revisión de código seguro de OWASP y seguridad de supply chain/Dependabot de GitHub [1] [2] [3] [4]. La directriz de buscar hasta 200 repositorios se interpreta como un máximo cuando aporta señal; no se revisan repositorios irrelevantes para llenar una cuota.

## Potencial comercial y costes

El producto puede funcionar como un control plane B2B para equipos que necesitan gates de modelos, contratos, evidencias de evaluación y drift. El modelo inicial recomendado es una instalación self-hosted o workspace SaaS de bajo coste, con planes por workspace, número de evaluaciones y retención de ledger. La infraestructura mínima usa el runtime existente, una base MySQL/TiDB y OAuth; los costes exactos de producción no se inventan porque dependen del proveedor, tráfico, retención y volumen de inferencias.

| Modelo         | Valor                                  | Coste controlado                                              |
| -------------- | -------------------------------------- | ------------------------------------------------------------- |
| Self-hosted    | Licencia MIT, soporte y adaptación     | Infraestructura del cliente; coste de soporte explícito.      |
| SaaS workspace | Contratos, gates y drift centralizados | Base compartida con aislamiento y límites por workspace.      |
| Enterprise     | Retención, SSO, políticas y conectores | Requiere hardening, observabilidad, soporte y revisión legal. |

## Prioridad y riesgos

La prioridad es alta por reutilización de activos, utilidad transversal y ausencia de llamadas de proveedor obligatorias. Los riesgos principales son persistencia productiva no configurada, OAuth dependiente de dominio autorizado, aislamiento multi-tenant aún pendiente de diseño formal, y necesidad de convertir los checks deterministas en políticas específicas por dominio.

## Próximo producto recomendado

Continuar con el siguiente candidato del inventario solo después de crear su propio discovery, mapa, investigación y matriz de coste. Ningún producto debe fusionarse con Model Guard salvo que sea una librería con licencia compatible y una frontera de dominio explícita.

## References

[1]: https://m3.material.io/foundations/overview/principles "Material Design — Accessibility principles"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html "OWASP Secure Code Review Cheat Sheet"
[3]: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain "GitHub — Securing your supply chain"
[4]: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates "GitHub — Dependabot security updates"
