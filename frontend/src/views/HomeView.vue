<template>
	<h1>Beidanci | 背单词</h1>

	<nav>
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
							return `${trained}/${dict.count} (${(trained / dict.count * 100).toFixed(1)}%)`;
						})() }}</span>
					</header>
					<div v-if="dict.unconfidentLeaderboard?.length ?? 0" class="unconfident-leaderboard">
						<h4>最难掌握的词……</h4>
						<ul>
							<li v-for="word in dict.unconfidentLeaderboard">{{ word.word }}</li>
						</ul>
					</div>
					<div v-else class="unconfident-leaderboard">
						<h4>开始新的学习……</h4>
					</div>
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
.unconfident-leaderboard {
	text-align: left;

	>h4 {
		margin-block: 0.5em 0.3em;
	}

	>ul {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		column-gap: 0.5em;

		padding-inline-start: 0;
		list-style: none;
	}
}
</style>

<script setup lang="ts">
import { UseAppState } from '../modules/appState.mjs';
const app = UseAppState();
</script>