<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { enqueuePublisher, listPublishers } from "../api";
import type { Publisher } from "../types";

const items = ref<Publisher[]>([]);
const form = ref<Publisher>({ name: "", country: "" });
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
    items.value = await listPublishers(); 
  } catch (err) {
    error.value = "Error al cargar las editoriales. Por favor, intenta nuevamente.";
    console.error("Error loading publishers:", err);
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
    const publisherName = form.value.name;
    showActionInProgress(`Agregando editorial "${publisherName}" a la cola de procesamiento...`);
    
    await enqueuePublisher("create", { ...form.value });
    form.value = { name: "", country: "" };
    showSuccess(`✅ Editorial "${publisherName}" agregada exitosamente a la cola`);
  } catch (err) {
    error.value = "Error al agregar la editorial. Por favor, intenta nuevamente.";
    console.error("Error adding publisher:", err);
  }
}

function startEdit(p: Publisher) {
  clearMessages();
  editing.value = p._id!;
  form.value = { _id: p._id, name: p.name, country: p.country };
}

function cancelEdit() {
  editing.value = null;
  form.value = { name: "", country: "" };
  clearMessages();
}

async function saveEdit() {
  if (!isFormValid.value) return;
  
  try {
    clearMessages();
    const publisherName = form.value.name;
    showActionInProgress(`Guardando cambios de la editorial "${publisherName}"...`);
    
    await enqueuePublisher("update", { ...form.value });
    editing.value = null;
    form.value = { name: "", country: "" };
    showSuccess(`✅ Cambios de "${publisherName}" guardados en la cola`);
  } catch (err) {
    error.value = "Error al guardar los cambios. Por favor, intenta nuevamente.";
    console.error("Error updating publisher:", err);
  }
}

async function remove(p: Publisher) {
  if (!confirm(`¿Estás seguro de que deseas eliminar la editorial "${p.name}"?`)) {
    return;
  }
  
  try {
    clearMessages();
    showActionInProgress(`Eliminando editorial "${p.name}"...`);
    
    await enqueuePublisher("delete", { _id: p._id });
    showSuccess(`🗑️ Editorial "${p.name}" marcada para eliminación`);
  } catch (err) {
    error.value = "Error al eliminar la editorial. Por favor, intenta nuevamente.";
    console.error("Error deleting publisher:", err);
  }
}
</script>

<template>
  <section class="publishers-section">
    <div class="header">
      <h2 class="title">
        <span class="icon">🏢</span>
        Gestión de Editoriales
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
        <h3>{{ editing ? "Editar Editorial" : "Nueva Editorial" }}</h3>
      </div>
      
      <div class="form-row">
        <div class="input-group">
          <label for="name">Nombre *</label>
          <input 
            id="name"
            v-model="form.name" 
            placeholder="Ingresa el nombre de la editorial" 
            required 
            :class="{ 'error': form.name.trim() === '' && form.name !== '' }"
          />
        </div>
        
        <div class="input-group">
          <label for="country">País</label>
          <input 
            id="country"
            v-model="form.country" 
            placeholder="País de origen (opcional)" 
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
          {{ editing ? "Guardar Cambios" : "Agregar Editorial" }}
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

    <!-- Lista de editoriales -->
    <div class="publishers-container">
      <div class="publishers-header">
        <h3>Editoriales Registradas</h3>
        <span class="publishers-count">{{ items.length }} editorial(es)</span>
      </div>
      
      <div v-if="loading" class="loading-state">
        <span class="loading-icon">⏳</span>
        Cargando editoriales...
      </div>
      
      <div v-else-if="items.length === 0" class="empty-state">
        <span class="empty-icon">🏢</span>
        <p>No hay editoriales registradas</p>
        <p class="empty-subtitle">Agrega la primera editorial usando el formulario de arriba</p>
      </div>
      
      <ul v-else class="publishers-list">
        <li v-for="p in items" :key="p._id" class="publisher-item">
          <div class="publisher-info">
            <h4 class="publisher-name">{{ p.name }}</h4>
            <p class="publisher-country">
              <span class="country-icon">🌍</span>
              {{ p.country || "País no especificado" }}
            </p>
          </div>
          
          <div class="publisher-actions">
            <button 
              @click="startEdit(p)" 
              class="btn btn-sm btn-outline"
              :disabled="editing === p._id"
            >
              <span class="btn-icon">✏️</span>
              Editar
            </button>
            
            <button 
              @click="remove(p)" 
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
.publishers-section {
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
  color: #7c3aed;
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
  background: linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%);
  border: 1px solid #c4b5fd;
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

.progress-message {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #fbbf24;
  animation: pulse 1.5s ease-in-out infinite;
}

.error-message {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.message-icon {
  font-size: 1.1rem;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
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
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
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
  color: #7c3aed;
  border: 1px solid #7c3aed;
}

.btn-outline:hover {
  background: #7c3aed;
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

.publishers-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.publishers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.publishers-header h3 {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

.publishers-count {
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

.publishers-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.publisher-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.publisher-item:hover {
  background-color: #f9fafb;
}

.publisher-item:last-child {
  border-bottom: none;
}

.publisher-info {
  flex: 1;
  min-width: 0;
}

.publisher-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.publisher-country {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.country-icon {
  font-size: 0.8rem;
}

.publisher-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

@media (max-width: 640px) {
  .publishers-section {
    padding: 1rem;
  }
  
  .publisher-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .publisher-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>