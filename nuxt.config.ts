// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },

  devServer: {
    port: 25566
  },

  vite: {
    server: {
      allowedHosts: ["kotisoff.tmkspace.online"]
    }
  },

  css: ["~/assets/css/index.css"],

  modules: ["@nuxtjs/tailwindcss", "reka-ui", "@nuxt/eslint", "@nuxt/icon"]
});
