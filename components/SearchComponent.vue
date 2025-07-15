<script setup lang="ts">
const query = ref("");
const router = useRouter();

function submit(query: string) {
  router.replace(`/search?query=${encodeURI(query)}`);
}
</script>

<template>
  <form class="input" style="outline: none" @submit="() => submit(query)">
    <icon name="oui:search" />
    <input type="search" class="grow" placeholder="Введите название" v-model="query" />
    <kbd class="btn kbd kbd-sm" @click="() => submit(query)">Enter</kbd>
  </form>
</template>
