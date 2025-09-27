<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { listAuthors, enqueueAuthor } from "../api";
import type { Author } from "../types";

const authors = ref<Author[]>([]);
const form = ref<Author>({ name: "", bio: "" });
const editing = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const actionInProgress = ref<string | null>(null);

const isFormValid = computed(() => form.value.name.trim().length > 0);

async function load() { 
  try {
    loading.value = true;
    error.value = null;
    authors.value = await listAuthors(); 
  } catch (err) {
    error.value = "Error al cargar los autores. Por favor, intenta nuevamente.";
    console.error("Error loading authors:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  window.addEventListener('refresh-data', load as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('refresh-data', load as EventListener);
});

function showSuccess(message: string) {
  successMessage.value = message;
  setTimeout(() => successMessage.value = null, 4000);
}

function showActionInProgress(action: string) {
  actionInProgress.value = action;
  setTimeout(() => actionInProgress.value = null, 2000);
}

function clearMessages() {
  error.value = null;
  successMessage.value = null;
  actionInProgress.value = null;
}

async function add() {
  if (!isFormValid.value) return;
  
  try {
    clearMessages();
    showActionInProgress(`Agregando "${form.value.name}" a la cola de procesamiento...`);
    
    await enqueueAuthor("create", { ...form.value });
    form.value = { name: "", bio: "" };
    showSuccess(`✅ "${form.value.name || 'Nuevo autor'}" agregado exitosamente a la cola`);
  } catch (err) {
    error.value = "Error al agregar el autor. Por favor, intenta nuevamente.";
    console.error("Error adding author:", err);
  }
}

function startEdit(a: Author) {
  clearMessages();
  editing.value = a._id!;
  form.value = { _id: a._id, name: a.name, bio: a.bio };
}

function cancelEdit() {
  editing.value = null;
  form.value = { name: "", bio: "" };
  clearMessages();
}

async function saveEdit() {
  if (!isFormValid.value) return;
  
  try {
    clearMessages();
    const authorName = form.value.name;
    showActionInProgress(`Guardando cambios de "${authorName}"...`);
    
    await enqueueAuthor("update", { ...form.value });
    editing.value = null;
    form.value = { name: "", bio: "" };
    showSuccess(`✅ Cambios de "${authorName}" guardados en la cola`);
  } catch (err) {
    error.value = "Error al guardar los cambios. Por favor, intenta nuevamente.";
    console.error("Error updating author:", err);
  }
}

async function remove(a: Author) {
  if (!confirm(`¿Estás seguro de que deseas eliminar a "${a.name}"?`)) {
    return;
  }
  
  try {
    clearMessages();
    showActionInProgress(`Eliminando "${a.name}"...`);
    
    await enqueueAuthor("delete", { _id: a._id });
    showSuccess(`🗑️ "${a.name}" marcado para eliminación`);
  } catch (err) {
    error.value = "Error al eliminar el autor. Por favor, intenta nuevamente.";
    console.error("Error deleting author:", err);
  }
}
</script>

<template>
  <section class="authors-section">
    <div class="header">
      <h2 class="title">
        <span class="icon">✍️</span>
        Gestión de Autores
      </h2>
      <p class="subtitle">Sistema de procesamiento diferido</p>
    </div>

    <!-- Mensaje informativo -->
    <div class="info-banner">
      <span class="info-icon">ℹ️</span>
      <div>
        <strong>Procesamiento en Cola:</strong> Las operaciones se procesan de forma asíncrona. 
        Los cambios pueden tardar unos momentos en aparecer.
      </div>
    </div>

    <!-- Mensajes de estado -->
    <div v-if="actionInProgress" class="message progress-message">
      <span class="message-icon loading-spinner">⏳</span>
      {{ actionInProgress }}
    </div>
    
    <div v-if="error" class="message error-message">
      <span class="message-icon">❌</span>
      {{ error }}
    </div>
    
    <div v-if="successMessage" class="message success-message">
      <span class="message-icon">✅</span>
      {{ successMessage }}
    </div>

    <!-- Formulario -->
    <form @submit.prevent="editing ? saveEdit() : add()" class="form-container">
      <div class="form-header">
        <h3>{{ editing ? "Editar Autor" : "Nuevo Autor" }}</h3>
      </div>
      
      <div class="form-row">
        <div class="input-group">
          <label for="name">Nombre *</label>
          <input 
            id="name"
            v-model="form.name" 
            placeholder="Ingresa el nombre del autor" 
            required 
            :class="{ 'error': form.name.trim() === '' && form.name !== '' }"
          />
        </div>
        
        <div class="input-group">
          <label for="bio">Biografía</label>
          <input 
            id="bio"
            v-model="form.bio" 
            placeholder="Biografía opcional del autor" 
          />
        </div>
      </div>
      
      <div class="form-actions">
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="!isFormValid"
        >
          <span class="btn-icon">{{ editing ? "💾" : "➕" }}</span>
          {{ editing ? "Guardar Cambios" : "Agregar Autor" }}
          <small>(en cola)</small>
        </button>
        
        <button 
          v-if="editing" 
          type="button" 
          @click="cancelEdit"
          class="btn btn-secondary"
        >
          <span class="btn-icon">❌</span>
          Cancelar
        </button>
      </div>
    </form>

    <!-- Lista de autores -->
    <div class="authors-container">
      <div class="authors-header">
        <h3>Autores Registrados</h3>
        <span class="authors-count">{{ authors.length }} autor(es)</span>
      </div>
      
      <div v-if="loading" class="loading-state">
        <span class="loading-icon">⏳</span>
        Cargando autores...
      </div>
      
      <div v-else-if="authors.length === 0" class="empty-state">
        <span class="empty-icon">📚</span>
        <p>No hay autores registrados</p>
        <p class="empty-subtitle">Agrega el primer autor usando el formulario de arriba</p>
      </div>
      
      <ul v-else class="authors-list">
        <li v-for="a in authors" :key="a._id" class="author-item">
          <div class="author-info">
            <h4 class="author-name">{{ a.name }}</h4>
            <p class="author-bio">{{ a.bio || "Sin biografía" }}</p>
          </div>
          
          <div class="author-actions">
            <button 
              @click="startEdit(a)" 
              class="btn btn-sm btn-outline"
              :disabled="editing === a._id"
            >
              <span class="btn-icon">✏️</span>
              Editar
            </button>
            
            <button 
              @click="remove(a)" 
              class="btn btn-sm btn-danger"
            >
              <span class="btn-icon">🗑️</span>
              Eliminar
            </button>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.authors-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 2rem;
  color: #2563eb;
  font-weight: 600;
}

.icon {
  font-size: 1.8rem;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  border: 1px solid #bfdbfe;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-icon {
  font-size: 1.1rem;
  margin-top: 0.1rem;
}

.message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.error-message {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.message-icon {
  font-size: 1.1rem;
}

.success-message {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.form-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-header h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.input-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-group input.error {
  border-color: #dc2626;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-outline {
  background: transparent;
  color: #2563eb;
  border: 1px solid #2563eb;
}

.btn-outline:hover {
  background: #2563eb;
  color: white;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.btn small {
  opacity: 0.8;
  font-size: 0.75rem;
}

.btn-icon {
  font-size: 0.9rem;
}

.authors-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.authors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.authors-header h3 {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

.authors-count {
  background: #e5e7eb;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #6b7280;
}

.loading-icon, .empty-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0;
}

.empty-subtitle {
  font-size: 0.875rem;
  opacity: 0.8;
  margin-top: 0.5rem !important;
}

.authors-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.author-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.author-item:hover {
  background-color: #f9fafb;
}

.author-item:last-child {
  border-bottom: none;
}

.author-info {
  flex: 1;
  min-width: 0;
}

.author-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.author-bio {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.author-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

@media (max-width: 640px) {
  .authors-section {
    padding: 1rem;
  }
  
  .author-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .author-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>