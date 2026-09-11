<template>
  <div class="layout-wrapper">
    <AppHeader />
    <main class="main-content">
      <slot />
    </main>
    <footer class="footer">
      <p>&copy; 2026 Jerry Fitness App &bull; Powered by Fastify Auth Engine</p>
    </footer>
  </div>
</template>

<style>
/* Global Dark Theme Styles */
:root {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color-scheme: dark;
  background-color: #090d16;
  color: #f1f5f9;
}

body {
  margin: 0;
  padding: 0;
  background-color: #090d16;
  min-height: 100vh;
}

.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
}

.main-content {
  flex: 1;
  width: 100%;
}

.footer {
  text-align: center;
  padding: 1.5rem;
  font-size: 0.85rem;
  color: #64748b;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
