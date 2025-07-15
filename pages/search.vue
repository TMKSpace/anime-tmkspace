<script setup lang="ts">
import SearchComponent from "~/components/SearchComponent.vue";

const route = useRoute();
const query = route.query.query;
</script>

<template>
  <div class="h-screen">
    <div class="w-screen p-3 bg-base-200">
      <SearchComponent class="w-1/2 left-1/2 -translate-x-1/2" />
    </div>
    <h1 class="text-6xl text-center">{{ query }}</h1>
  </div>
</template>
