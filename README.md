# Minecraft Portal Network Planner (MVP)

Simple Next.js + TypeScript MVP to plan portal networks (Overworld + Nether).

Tech: Next.js (App Router), React, react-konva, Zustand, Tailwind.

Quick start

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar en desarrollo:

```bash
npm run dev
```

Cómo funciona (resumen técnico)

- Los `Portal` y `PathSegment` se almacenan en el `Zustand` store y se persisten en `localStorage` con la key `rm:worldstate:v1`.
- El grafo se construye en `/lib/graph.ts` creando nodos para cada portal y para cada vértice de cada path. Las aristas entre puntos consecutivos usan peso = distancia euclidiana * `costMultiplier`.
- Se añaden aristas "virtuales" entre un portal y el nodo de path más cercano en la misma dimensión con coste aumentado (multiplicador 3) para representar construir conexión nueva.
- `dijkstra` en `/lib/dijkstra.ts` devuelve la distancia y la lista de nodos que conforman la ruta.
- El canvas usa `react-konva` para pan/zoom y dibujado básico de grid, portales y paths.

Funcionalidades incluidas (MVP)

- Dos pestañas: Overworld / Nether.
- Placer portales mediante UI (Sidebar y formulario).
- Dibujar paths (modo dibujo básico, cada punto es un nodo).
- Crear portal enlazado en la otra dimensión con regla 8:1 (botón en el formulario puede usarse para extensión).
- Import / Export JSON para persistencia manual.

Notas y próximas mejoras

- Mejorar UI/UX para dibujar paths y selección de inicio/fin para rutas.
- Añadir resaltado de ruta elegido y la opción "Propose next connection" (funciones de helpers ya listas en /lib).
- Mejor manejo de etiquetas en Konva y rendimiento del grid.

Si quieres, continúo implementando: selección de dos portales y cálculo/visualización de ruta completa, y el botón "Propose next connection".
# roads-mine