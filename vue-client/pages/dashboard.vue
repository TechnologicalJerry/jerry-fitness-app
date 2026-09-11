<template>
  <div class="dashboard-page">
    <div class="dashboard-container">
      <!-- Welcome Header -->
      <div class="welcome-header">
        <div class="header-left">
          <div class="avatar-large">{{ userInitials }}</div>
          <div>
            <h1 class="welcome-title">Welcome back, {{ user?.firstName }}! 👋</h1>
            <p class="welcome-subtitle">
              User ID: <code class="code-badge">{{ user?.id }}</code>
            </p>
          </div>
        </div>
        <div class="header-right">
          <span class="role-badge">{{ user?.role || 'MEMBER' }}</span>
          <button @click="handleLogout" class="btn-danger">
            <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      <!-- Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Account Details Card -->
        <div class="card">
          <div class="card-header">
            <div class="icon-circle indigo">
              <svg xmlns="http://www.w3.org/2000/svg" class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2>Account Profile</h2>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">Full Name:</span>
              <span class="info-value">{{ user?.firstName }} {{ user?.lastName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email Address:</span>
              <span class="info-value">{{ user?.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Role Privilege:</span>
              <span class="info-value highlight">{{ user?.role || 'MEMBER' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Auth Provider:</span>
              <span class="info-value">Fastify JWT Bearer</span>
            </div>
          </div>
        </div>

        <!-- Token Session Status Card -->
        <div class="card">
          <div class="card-header">
            <div class="icon-circle violet">
              <svg xmlns="http://www.w3.org/2000/svg" class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2>JWT Session Details</h2>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">Access Token:</span>
              <span class="info-value code-truncate">{{ truncatedAccessToken }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Refresh Token:</span>
              <span class="info-value code-truncate">{{ truncatedRefreshToken }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Token Status:</span>
              <span class="status-active">
                <span class="dot"></span> Active & Authenticated
              </span>
            </div>
            <div class="card-actions">
              <button @click="handleManualRefresh" class="btn-secondary-sm" :disabled="isRefreshingToken">
                {{ isRefreshingToken ? 'Refreshing...' : '🔄 Refresh Tokens Now' }}
              </button>
            </div>
          </div>
        </div>

        <!-- API Integration Test Card -->
        <div class="card full-width">
          <div class="card-header">
            <div class="icon-circle emerald">
              <svg xmlns="http://www.w3.org/2000/svg" class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h2>Fastify Backend API Verification</h2>
          </div>
          <div class="card-body">
            <p class="card-desc">
              Test making an authenticated request to the Fastify server endpoints with your current Bearer token.
            </p>
            <div class="api-controls">
              <button @click="testFetchUsers" class="btn-primary-sm" :disabled="apiTesting">
                {{ apiTesting ? 'Requesting...' : '⚡ Test GET /api/v1/users' }}
              </button>
            </div>
            <div v-if="apiResult" class="api-result">
              <div class="result-header">
                <span>Response Status: {{ apiResultStatus }}</span>
              </div>
              <pre class="json-viewer">{{ JSON.stringify(apiResult, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

const { user, accessToken, refreshTokenValue, logout, refreshToken: triggerTokenRefresh } = useAuth();
const { fetchApi } = useApi();

const isRefreshingToken = ref(false);
const apiTesting = ref(false);
const apiResult = ref<any>(null);
const apiResultStatus = ref<string>('');

const userInitials = computed(() => {
  if (!user.value) return 'U';
  const f = user.value.firstName?.[0] || '';
  const l = user.value.lastName?.[0] || '';
  return (f + l).toUpperCase() || 'U';
});

const truncatedAccessToken = computed(() => {
  if (!accessToken.value) return 'None';
  return `${accessToken.value.substring(0, 18)}...${accessToken.value.substring(accessToken.value.length - 8)}`;
});

const truncatedRefreshToken = computed(() => {
  if (!refreshTokenValue.value) return 'None';
  return `${refreshTokenValue.value.substring(0, 12)}...${refreshTokenValue.value.substring(refreshTokenValue.value.length - 6)}`;
});

const handleLogout = async () => {
  await logout();
};

const handleManualRefresh = async () => {
  isRefreshingToken.value = true;
  try {
    const success = await triggerTokenRefresh();
    if (success) {
      alert('Tokens refreshed successfully!');
    } else {
      alert('Failed to refresh tokens. Please log in again.');
    }
  } catch (err: any) {
    alert(`Token refresh error: ${err.message || err}`);
  } finally {
    isRefreshingToken.value = false;
  }
};

const testFetchUsers = async () => {
  apiTesting.value = true;
  apiResult.value = null;
  try {
    const data = await fetchApi('/users');
    apiResult.value = data;
    apiResultStatus.value = '200 OK (Authenticated Success)';
  } catch (err: any) {
    apiResult.value = err?.data || { error: err.message || err };
    apiResultStatus.value = `${err?.status || 'Error'} (Failed)`;
  } finally {
    apiTesting.value = false;
  }
};
</script>

<style scoped>
.dashboard-page {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.welcome-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #ffffff;
  font-size: 1.4rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.25rem;
}

.welcome-subtitle {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.code-badge {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: #c084fc;
  font-family: monospace;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-badge {
  padding: 0.35rem 0.85rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
  color: #f87171;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  padding: 1.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  backdrop-filter: blur(16px);
}

.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle.indigo {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.icon-circle.violet {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.icon-circle.emerald {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.card-icon {
  width: 20px;
  height: 20px;
}

.card-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
}

.info-label {
  color: #94a3b8;
  font-weight: 500;
}

.info-value {
  color: #f1f5f9;
  font-weight: 600;
}

.info-value.highlight {
  color: #818cf8;
}

.code-truncate {
  font-family: monospace;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: #cbd5e1;
}

.status-active {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #34d399;
  font-weight: 600;
  font-size: 0.85rem;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.card-actions {
  margin-top: 0.5rem;
}

.btn-secondary-sm {
  padding: 0.5rem 0.9rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary-sm:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.card-desc {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0;
}

.api-controls {
  margin-top: 0.5rem;
}

.btn-primary-sm {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-primary-sm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
}

.api-result {
  margin-top: 1rem;
  background: rgba(2, 6, 23, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.result-header {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  font-size: 0.8rem;
  font-weight: 600;
  color: #34d399;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.json-viewer {
  padding: 1rem;
  margin: 0;
  font-family: monospace;
  font-size: 0.8rem;
  color: #e2e8f0;
  overflow-x: auto;
  max-height: 250px;
}
</style>
