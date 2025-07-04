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
			<ul class="dict-list">
				<li v-for="dict in app.enabledDicts.value" :key="dict.name">
					<header>
						<h3>{{ dict.name }}</h3>
						<span>{{ (() => {
							const trained = dict.count - dict.untrainedCount!;
							return `${trained}/${dict.count} (${(trained / dict.count).toFixed(1)}%)`;
						})() }}</span>
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

<script setup lang="ts">
import { UseAppState } from '../stores/appState.mjs';
const app = UseAppState();
</script>