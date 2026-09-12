<template>
  <header class="header">
    <div class="header-container">
      <!-- Brand Logo -->
      <NuxtLink to="/" class="brand-logo">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6.5 6.5 11 11" />
            <path d="m21 21-1-1" />
            <path d="m3 3 1 1" />
            <path d="m18 22 4-4" />
            <path d="m2 6 4-4" />
            <path d="m3 10 7-7" />
            <path d="m14 21 7-7" />
          </svg>
        </div>
        <span class="brand-text">Jerry<span class="accent-text">Fitness</span></span>
      </NuxtLink>

      <!-- Navigation Links -->
      <nav class="nav-menu">
        <NuxtLink to="/" class="nav-link" active-class="active">Home</NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/dashboard" class="nav-link" active-class="active">
          Dashboard
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/daily-plan" class="nav-link" active-class="active">
          Daily Plan
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/training-recovery" class="nav-link" active-class="active">
          Training & Recovery
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/goals" class="nav-link" active-class="active">
          Goals
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/analytics" class="nav-link" active-class="active">
          Analytics
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/search" class="nav-link" active-class="active">
          Exercise Library
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/profile" class="nav-link" active-class="active">
          Profile
        </NuxtLink>
      </nav>

      <!-- Auth Actions -->
      <div class="auth-actions">
        <template v-if="isAuthenticated">
          <div class="user-badge">
            <div class="avatar">{{ userInitials }}</div>
            <div class="user-info">
              <span class="user-name">{{ user?.firstName }} {{ user?.lastName }}</span>
              <span class="user-role">{{ user?.role || 'MEMBER' }}</span>
            </div>
          </div>
          <button @click="handleLogout" class="btn-logout" title="Sign out">
            <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="btn-secondary">Sign In</NuxtLink>
          <NuxtLink to="/register" class="btn-primary">Register</NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, isAuthenticated, logout } = useAuth();

const userInitials = computed(() => {
  if (!user.value) return 'U';
  const f = user.value.firstName?.[0] || '';
  const l = user.value.lastName?.[0] || '';
  return (f + l).toUpperCase() || 'U';
});

const handleLogout = async () => {
  await logout();
};
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
}

.logo-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.icon {
  width: 20px;
  height: 20px;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.02em;
}

.accent-text {
  color: #818cf8;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.active {
  color: #f8fafc;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.35rem 0.75rem 0.35rem 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #9333ea);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.2;
}

.user-role {
  font-size: 0.7rem;
  color: #a5b4fc;
  font-weight: 500;
}

.btn-primary {
  padding: 0.5rem 1.1rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.btn-secondary {
  padding: 0.5rem 1.1rem;
  background: transparent;
  color: #cbd5e1;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.22);
  color: #f87171;
}

.btn-icon {
  width: 16px;
  height: 16px;
}
</style>
