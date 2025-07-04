<template>
	<h1>Beidanci / 设置</h1>

	<nav>
		<button class="back" @click="$router.push('/')">⏪ 回到首页</button>
	</nav>

	<div class="fc stretched" style="gap: 0.5em;">
		<div class="settings-group">
			<h2>用户设置</h2>

			<p>
				<label>当前用户</label>
				<select v-model="app.currentUser.value" class="fill">
					<option v-for="user in app.allUsers.value" :key="user">{{ user }}</option>
				</select>
			</p>
			<p>
				<button @click="OnCreateUser" class="fill">新增用户</button>
				<button @click="onDeleteUser" class="fill">删除当前用户</button>
			</p>
		</div>

		<div class="settings-group fc stretched gapped">
			<h2>训练设置</h2>

			<p>
				<label>批次大小</label>
				<input type="number" v-model.number="app.userSettings.value.training.batchSize" />
			</p>

			<p>
				<label>激进度（0~1）</label>
				<input type="number" step="0.1" v-model.number="app.userSettings.value.training.aggressiveness" />
			</p>

			<p>
				<label>默认模式</label>
				<select v-model="app.userSettings.value.training.mode">
					<option value="self-report">自我申报</option>
					<option value="test">测验</option>
				</select>
			</p>
		</div>

		<button @click="onSaveSettings" style="margin-block-start: 2em;">保存设置</button>
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

<script setup lang="ts">
import {
	UseAppState,
	SaveUserSettings, CreateUser, DeleteUser,
} from '../stores/appState.mjs';
const app = UseAppState();

async function onSaveSettings() {
	await SaveUserSettings();
	alert('保存成功。');
}

async function OnCreateUser() {
	const name = prompt('请输入新用户名：');
	if(!name)
		return;
	if(app.allUsers.value.includes(name)) {
		alert('用户名已存在！');
		return;
	}
	await CreateUser(name);
	alert('用户创建成功。');
}

async function onDeleteUser() {
	if(!confirm(`确定要删除用户「${app.currentUser.value}」吗？操作不可恢复！`))
		return;
	await DeleteUser(app.currentUser.value!);
	alert('删除成功。');
}
</script>