<script setup lang="ts">
const query = ref("");
const router = useRouter();

function submit(event: Event) {
  event.preventDefault();
  router.replace(`/search?query=${encodeURI(query.value)}`).then(window.location.reload);
}
</script>

<template>
  <form class="input" style="outline: none" @submit="submit">
    <icon name="oui:search" />
    <input type="search" class="grow" placeholder="Введите название" v-model="query" />
    <kbd class="btn kbd kbd-sm" @click="submit">Enter</kbd>
  </form>
</template>
