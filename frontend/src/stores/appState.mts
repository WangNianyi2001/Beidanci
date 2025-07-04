import { ref, computed, reactive, } from 'vue';
import { Fetch } from '../utils/web.mjs';



// 用户

export type UserSettings = {
	training: {
		mode: 'self-report' | 'test';
		batchSize: number;
		aggressiveness: number;
	};
};

const allUsers = ref([] as string[]);
const currentUser = ref(null as string | null);
const userSettings = reactive({} as UserSettings);

export async function CreateUser(name: string) {
	await Fetch('POST', `/user/create?user=${name}`);
	await SwitchUser(name);
}

export async function DeleteUser(name: string) {
	await Fetch('DELETE', `/user?user=${name}`);
}

export async function SwitchUser(name: string) {
	currentUser.value = name;
	localStorage.setItem('user', name);

	FetchCurrentUserInfo();
}

// 从 localStorage 获得上一次使用的用户名。
// 若不存在，使用第一个存在的用户或创建新的。
async function ResolveCurrentUser() {
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

async function FetchCurrentUserInfo() {
	const info = await Fetch<{ settings: UserSettings }>('GET', `/user/info?user=${currentUser.value}`).then(r => r.data);

	// 更新设置。
	const settings = info.settings;
	for(const key in settings)
		(userSettings as any)[key] = (settings as any)[key];

	// 更新字典信息。
	await FetchAllDictInfo();
}

export async function SaveUserSettings() {
	await Fetch('PATCH', `/user/set-settings?user=${currentUser.value}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(userSettings),
	});
}



// 词典

export type Word = {
	dict?: string;
	orthography: string;
	translation: string;
};

export type DictInfo = {
	name: string;
	count: number;
	// 用户特定信息
	enabled?: boolean;
	untrainedCount?: number;
};

const dictInfos = reactive({} as { [name: string]: DictInfo; });

async function FetchDictInfo(dict: string) {
	const info = (await Fetch<DictInfo>('GET', `/dictionary/info?dict=${dict}&user=${currentUser.value}`)).data;
	dictInfos[dict] = info;
}

async function FetchAllDictInfo() {
	const dictList = (await Fetch<string[]>('GET', '/dictionary/list')).data;
	await Promise.allSettled(dictList.map(FetchDictInfo));
}

export async function GetDictionary(dict: string) {
	return (await Fetch<Word[]>('GET', `/dictionary/vocabulary?dict=${dict}`)).data;
}

export async function ToggleDictionaryEnability(dict: string) {
	if(!(dict in dictInfos))
		throw new ReferenceError(`词库「${dict}」不存在。`);
	const isEnabled = dictInfos[dict].enabled;
	await Fetch('PATCH', `/user/set-dictionary-enabled?user=${currentUser.value}&dict=${dict}&enabled=${!isEnabled}`);
	dictInfos[dict].enabled = !dictInfos[dict].enabled;
}

export async function ImportDictionaryFromCsv(name: string, csv: string) {
	await Fetch('POST', '/dictionary/import-csv', {
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, csv }),
	});
	await FetchDictInfo(name);
}

export async function DeleteDictionary(dict: string) {
	if(!(dict in dictInfos))
		throw new ReferenceError(`词库「${dict}」不存在。`);
	await Fetch('DELETE', `/dictionary?dict=${dict}`);
	delete dictInfos[dict];
}

export async function ClearTrainingRecordsInDict(dict: string) {
	if(!(dict in dictInfos))
		throw new ReferenceError(`词库「${dict}」不存在。`);
	await Fetch('DELETE', `/user/reset-dictionary?user=${currentUser.value}&dict=${dict}`);
	await FetchDictInfo(dict);
}



// 训练

export type TrainingResult = {
	dict: string;
	word: string;
	scores: number[];
};

export async function GenerateTrainingSet() {
	return (await Fetch<Word[]>('GET', `/train/generate?user=${currentUser.value}`)).data;
}

export async function ReportTrainingResult(results: TrainingResult[]) {
	await Fetch('POST', `/train/report?user=${currentUser.value}`, {
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ time: Date.now(), results })
	});

	// 更新客户端数据，如没学过的词等。
	FetchCurrentUserInfo();
}



// 总结

export const UseAppState = () => ({
	allUsers, currentUser,
	userSettings: ref(userSettings),

	dictInfos: ref(dictInfos),
	enabledDicts: computed(() => Object.values(dictInfos).filter(d => d.enabled)),
});

export async function InitAppState() {
	// 获得所有用户列表。
	allUsers.value = ((await Fetch<string[]>('GET', '/user/list'))).data;

	await ResolveCurrentUser();
	await FetchAllDictInfo();
}