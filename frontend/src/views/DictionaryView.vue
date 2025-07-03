<template>
	<div>
		<h2>词库管理</h2>
		<p>
			<button @click="$router.push('/')">回到首页</button>
		</p>

		<div v-if="loading">
			<p>加载中...</p>
		</div>
		<div v-else>
			<button @click="showImport = true">导入词库</button>

			<ul v-if="ready">
				<li v-for="dict in dicts" :key="dict">
					<strong>{{ dict }}</strong>
					<label>
						<input type="checkbox" :checked="enabled.has(dict)" @change="toggle(dict)" />
						启用
					</label>
					<button @click="confirmClear(dict)">清除记录</button>
					<button @click="confirmDelete(dict)">删除词库</button>
				</li>
			</ul>

			<div v-if="showImport">
				<h3>导入词库</h3>
				<label>词库名：</label><input v-model="importName" /><br />

				<input type="file" accept=".csv" @change="handleFile" /><br />

				<button :disabled="!importContent" @click="doImport">确认导入</button>
				<button @click="showImport = false">取消</button>
			</div></div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { currentUser } from '../stores/userStore.js';

const dicts = ref([]);
const enabled = ref(new Set());
const ready = ref(false);

const showImport = ref(false);
const importName = ref('');

const importContent = ref('');

function handleFile(event) {
	const file = event.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (e) => {
		importContent.value = e.target.result;
	};
	reader.readAsText(file, 'utf-8');
}

const loading = ref(true);
onMounted(async () => {
	loading.value = true;

	const [dRes, uRes] = await Promise.all([
		fetch('/dictionary/list').then(r => r.json()),
		fetch(`/user/info?user=${currentUser.value}`).then(r => r.json())
	]);
	dicts.value = dRes.data;
	enabled.value = new Set(uRes.data.enabledDicts ?? []);
	ready.value = true;

	loading.value = false;
});

async function toggle(dict) {
	const isEnabled = enabled.value.has(dict);
	const res = await fetch(`/user/set-dictionary-enabled?user=${currentUser.value}&dict=${dict}&enabled=${!isEnabled}`, {
		method: 'PATCH'
	});
	if (res.ok) {
		if (isEnabled) enabled.value.delete(dict);
		else enabled.value.add(dict);
	}
}

async function confirmDelete(dict) {
	if (confirm(`确定删除词库 ${dict} 吗？此操作不可恢复。`)) {
		await fetch(`/dictionary?dict=${dict}`, { method: 'DELETE' });
		dicts.value = dicts.value.filter(d => d !== dict);
		enabled.value.delete(dict);
	}
}

async function confirmClear(dict) {
	if (confirm(`确定清除用户 ${currentUser.value} 在 ${dict} 中的学习记录？`)) {
		await fetch(`/user/reset-dictionary?user=${currentUser.value}&dict=${dict}`, { method: 'DELETE' });
		alert('清除成功');
	}
}

async function doImport() {
	if (!importName.value || !importContent.value) return;
	const res = await fetch('/dictionary/import-csv', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			name: importName.value,
			csv: importContent.value
		})
	});
	if (res.ok) {
		dicts.value.push(importName.value);
		showImport.value = false;
		importName.value = '';
		importContent.value = '';
		alert('导入成功');
	}
}
</script>
