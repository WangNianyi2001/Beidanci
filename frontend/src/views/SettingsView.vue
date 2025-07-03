<template>
	<h1>Beidanci / 设置</h1>

	<nav>
		<button class="back" @click="$router.push('/')">⏪ 回到首页</button>
	</nav>

	<div v-if="!ready">加载中...</div>
	<div v-else class="fc stretched" style="gap: 0.5em;">
		<div class="settings-group">
			<h2>用户设置</h2>

			<p>
				<label>当前用户</label>
				<select v-model="currentUser" class="fill">
					<option v-for="u in allUsers" :key="u">{{ u }}</option>
				</select>
			</p>
			<p>
				<button @click="createUser" class="fill">新增用户</button>
				<button @click="deleteUser" class="fill">删除当前用户</button>
			</p>
		</div>

		<div class="settings-group fc stretched gapped">
			<h2>训练设置</h2>

			<p>
				<label>批次大小</label>
				<input type="number" v-model.number="settings.batchSize" />
			</p>

			<p>
				<label>激进度（0~1）</label>
				<input type="number" step="0.1" v-model.number="settings.aggressiveness" />
			</p>

			<p>
				<label>默认模式</label>
				<select v-model="settings.defaultMode">
					<option value="self-report">自我申报</option>
					<option value="test">测验</option>
				</select>
			</p>
		</div>

		<button @click="save" style="margin-block-start: 2em;">保存设置</button>
	</div>
</template>

<style lang="stylus" scoped>
.settings-group >* {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	align-items: baseline;
}
</style>

<script setup>
import { ref, onMounted } from 'vue';
import { currentUser, allUsers } from '../stores/userStore.js';

const settings = ref({});
const ready = ref(false);

onMounted(async () => {
	// User list
	{
		const res = await fetch('/user/list').then(r => r.json());
		allUsers.value = res.data;
		if (!currentUser.value && res.data.length > 0)
			currentUser.value = res.data[0];
	}

	// User info
	{
		const res = await fetch(`/user/info?user=${currentUser.value}`).then(r => r.json());
		settings.value = res.data.settings ?? {
			batchSize: 25,
			aggressiveness: 0.5,
			defaultMode: 'self-report'
		};
	}

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

async function createUser() {
	const name = prompt('请输入新用户名');
	if (!name || allUsers.value.includes(name)) return;
	const res = await fetch(`/user/create?user=${name}`, { method: 'POST' });
	if (res.ok) {
		allUsers.value.push(name);
		currentUser.value = name;
	}
}

async function deleteUser() {
	if (!currentUser.value) return;
	if (!confirm(`确定要删除用户 ${currentUser.value} 吗？操作不可恢复！`)) return;
	const res = await fetch(`/user?user=${currentUser.value}`, { method: 'DELETE' });
	if (res.ok) {
		allUsers.value = allUsers.value.filter(u => u !== currentUser.value);
		currentUser.value = allUsers.value[0] ?? '';
	}
}
</script>