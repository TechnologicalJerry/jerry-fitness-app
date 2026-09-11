<template>
  <div class="home-container">
    <div class="hero-card">
      <div class="pill-badge">
        <span class="pulse"></span>
        Fastify Auth Protocol v1
      </div>
      
      <h1 class="hero-title">
        Elevate Your Fitness Journey with <span class="gradient-text">Jerry Fitness</span>
      </h1>
      
      <p class="hero-subtitle">
        Secure, high-performance authentication architecture integrated seamlessly with Fastify JWT services. Track your progress, manage goals, and level up today.
      </p>

      <div class="cta-group">
        <template v-if="isAuthenticated">
          <NuxtLink to="/dashboard" class="btn-primary-lg">
            Go to Dashboard &rarr;
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/register" class="btn-primary-lg">
            Get Started Now
          </NuxtLink>
          <NuxtLink to="/login" class="btn-secondary-lg">
            Sign In to Account
          </NuxtLink>
        </template>
      </div>

      <!-- Feature Grid -->
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon indigo">🔐</div>
          <h3>JWT Security</h3>
          <p>Short-lived access tokens with automatic 7-day refresh token rotation.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon violet">⚡</div>
          <h3>Fastify Engine</h3>
          <p>Powered by high-throughput Fastify v5 REST backend microservices.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon emerald">📈</div>
          <h3>Fitness Metrics</h3>
          <p>Comprehensive tracking of workouts, adherence, and daily recovery.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated } = useAuth();
</script>

<style scoped>
.home-container {
  max-width: 1100px;
  margin: 3rem auto;
  padding: 0 1.5rem;
}

.hero-card {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 1rem;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 9999px;
  color: #a5b4fc;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
  box-shadow: 0 0 8px #6366f1;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.15;
  color: #f8fafc;
  max-width: 800px;
  margin: 0 auto 1.25rem;
  letter-spacing: -0.03em;
}

.gradient-text {
  background: linear-gradient(135deg, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.15rem;
  color: #94a3b8;
  max-width: 650px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
}

.cta-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 4rem;
}

.btn-primary-lg {
  padding: 0.85rem 2rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  border-radius: 12px;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 700;
  transition: all 0.25s ease;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-primary-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(99, 102, 241, 0.5);
}

.btn-secondary-lg {
  padding: 0.85rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  border-radius: 12px;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.25s ease;
}

.btn-secondary-lg:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  text-align: left;
}

.feature-card {
  padding: 1.75rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  transition: border-color 0.2s;
}

.feature-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
}

.feature-icon {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
}

.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.5rem;
}

.feature-card p {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}
</style>
