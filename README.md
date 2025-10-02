# msg-wb-sockets

API para mensajes con websockets

## Descripción

Sistema de chat en tiempo real usando WebSockets con Socket.IO, Express.js y base de datos LibSQL/Turso.

## Características

- Chat en tiempo real con WebSockets
- Múltiples salas de chat
- Estado de lectura de mensajes
- Avatares automáticos con DiceBear
- API REST para usuarios, salas y mensajes
- Base de datos SQLite/LibSQL

## Configuración

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

### 3. Configurar base de datos

- Para desarrollo local: usa `DATABASE_URL=file:./chat.db`
- Para producción: configura tu URL de Turso/LibSQL

## Scripts disponibles

```bash
# Desarrollo con recarga automática
pnpm dev

# Verificar sintaxis
node --check src/server.js
```

## API Endpoints

### Usuarios

- `POST /api/users/join` - Crear/obtener usuario

### Salas

- `GET /api/rooms` - Listar salas (opcional: ?userId=123 para mensajes no leídos)

### Mensajes

- `GET /api/messages/:roomName` - Obtener mensajes de una sala

## Eventos WebSocket

### Cliente → Servidor

- `join user` - Unirse como usuario
- `join room` - Cambiar de sala
- `chat message` - Enviar mensaje
- `get rooms` - Obtener lista de salas

### Servidor → Cliente

- `user joined` - Usuario se unió
- `message history` - Historial de mensajes
- `chat message` - Nuevo mensaje
- `rooms list` - Lista de salas actualizada
