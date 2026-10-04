# Noiacore Art Lab

Noiacore es un laboratorio web de arte generativo basado en Next.js, WebGL y shaders procedurales. Incluye galería interactiva, estudio de creación, generación procedural continua y el sistema NODO de orquestación por capas.

## Arquitectura funcional

El sistema NODO separa tres capas: **Orquestación**, **Formación** y **Ejecución**. La confirmación final usa un algoritmo determinista de tres nodos (`N1`, `N2` y `N3`) con quórum mínimo de 2/3, puntuaciones por capa y una huella reproducible de la evidencia.

La generación procedural funciona como un flujo continuo con una ventana visual limitada para mantener estable el uso de memoria del navegador. El contador total de obras sigue creciendo mientras las obras antiguas se reciclan del DOM.

## Desarrollo local

```bash
pnpm install --ignore-scripts --no-frozen-lockfile
pnpm run db:generate
pnpm run dev
```

La aplicación se abre en `http://localhost:3000`.

## Producción

```bash
pnpm run db:generate
pnpm run build
pnpm run start
```

La variable `DATABASE_URL` debe estar configurada en el entorno de ejecución. Los archivos `.env*` están excluidos del repositorio para evitar publicar credenciales.

## Verificación

El build de producción compila correctamente después de generar el cliente Prisma. El proyecto contiene algunos ejemplos y módulos heredados que pueden requerir dependencias o ajustes de TypeScript independientes del sistema NODO.

## Licencia

Añade aquí la licencia que corresponda antes de hacer público el repositorio.
