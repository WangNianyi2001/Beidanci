import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import TrainView from './views/TrainView.vue';
import SettingsView from './views/SettingsView.vue';

const routes = [
	{ path: '/', component: HomeView },
	{ path: '/train', component: TrainView },
	{ path: '/settings', component: SettingsView }
];

const router = createRouter({
	history: createWebHashHistory(),
	routes
});

createApp(App).use(router).mount('#app');
