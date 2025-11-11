# CONECCION AL PROYECTO HOSTEADO
## Frontend
https://startling-wisp-572a63.netlify.app/

## backend
https://silver-chaja-0dc5e9.netlify.app/


## Usuaeio de Prueba
- admin3@gmail.com
- 1234567890


Bookstore Queue

Proyecto CRUD diferido (en cola) para Autores y Editoriales, usando
RabbitMQ (CloudAMQP), Redis, Netlify Functions y Vue 3 + Vite.

🧩 Descripción general

El sistema permite agregar, editar o eliminar autores y editoriales, pero en lugar de guardar los cambios al instante, se envían a una cola (RabbitMQ).
Luego, un proceso los aplica en Redis cuando se ejecuta el comando “Actualizar datos” desde el frontend.

Esto hace que el sistema sea rápido, seguro y preparado para trabajar de forma asíncrona.

🧱 Base de datos

La base de datos utilizada es Redis.
Se guarda la información así:

authors:<id> → datos de cada autor

publishers:<id> → datos de cada editorial

authors:all / publishers:all → listas de todos los IDs

seq:authors / seq:publishers → contador para generar nuevos IDs

Ejemplo:

{
  "id": 1,
  "nombre": "Isabel Allende",
  "bibliografia": "Escritora chilena; autora de 'La casa de los espíritus'."
}

⚙️ Variables de entorno

En Netlify o .env local, se configuran:

CLOUDAMQP_URL=amqps://<user>:<pass>@<host>/<vhost>
QUEUE_NAME=bookstore
MAX_BATCH=50


🚀 Flujo de funcionamiento

El usuario crea, edita o elimina autores/editoriales.

El cambio se envía a RabbitMQ (no se guarda todavía).

Al presionar “Actualizar datos”, el backend:

Toma los mensajes de la cola.

Aplica los cambios en Redis.

Notifica al frontend que actualice las listas.

🧩 Endpoints principales
Acción	Método y ruta	Descripción
Encolar autores	POST /api/queue-authors	Envía cambios de autores a la cola
Listar autores	GET /api/authors-get	Muestra autores guardados en Redis
Encolar editoriales	POST /api/queue-publishers	Envía cambios de editoriales a la cola
Listar editoriales	GET /api/publishers-get	Muestra editoriales guardadas
Procesar cola	POST /api/run-queue	Ejecuta los cambios pendientes
💻 Estructura del proyecto
bookstore-queue/
├─ functions/          # Backend (Netlify)
│  ├─ queue-authors.ts
│  ├─ authors-get.ts
│  ├─ queue-publishers.ts
│  ├─ publishers-get.ts
│  ├─ run-queue.ts
│  └─ _lib/
│     ├─ mq.ts         # Conexión RabbitMQ
│     ├─ redis.ts      # Conexión Redis
│     ├─ store-redis.ts
│     └─ schema.ts
├─ web/                # Frontend (Vue 3 + Vite)
│  ├─ components/
│  ├─ api/
│  └─ main.ts
└─ netlify.toml

🧰 Comandos útiles
# Instalar dependencias
npm install
cd web && npm install

# Correr backend local
netlify dev

# Correr frontend local
cd web && npm run dev

# Generar build
cd web && npm run build
