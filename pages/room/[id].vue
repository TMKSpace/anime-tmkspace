<script setup lang="ts">
const route = useRoute()

console.log(route.params.id)
</script>
<template>
  <div>
    <h1 class="text-9xl">
      {{ route.params.id }}
    </h1>
    <h2 class="text-9xl">Сосал?</h2>
  </div>
</template>