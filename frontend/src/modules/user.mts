import { ref, reactive } from 'vue';
import { Fetch } from '../utils/web.mjs';

import { FetchAllDictInfo } from './dictionary.mjs';
import { type TrainingSettings } from './training.mjs';

export type UserSettings = {
	training: TrainingSettings;
};

export const allUsers = ref([] as string[]);
export const currentUser = ref(null as string | null);
export const userSettings = reactive({} as UserSettings);

export async function CreateUser(name: string) {
	await Fetch('POST', `/user/create?user=${name}`);
	await UpdateUserList();
	await SwitchUser(name);
}

export async function DeleteUser(name: string) {
	await Fetch('DELETE', `/user?user=${name}`);
	// 从客户端缓存中删除。
	const index = allUsers.value.indexOf(name);
	if(index !== -1)
			allUsers.value.splice(index, 1);

	await UpdateUserList();
	await ResolveCurrentUser();
}

export async function SwitchUser(name: string) {
	currentUser.value = name;
	localStorage.setItem('user', name);

	await FetchCurrentUserInfo();
}

// 从 localStorage 获得上一次使用的用户名。
// 若不存在，使用第一个存在的用户或创建新的。
export async function ResolveCurrentUser() {
	const storedUserName = localStorage.getItem('user');
	if(storedUserName !== null && allUsers.value.includes(storedUserName))
		SwitchUser(storedUserName);
	else {
		if(allUsers.value.length)
			await SwitchUser(allUsers.value[0]);
		else
			await CreateUser('Default User');
	}
}

export async function UpdateUserList() {
	allUsers.value = ((await Fetch<string[]>('GET', '/user/list'))).data;
}

export async function FetchCurrentUserInfo() {
	const info = await Fetch<{ settings: UserSettings }>('GET', `/user/info?user=${currentUser.value}`).then(r => r.data);

	// 更新设置。
	const settings = info.settings;
	for(const key in settings)
		(userSettings as any)[key] = (settings as any)[key];

	await FetchAllDictInfo();
}

export async function SaveUserSettings() {
	await Fetch('PATCH', `/user/set-settings?user=${currentUser.value}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(userSettings),
	});
}