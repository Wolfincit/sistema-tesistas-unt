# Sistema de Gestión de Tesistas — Ingeniería Industrial UNT

Plataforma institucional web de la **Escuela Profesional de Ingeniería Industrial** de la **Universidad Nacional de Trujillo (UNT)** para la gestión de expedientes de titulación, control del auditorio de sustentaciones, buzón de consultas con notas de voz, padrón de egresados y repositorio multi-universidad en tiempo real.

## Módulos Principales

- **Repositorio Multi-Universidad (Filtro Exclusivo: Ingeniería Industrial):**
  - **UNT (Sede Base · Fija):** Tesis verificadas del repositorio `UNITRU-Tesis` (`20.500.14414`) + búsqueda en vivo vía OpenAIRE.
  - **Referencias Nacionales (Top Ranking Perú):** Consulta en tiempo real a los repositorios oficiales **DSpace 7 REST API** de las colecciones de Ingeniería Industrial de **PUCP, UNMSM, UNI, ULIMA, UPC, UNSA, USIL y UPN**, con casillas para marcar o desmarcar cada universidad y descarga directa de PDFs oficiales.
- **Gestión Documentaria (Tesista y Secretaría):** Carga validada de los 5 requisitos obligatorios en PDF, revisión agrupada por tesista, dictamen de aprobación u observación, descarga individual y en lote, y plantillas oficiales.
- **Reserva y Control de Auditorio:** Bloqueo estricto hasta completar 5/5 requisitos, edición/cancelación por el tesista, búsqueda predictiva de docentes asesores del repositorio UNT, y gestión flexible de fechas y horarios por Secretaría.
- **Buzón de Consultas y Comunicados con Audio Real:** Respuestas privadas por texto y notas de voz audibles, evaluación del tesista (`✓` / `✗`) con límite de 2 intentos, y emisión de comunicados generales con nota de voz en las notificaciones.
- **Control de Accesos y Padrón de Egresados:** Importación masiva (Excel/Word/TXT), selección múltiple, eliminación en lote y vaciado rápido.

## Despliegue en Dominio Propio Institucional

El sistema es completamente independiente del dominio (usa rutas relativas y servidor Node.js integrado sin dependencias externas adicionales).

### Desarrollo local
```bash
npm install
npm run dev
```

### Producción (bajo cualquier dominio institucional, ej. `industrial.unitru.edu.pe`)
```bash
npm install
npm run build
npm start
```
El servidor de producción (`server/index.mjs`) sirve la aplicación compilada (`dist/`) y los endpoints en vivo (`/api/repositorio/buscar`, `/api/repositorio/pdf`, `/api/repositorio/universidades`) en el puerto configurado (`PORT=3000` por defecto). Puede colocarse detrás de Nginx, Apache o Cloudflare bajo el dominio elegido por la Escuela.
