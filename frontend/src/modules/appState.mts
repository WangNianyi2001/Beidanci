import { ref, computed } from 'vue';

import {
	allUsers, currentUser, userSettings,
	UpdateUserList, ResolveCurrentUser,
} from './user.mjs';
import {
	dictInfos,
	FetchAllDictInfo,
} from './dictionary.mjs';

export * from './user.mjs';
export * from './dictionary.mjs';
export * from './training.mjs';

export const UseAppState = () => ({
	allUsers, currentUser,
	userSettings: ref(userSettings),

	dictInfos: ref(dictInfos),
	enabledDicts: computed(() => Object.values(dictInfos).filter(d => d.enabled)),
});

export async function InitAppState() {
	await UpdateUserList();
	await ResolveCurrentUser();
	await FetchAllDictInfo();
}