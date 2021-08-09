import { createApp } from "vue";
import { VuelidatePlugin } from "@vuelidate/core";
import PrimeVue from "primevue/config";

import App from "./App.vue";
import router from "./router";
import store from "./store";

import components from "@/components/UI/";
import components_primevue from "@/components/components_primevue";

import "./assets/styles/main.scss";
import "primevue/resources/primevue.min.css";
import "primevue/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

const app = createApp(App);

[...components, ...components_primevue].forEach((component) => {
  app.component(component.name, component);
});

app.use(store).use(router).use(VuelidatePlugin).use(PrimeVue).mount("#app");
