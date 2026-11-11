# Tutorial inicial de Cursor

Cursor es un editor de código con un agente de IA integrado. Se parece a VS Code: mismos atajos por defecto, terminal, control de versiones y extensiones. La diferencia es que puedes pedir cambios en lenguaje normal y el agente lee el proyecto, edita archivos y puede ejecutar comandos.

Este archivo está en la raíz de tu carpeta de proyectos. Síguelo en orden la primera vez.

## 1. Abrir un proyecto

1. Instala Cursor desde [cursor.com/download](https://cursor.com/download) y abre la app.
2. Inicia sesión. Una cuenta gratuita basta para empezar.
3. Si vienes de VS Code: **Cursor Settings → General → Account → VS Code Import**. Trae ajustes, atajos, temas y extensiones de un golpe.
4. **File → Open Folder** y elige la carpeta del proyecto. Cursor trabaja sobre esa carpeta.

La pantalla clásica tiene el explorador de archivos a la izquierda, el editor en el centro, la terminal abajo y el panel de IA a un lado. Empieza aquí. Existe otra vista llamada Agents Window para varios agentes a la vez; déjala para más adelante.

## 2. Las cuatro formas de usar la IA

Abre el panel lateral con **Cmd+I** o **Cmd+L**. Dentro del panel eliges un **modo** con el menú o con **Shift+Tab**.

| Modo | Para qué | ¿Edita archivos? |
| --- | --- | --- |
| **Agent** | Construir, refactorizar, corregir bugs. Es el modo por defecto. | Sí |
| **Ask** | Preguntar y entender código. | No |
| **Plan** | Tareas grandes o de varios archivos. Revisa el plan y pulsa **Build**. | Sí, después de aprobarlo |
| **Debug** | Bugs que necesitan evidencia en tiempo de ejecución. | Sí |

Además del panel hay dos gestos en el editor:

- **Tab.** Mientras escribes, aparece texto gris. **Tab** acepta toda la sugerencia. **Esc** o seguir escribiendo la descarta. **Cmd+Right Arrow** acepta solo la siguiente palabra.
- **Cmd+K.** Selecciona un trozo de código, describe el cambio y pulsa Return. Sirve para un cambio pequeño en el sitio, por ejemplo “convierte esto en una función async”.

Regla práctica:

- Una pregunta → **Ask**.
- Un cambio en el código que estás viendo → **Cmd+K**.
- Crear archivos, tocar varias partes o ejecutar comandos → **Agent**.
- Un cambio grande → **Plan**, luego **Build**.

## 3. Tu primera sesión (15 minutos)

Esta carpeta puede estar vacía. Eso está bien.

1. **Cmd+I**. Deja el modo en **Agent**.
2. Pega este pedido:

   > Crea un solo archivo `index.html` con un título y un botón que muestre u oculte un mensaje corto. Sin frameworks ni dependencias.

3. Lee el diff antes de quedarte con el cambio. El agente aplica ediciones mientras trabaja.
4. Abre `index.html`, selecciona el código del botón, pulsa **Cmd+K** y pide un cambio pequeño, por ejemplo cambiar el texto del mensaje.
5. Escribe unas líneas a mano y acepta o rechaza una sugerencia de **Tab**.
6. Cambia a **Ask** (**Shift+Tab**) y pregunta qué hace el archivo. Ask explica y no modifica nada.
7. Opcional: abre la terminal y sirve el archivo, o pídele al agente el comando y aprueba lo que va a ejecutar.

Si la carpeta ya tiene código, usa este pedido en **Ask**:

> Explica este proyecto. Dime los puntos de entrada, los módulos importantes y qué debería leer antes de cambiar algo.

Luego pide tres mejoras pequeñas y seguras, y elige una para que **Agent** la haga.

## 4. Cómo pedir las cosas

Un buen pedido dice el resultado y los límites. “Hazlo mejor” casi nunca basta. “Añade un botón que alterne el mensaje, en un solo `index.html`, sin librerías” sí.

- Escribe `@` para adjuntar un archivo o carpeta: `@index.html`, `@src/components/`. Si no sabes qué archivos importan, no adjuntes toda la carpeta: el agente busca solo.
- Empieza un chat nuevo cuando cambies de tarea: **Cmd+N** o **Cmd+R**. Un chat largo con temas mezclados empeora las respuestas.
- Cambiar de modo también abre un contexto nuevo.
- Puedes pegar imágenes en el pedido.

Mientras el agente trabaja, **Enter** deja el siguiente mensaje en cola y **Cmd+Return** lo envía ya. **Stop** lo interrumpe.

## 5. Revisar y deshacer

- El agente escribe archivos según avanza. Mira el diff.
- Con cambios pendientes: **Cmd+Return** acepta todos y **Cmd+Shift+Backspace** los rechaza.
- **Restore Checkpoint** (pasa el cursor sobre un mensaje anterior) devuelve los archivos a ese punto. No borra el chat y no es git. Los commits siguen siendo tu historial real.

## 6. Atajos en Mac

| Acción | Atajo |
| --- | --- |
| Abrir o cerrar el panel de IA | **Cmd+I** o **Cmd+L** |
| Enviar la selección a un chat nuevo | **Cmd+L** (con código seleccionado) |
| Añadir la selección al chat actual | **Cmd+Shift+L** |
| Edición en el sitio | **Cmd+K** |
| Hacer una pregunta sobre la selección | **Opt+Return** |
| Cambiar Agent / Ask / Plan / Debug | **Shift+Tab** |
| Menú de modos | **Cmd+.** |
| Aceptar sugerencia de Tab | **Tab** |
| Aceptar solo la siguiente palabra | **Cmd+Right Arrow** |
| Chat nuevo | **Cmd+N** o **Cmd+R** |
| Paleta de comandos | **Cmd+Shift+P** |
| Ajustes de Cursor | **Cmd+Shift+J** |
| Ajustes del editor | **Cmd+,** |

En Windows y Linux, **Ctrl** ocupa el lugar de **Cmd**. Si importaste atajos de VS Code, pueden ser distintos. La lista real está en **Cmd+R** y luego **Cmd+S**.

## 7. Terminal y Git

La terminal integrada es la de siempre. Con el foco en la terminal, **Cmd+K** abre una barra para describir un comando en lenguaje normal. **Cmd+Return** lo ejecuta.

El agente también puede correr comandos. El modo por defecto revisa lo que va a ejecutar: mira qué aprueba. No hace falta dejar que corra todo sin mirar.

El control de código fuente funciona como en VS Code: stage, commit y ramas. Después de preparar cambios, el icono de destello en la caja de commit propone un mensaje a partir del diff. Los checkpoints del chat no sustituyen un commit.

## 8. Errores típicos al empezar

- Creer que **Cmd+L** es un chat que nunca edita. El chat de solo lectura es el modo **Ask**. **Agent** sí modifica archivos.
- Aceptar un diff de varios archivos sin leerlo.
- Usar el mismo chat para tareas que no tienen nada que ver.
- Pedidos vagos, o mencionar con `@` el repositorio entero.
- Esperar que las reglas de proyecto afecten a **Tab** o a **Cmd+K**. No lo hacen.
- Quedarte sin sugerencias de Tab: hace falta red, y en el plan gratuito hay un cupo mensual.
- Suponer que todas las extensiones de VS Code están. Cursor usa Open VSX; muchas funcionan, no todas.

## 9. Déjalo para después

Cuando el flujo de arriba sea cómodo, mira reglas de proyecto (`.cursor/rules` o `AGENTS.md`), skills (`/nombre` en el chat) y la vista Agents Window. No hacen falta en la primera hora.

Documentación oficial: [Quickstart](https://cursor.com/docs/get-started/quickstart).
