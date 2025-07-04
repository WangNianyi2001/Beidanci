<template>
	<h1>Beidanci | 背单词</h1>

	<nav>
		<button @click="$router.push('/train')">💪 训练</button>
		<button @click="$router.push('/dictionary')">📚 词库管理</button>
		<button @click="$router.push('/settings')">⚙️ 设置</button>
	</nav>

	<main class="fc stretched centered">
		<div v-if="dicts.length">
			<h2>训练进度</h2>
			<ul class="dict-list fc stretched gapped">
				<li v-for="dict in dicts" :key="dict">
					<header class="fr">
						<h3>{{ dict }}</h3>
					</header>
				</li>
			</ul>
			<button @click="$router.push('/train')">💪 继续训练</button>
		</div>
		<div v-else>
			<button @click="$router.push('/dictionary')">📚 去添加词库</button>
		</div>
	</main>
</template>

<style lang="stylus" scoped>
.dict-list {
	list-style: none;
	padding-inline-start: 0;

	>li {
		border-inline-start: 4pt solid;
		padding-inline-start: 1em;
	}
}
</style>

<script setup>
import { ref, onMounted } from 'vue';
import { currentUser } from '../stores/userStore.js';

const dicts = ref([]);
const enabled = ref(new Set());

onMounted(async () => {
	const [dRes, uRes] = await Promise.all([
		fetch('/dictionary/list').then(r => r.json()),
		fetch(`/user/info?user=${currentUser.value}`).then(r => r.json())
	]);
	dicts.value = dRes.data;
	enabled.value = new Set(uRes.data.enabledDicts ?? []);
});
</script>