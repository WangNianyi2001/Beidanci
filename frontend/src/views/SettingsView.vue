<template>
	<div v-if="ready">
		<h2>设置</h2>
		<p>
			<button @click="$router.push('/')">回到首页</button>
		</p>

		<label>用户名：</label>
		<span>{{ user }}</span><br />

		<label>批次大小：</label>
		<input type="number" v-model.number="settings.batchSize" /><br />

		<label>激进度（0~1）：</label>
		<input type="number" step="0.1" v-model.number="settings.aggressiveness" /><br />

		<label>默认模式：</label>
		<select v-model="settings.defaultMode">
			<option value="self-report">自我申报</option>
			<option value="test">测验</option>
		</select><br />

		<button @click="save">保存设置</button>
	</div>
	<div v-else>加载中...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { currentUser } from '../stores/userStore.js';

const settings = ref({});
const ready = ref(false);

onMounted(async () => {
	const res = await fetch(`/user/info?user=${currentUser.value}`).then(r => r.json());
	settings.value = res.data.settings ?? {
		batchSize: 25,
		aggressiveness: 0.5,
		defaultMode: 'self-report'
	};
	ready.value = true;
});

async function save() {
	const res = await fetch(`/user/set-settings?user=${currentUser.value}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(settings.value)
	});
	if (res.ok) alert('保存成功');
}
</script>