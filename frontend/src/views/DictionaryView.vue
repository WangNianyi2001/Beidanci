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

			<input type="file" accept=".csv" @change="onFileSelected" />

			<div>
				<button :disabled="!importContent" @click="onImportCsv">✅ 确认导入</button>
				<button @click="showImport = false">🚫 取消</button>
			</div>
		</div>

		<h2>词库列表</h2>
		<ul class="dict-list">
			<li v-for="dict in app.dictInfos.value" :key="dict.name">
				<header>
					<h3>{{ dict.name }}</h3>
					<input type="checkbox"
						:checked="app.enabledDicts.value.some(d => d.name === dict.name)"
						@change="ToggleDictionaryEnability(dict.name)" />
					<span>{{ (() => {
						const trained = dict.count - dict.untrainedCount!;
						return `${trained}/${dict.count} (${(trained / dict.count).toFixed(1)}%)`;
					})() }}</span>
				</header>

				<div>
					<button @click="onClear(dict.name)">🔄️ 清除记录</button>
					<button @click="onDelete(dict.name)">🗑️ 删除词库</button>
				</div>
			</li>
		</ul>
	</main>
</template>

<script setup lang="ts">
import {
	UseAppState,
	ToggleDictionaryEnability, ImportDictionaryFromCsv, DeleteDictionary, ClearTrainingRecordsInDict,
} from '../modules/appState.mjs';
const app = UseAppState();

import { ref } from 'vue';

const showImport = ref(false);
const importName = ref('');
const importContent = ref('');

function onFileSelected(event: Event) {
	const file = (event.target as HTMLInputElement).files![0];
	if (!file)
		return;

	const reader = new FileReader();
	reader.onload = e => importContent.value = e.target!.result as string;
	reader.readAsText(file, 'utf-8');
}

async function onDelete(dict: string) {
	if(!confirm(`确定删除词库「${dict}」吗？此操作不可恢复。`))
		return;
	await DeleteDictionary(dict);
	alert('删除成功。');
}

async function onClear(dict: string) {
	if(!confirm(`确定清除词库「${dict}」的训练记录？`))
		return;
	await ClearTrainingRecordsInDict(dict);
	alert('清除成功。');
}

async function onImportCsv() {
	if (!importName.value || !importContent.value)
		return;
	await ImportDictionaryFromCsv(importName.value, importContent.value);
	alert('导入成功。');
}
</script>
