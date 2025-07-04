<template>
	<h1>Beidanci / 词库管理</h1>

	<nav>
		<button class="back" @click="$router.push('/')">⏪ 回到首页</button>
		<button @click="showImport = true">🆕 导入词库</button>
	</nav>

	<main>
		<div v-if="showImport" class="fc stretched gapped">
			<h3>导入词库</h3>
			<div class="fr">
				<label>词库名</label>
				<input class="fill" v-model="importName" />
			</div>

			<input type="file" accept=".csv" @change="handleFile" />

			<div>
				<button :disabled="!importContent" @click="doImport">✅ 确认导入</button>
				<button @click="showImport = false">🚫 取消</button>
			</div>
		</div>

		<h2>词库列表</h2>
		<ul class="dict-list fc stretched gapped">
			<li v-for="dict in app.dictInfos.value" :key="dict.name">
				<header class="fr">
					<h3>{{ dict.name }}</h3>
					<input type="checkbox" :checked="app.enabledDicts.value.some(d => d.name === dict.name)" @change="ToggleDictionaryEnability(dict.name)" />
				</header>

				<button @click="confirmClear(dict.name)">🔄️ 清除记录</button>
				<button @click="confirmDelete(dict.name)">🗑️ 删除词库</button>
			</li>
		</ul>
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
import {
	UseAppState,
	ToggleDictionaryEnability, ImportDictionaryFromCsv, DeleteDictionary, ClearTrainingRecordsInDict,
} from '../stores/appState.mjs';
const app = UseAppState();

import { ref } from 'vue';

const showImport = ref(false);
const importName = ref('');
const importContent = ref('');

function handleFile(event: Event) {
	const file = (event.target as HTMLInputElement).files![0];
	if (!file)
		return;

	const reader = new FileReader();
	reader.onload = e => importContent.value = e.target!.result as string;
	reader.readAsText(file, 'utf-8');
}

async function confirmDelete(dict: string) {
	if(!confirm(`确定删除词库「${dict}」吗？此操作不可恢复。`))
		return;
	await DeleteDictionary(dict);
	alert('删除成功。');
}

async function confirmClear(dict: string) {
	if(!confirm(`确定清除词库「${dict}」的训练记录？`))
		return;
	await ClearTrainingRecordsInDict(dict);
	alert('清除成功。');
}

async function doImport() {
	if (!importName.value || !importContent.value)
		return;
	await ImportDictionaryFromCsv(importName.value, importContent.value);
	alert('导入成功。');
}
</script>
