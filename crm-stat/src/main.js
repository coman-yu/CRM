/*import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')*/

import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import router from "./router";
import zhCn from "element-plus/es/locale/lang/zh-cn";

const app = createApp(App);
app.use(ElementPlus, {
  locale: zhCn,
});
app.use(router);
app.mount("#app");
