<script lang="ts" setup>
</script>

<template>
  <nav>
    <RouterLink :to="{ name: 'home' }">
      Home
    </RouterLink>
    <span> | </span>
    <RouterLink :to="{ name: 'about' }">
      About
    </RouterLink>
  </nav>
  <RouterView />
</template>

<style scoped>
nav {
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
