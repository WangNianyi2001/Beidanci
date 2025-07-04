<template>
	<h1>Beidanci | 背单词</h1>

	<nav>
		<button @click="$router.push('/train')">💪 训练</button>
		<button @click="$router.push('/dictionary')">📚 词库管理</button>
		<button @click="$router.push('/settings')">⚙️ 设置</button>
	</nav>

	<main class="fc stretched centered">
		<h2>欢迎回来，{{ app.currentUser }}！</h2>
		<div v-if="app.enabledDicts.value.length">
			<ul class="dict-list fc stretched gapped">
				<li v-for="dict in app.enabledDicts.value" :key="dict.name">
					<header class="fr">
						<h3>{{ dict.name }}</h3>
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

<script setup lang="ts">
import { UseAppState } from '../stores/appState.mjs';
const app = UseAppState();
</script>