import { ref, computed, reactive, } from 'vue';
import { Fetch } from '../utils/web.mjs';



// 用户

export type UserSettings = {
	trainingMode: 'self-report' | 'test',
	batchSize: number,
	aggressiveness: number,
};

const allUsers = ref([] as string[]);
const currentUser = ref(null as string | null);
const userSettings = reactive({
	trainingMode: 'self-report',
	batchSize: 25,
	aggressiveness: 0.3,
} as UserSettings);

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
}

// 从 localStorage 获得上一次使用的用户名。
// 若不存在，使用第一个存在的用户或创建新的。
async function ResolveCurrentUser() {
	const storedUserName = localStorage.getItem('user');
	currentUser.value = storedUserName;
	if(!(allUsers.value as (string | null)[]).includes(currentUser.value)) {
		if(allUsers.value.length)
			SwitchUser(allUsers.value[0]);
		else
			CreateUser('Default User');
	}
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

	// 获得词典信息。
	const dictList = (await Fetch<string[]>('GET', '/dictionary/list')).data;
	await Promise.allSettled(dictList.map(FetchDictInfo));
}