<script setup lang="ts">
import { ref, computed } from "vue";

type LoginBody = { gmail: string; password: string };
type LoginOk = { _id: string; gmail: string; name: string | null };
type LoginErr = { error: string };

const gmail = ref("");
const password = ref("");
const showPassword = ref(false);

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().toLowerCase());

const isFormValid = computed(() => {
    return isValidEmail(gmail.value) && password.value.trim().length >= 4;
});

function clearMessages() {
    error.value = null;
    success.value = null;
}

async function doLogin() {
    if (!isFormValid.value || loading.value) return;
    clearMessages();
    loading.value = true;

    const body: LoginBody = {
        gmail: gmail.value.trim().toLowerCase(),
        password: password.value,
    };

    try {
        const res = await fetch(`${API_BASE}/.netlify/functions/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = (await res.json()) as LoginOk | LoginErr;

        if (!res.ok) {
            throw new Error((data as LoginErr)?.error || "Error de autenticación");
        }

        localStorage.setItem("auth:user", JSON.stringify(data));
        success.value = "¡Inicio de sesión exitoso!";
    } catch (e: any) {
        error.value =
            e?.message === "Failed to fetch"
                ? "No se pudo contactar al servidor"
                : e?.message || "Error de autenticación";
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <section class="login-wrapper">
        <div class="card">
            <header class="card-header">
                <h2 class="title">
                    <span class="icon">🔐</span>
                    Iniciar Sesión
                </h2>
                <p class="subtitle">Accede con tu correo y contraseña</p>
            </header>

            <div v-if="error" class="alert alert-error">
                <span class="alert-icon">❌</span>
                <span>{{ error }}</span>
            </div>

            <div v-if="success" class="alert alert-success">
                <span class="alert-icon">✅</span>
                <span>{{ success }}</span>
            </div>

            <form class="form" @submit.prevent="doLogin">
                <div class="form-group">
                    <label for="gmail">Correo</label>
                    <input id="gmail" type="email" v-model="gmail" autocomplete="email"
                        placeholder="tucorreo@dominio.com"
                        :class="{ invalid: gmail && !gmail.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/) }" required />
                    <small class="hint">Ej: usuario@gmail.com</small>
                </div>

                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <div class="password-box">
                        <input id="password" :type="showPassword ? 'text' : 'password'" v-model="password"
                            autocomplete="current-password" placeholder="••••••••" minlength="4" required />
                        <button type="button" class="toggle-btn" @click="showPassword = !showPassword"
                            :aria-pressed="showPassword" :title="showPassword ? 'Ocultar' : 'Mostrar'">
                            {{ showPassword ? "🙈" : "👁️" }}
                        </button>
                    </div>
                    <small class="hint">Mínimo 4 caracteres</small>
                </div>

                <button class="btn btn-primary" type="submit" :disabled="!isFormValid || loading">
                    <span v-if="loading" class="spinner" aria-hidden="true">⏳</span>
                    {{ loading ? "Ingresando..." : "Ingresar" }}
                </button>
            </form>

            <footer class="card-footer">
                <small>
                    ¿Problemas para entrar? Verifica tu conexión y credenciales.
                </small>
            </footer>
        </div>
    </section>
</template>

<style scoped>
.login-wrapper {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 1rem;
    background:
        radial-gradient(1200px 600px at 10% -10%, #f3e8ff 0%, transparent 60%),
        radial-gradient(1000px 600px at 110% 110%, #e0e7ff 0%, transparent 60%),
        #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card {
    width: 100%;
    max-width: 440px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);
}

.card-header {
    text-align: center;
    margin-bottom: 1rem;
}

.title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 700;
    color: #7c3aed;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
}

.icon {
    font-size: 1.4rem;
}

.subtitle {
    color: #6b7280;
    margin-top: 0.25rem;
}

.alert {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.75rem 0.9rem;
    border-radius: 10px;
    margin: 0.5rem 0 0.75rem;
    font-weight: 500;
}

.alert-icon {
    font-size: 1.1rem;
}

.alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
}

.alert-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
}

.form {
    display: grid;
    gap: 1rem;
}

.form-group {
    display: grid;
    gap: 0.4rem;
}

label {
    font-weight: 600;
    color: #374151;
}

input {
    width: 100%;
    padding: 0.75rem 0.9rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    font-size: 1rem;
    transition: box-shadow 0.2s, border-color 0.2s;
    background: #fff;
}

input:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

input.invalid {
    border-color: #dc2626;
}

.password-box {
    position: relative;
    display: grid;
}

.toggle-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    translate: 0 -50%;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1.1rem;
}

.hint {
    color: #6b7280;
    font-size: 0.8rem;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .8rem 1rem;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-weight: 700;
    font-size: 1rem;
    transition: transform .15s, box-shadow .15s, opacity .15s;
}

.btn:disabled {
    opacity: .6;
    cursor: not-allowed;
}

.btn-primary {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: #fff;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(109, 40, 217, .25);
}

.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.card-footer {
    margin-top: .75rem;
    text-align: center;
    color: #6b7280;
}
</style>
