<script setup lang="ts">
import SearchComponent from "~/components/SearchComponent.vue";
</script>

<template>
  <div class="h-screen">
    <div class="hero bg-base-200 min-h-screen">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-3xl pb-5">Поиск по базе <a href="https://kodik.biz" class="text-primary">Kodik'a</a></h1>
          <!---->
          <SearchComponent />
          <!---->
        </div>
      </div>
    </div>
  </div>
</template>
