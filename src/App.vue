<script setup lang="ts">
import { ref } from "vue";
import AuthorsPanel from "./components/AuthorsPanel.vue";
import PublishersPanel from "./components/PublishersPanel.vue";
import LoginPanel from "./components/LoginPanel.vue"; // 👈 Importamos el panel de login
import { runQueue } from "./api";
import { getUser, logout } from "./api"; // 👈 Importamos helpers para sesión

const user = ref(getUser()); // 👈 Intentamos cargar usuario desde localStorage
const lastRun = ref<string>("—");
const isProcessing = ref(false);

async function actualizarDatos() {
  if (isProcessing.value) return;
  
  try {
    isProcessing.value = true;
    const res = await runQueue();
    lastRun.value = `✅ Procesados: ${res.processed} elementos (${new Date().toLocaleTimeString()})`;
    window.dispatchEvent(new CustomEvent("refresh-data"));
  } catch (error) {
    lastRun.value = `❌ Error al procesar la cola (${new Date().toLocaleTimeString()})`;
    console.error("Error processing queue:", error);
  } finally {
    isProcessing.value = false;
  }
}

// Escuchamos evento cuando el login sea exitoso
window.addEventListener("auth:login", (e: any) => {
  user.value = e.detail; // Actualizamos sesión
});

// Logout simple (puedes ponerlo en un botón)
function cerrarSesion() {
  logout();
  user.value = null;
}
</script>

<template>
  <div class="app">
    <!-- Si no hay usuario, mostramos el login -->
    <LoginPanel v-if="!user" />

    <!-- Si el usuario ya inició sesión, mostramos la app -->
    <template v-else>
      <div class="bg-decoration"></div>

      <main class="main-container">
        <header class="app-header">
          <div class="header-content">
            <div class="title-section">
              <h1 class="main-title">
                <span class="title-icon">📚</span>
                Bookstore Management
              </h1>
              <p class="subtitle">
                Sistema de gestión con procesamiento diferido usando CloudAMQP
              </p>
            </div>

            <div class="actions-section">
              <button 
                @click="actualizarDatos" 
                class="process-btn"
                :disabled="isProcessing"
                :class="{ 'processing': isProcessing }"
              >
                <span class="btn-icon" :class="{ spinning: isProcessing }">
                  {{ isProcessing ? '⏳' : '🚀' }}
                </span>
                {{ isProcessing ? 'Procesando...' : 'Procesar Cola' }}
              </button>

              <div class="status-info">
                <span class="status-label">Último procesamiento:</span>
                <span class="status-value" :class="{ 
                  success: lastRun.includes('✅'), 
                  error: lastRun.includes('❌'),
                  neutral: lastRun === '—'
                }">
                  {{ lastRun }}
                </span>
              </div>

              <!-- Botón de cierre de sesión -->
              <button @click="cerrarSesion" class="btn-logout">🔓 Cerrar Sesión</button>
            </div>
          </div>

          <div class="connection-indicator">
            <span class="connection-dot"></span>
            <span class="connection-text">CloudAMQP Conectado</span>
          </div>
        </header>

        <div class="panels-container">
          <div class="panel-wrapper">
            <AuthorsPanel />
          </div>
          <div class="panel-wrapper">
            <PublishersPanel />
          </div>
        </div>

        <footer class="app-footer">
          <div class="footer-content">
            <span class="footer-text">Sistema de gestión con cola de mensajes</span>
            <div class="tech-stack">
              <span class="tech-badge">Vue.js</span>
              <span class="tech-badge">TypeScript</span>
              <span class="tech-badge">CloudAMQP</span>
            </div>
          </div>
        </footer>
      </main>
    </template>
  </div>
</template>

<style scoped>
/* 👇 agregado: botón de logout */
.btn-logout {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}
.btn-logout:hover {
  background: #dc2626;
  transform: scale(1.05);
}

/* mantiene tus estilos originales */
@import "./style-app.css";
</style>
