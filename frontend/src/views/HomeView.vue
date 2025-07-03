<template>
	<h1>Beidanci | 首页</h1>

	<div>
		<label>当前用户：</label>
		<select v-model="currentUser">
			<option v-for="u in allUsers" :key="u">{{ u }}</option>
		</select>

		<button @click="createUser">新增用户</button>
		<button @click="deleteUser">删除当前用户</button>
	</div>

	<div>
		<button @click="$router.push('/train')">训练</button>
		<button @click="$router.push('/dictionary')">词库管理</button>
		<button @click="$router.push('/settings')">设置</button>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { currentUser, allUsers } from '../stores/userStore.js';

onMounted(async () => {
	const res = await fetch('/user/list').then(r => r.json());
	allUsers.value = res.data;
	if (!currentUser.value && res.data.length > 0)
		currentUser.value = res.data[0];
});

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