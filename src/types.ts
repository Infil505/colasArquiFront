// Entidades principales
export type Author = {
  _id?: string;
  name: string;
  bio?: string;
};

export type Publisher = {
  _id?: string;
  name: string;
  country?: string;
};

// Usuario (para login y autenticación)
export type User = {
  _id?: string;
  gmail: string;
  password: string;
  name: string;
};

// Tipos de acciones permitidas en las colas
export type Action = "create" | "update" | "delete";

// Respuesta genérica del servidor (para funciones en Netlify)
export type ApiResponse<T> = {
  data?: T;
  error?: string;
};

// Resultado del login exitoso
export type LoginResponse = {
  _id: string;
  gmail: string;
  name: string;
};
