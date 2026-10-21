---
name: git-commit
description: >-
  Use this skill whenever the user asks to write, draft, review, or make a git commit,
  or asks to commit changes to version control ("haz un commit", "redacta el commit",
  "hacer commit", "commit y push", "guardar cambios en git").
---

# Directiva de Commits Automatizados (Git Commit Workflow)

Esta directiva define el procedimiento estándar para redactar mensajes de commit precisos y ejecutar commits seguros siguiendo la especificación de **Conventional Commits**.

---

## Procedimiento Paso a Paso

### 1. Inspeccionar el Estado y los Cambios (Diff Analysis)
Antes de proponer o ejecutar un commit, analiza el estado actual del repositorio:
1. Ejecuta `git status` para identificar archivos staged, unstaged y untracked.
2. Ejecuta `git diff --staged` (o `git diff` si nada está staged) para revisar las líneas de código concretas que han cambiado.
3. **Regla de Seguridad Crítica**: NUNCA agregues archivos de variables de entorno (`.env`, `.env.local`), claves privadas, certificados o datos confidenciales. Si alguno está desprotegido, adviértelo de inmediato y asegúrate de que esté en `.gitignore`.

---

### 2. Redacción según Conventional Commits

El mensaje debe estructurarse de la siguiente forma:

```text
<tipo>(<alcance_opcional>): <descripción concisa en modo imperativo>

[Cuerpo detallado opcional explicando el qué y el porqué del cambio]
- Viñeta 1: Cambio específico
- Viñeta 2: Cambio específico
```

#### Tipos Permitidos:
- **`feat`**: Nueva funcionalidad para el usuario final o nueva vista.
- **`fix`**: Corrección de un bug o comportamiento anómalo.
- **`chore`**: Actualización de dependencias, configuración de build o herramientas internas.
- **`refactor`**: Refactorización de código sin alterar su funcionamiento externo.
- **`style`**: Ajustes de estilo, Tailwind, CSS o formato sin cambios lógicos.
- **`docs`**: Documentación, README o comentarios.
- **`perf`**: Mejoras de rendimiento y optimización.

#### Reglas de Redacción:
1. El título debe ser conciso (máximo 72 caracteres).
2. Utilizar tiempo imperativo presente (ej. `add meta editor`, `fix dev server yarn warning`, `update hero images`).
3. En el cuerpo, desglosar claramente las partes del sistema afectadas.
4. Usar el idioma en el que el usuario esté trabajando o comunicándose (español o inglés).

---

### 3. Confirmación y Ejecución

1. **Presentar al usuario**:
   - Los archivos que serán incluidos en el stage.
   - La propuesta de mensaje de commit redactada.
2. **Ejecutar el comando de Git**:
   ```bash
   git add <archivos_seleccionados>
   git commit -m "<mensaje>"
   ```
3. **Ofrecer o ejecutar Push**:
   - Preguntar o verificar si el usuario desea sincronizar de inmediato con el repositorio remoto (`git push origin <rama_actual>`).
