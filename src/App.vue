<script setup lang="ts">
import AuthorsPanel from "./components/AuthorsPanel.vue";
import PublishersPanel from "./components/PublishersPanel.vue";
import { runQueue } from "./api";
import { ref } from "vue";

const lastRun = ref<string>("—");
const isProcessing = ref(false);

async function actualizarDatos() {
  if (isProcessing.value) return;
  
  try {
    isProcessing.value = true;
    const res = await runQueue();
    lastRun.value = `✅ Procesados: ${res.processed} elementos (${new Date().toLocaleTimeString()})`;
    window.dispatchEvent(new CustomEvent('refresh-data'));
  } catch (error) {
    lastRun.value = `❌ Error al procesar la cola (${new Date().toLocaleTimeString()})`;
    console.error("Error processing queue:", error);
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <div class="app">
    <!-- Fondo decorativo -->
    <div class="bg-decoration"></div>
    
    <main class="main-container">
      <header class="app-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="main-title">
              <span class="title-icon">📚</span>
              Bookstore Management
            </h1>
            <p class="subtitle">Sistema de gestión con procesamiento diferido usando CloudAMQP</p>
          </div>
          
          <div class="actions-section">
            <button 
              @click="actualizarDatos" 
              class="process-btn"
              :disabled="isProcessing"
              :class="{ 'processing': isProcessing }"
            >
              <span class="btn-icon" :class="{ 'spinning': isProcessing }">
                {{ isProcessing ? '⏳' : '🚀' }}
              </span>
              {{ isProcessing ? 'Procesando...' : 'Procesar Cola' }}
            </button>
            
            <div class="status-info">
              <span class="status-label">Último procesamiento:</span>
              <span class="status-value" :class="{ 
                'success': lastRun.includes('✅'), 
                'error': lastRun.includes('❌'),
                'neutral': lastRun === '—'
              }">
                {{ lastRun }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Indicador de conexión -->
        <div class="connection-indicator">
          <span class="connection-dot"></span>
          <span class="connection-text">CloudAMQP Conectado</span>
        </div>
      </header>

      <!-- Paneles principales -->
      <div class="panels-container">
        <div class="panel-wrapper">
          <AuthorsPanel />
        </div>
        
        <div class="panel-wrapper">
          <PublishersPanel />
        </div>
      </div>
      
      <!-- Footer -->
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
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.main-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  gap: 2rem;
  min-height: 100vh;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.header-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: center;
}

@media (max-width: 768px) {
  .header-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.main-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-icon {
  font-size: 2.2rem;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
  font-weight: 500;
}

.actions-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .actions-section {
    align-items: center;
    text-align: center;
  }
}

.process-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
}

.process-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.process-btn:hover:not(:disabled)::before {
  left: 100%;
}

.process-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.process-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.process-btn.processing {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: right;
}

@media (max-width: 768px) {
  .status-info {
    text-align: center;
  }
}

.status-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.status-value {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.status-value.success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-value.error {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-value.neutral {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.connection-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #10b981;
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.connection-text {
  font-size: 0.875rem;
  color: #10b981;
  font-weight: 500;
}

.panels-container {
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .panels-container {
    grid-template-columns: 1fr 1fr;
  }
}

.panel-wrapper {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 0;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.panel-wrapper:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 40px rgba(31, 38, 135, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.app-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 1.5rem 2rem;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

@media (max-width: 640px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

.footer-text {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.tech-stack {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tech-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}

:deep(.authors-section),
:deep(.publishers-section) {
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 1.5rem;
}

:deep(.form-container),
:deep(.authors-container),
:deep(.publishers-container) {
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

:deep(.info-banner) {
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.8) 0%, rgba(224, 231, 255, 0.8) 100%);
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .main-container {
    padding: 1rem;
  }
  
  .app-header {
    padding: 1.5rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .panels-container {
    grid-template-columns: 1fr;
  }
}
</style>