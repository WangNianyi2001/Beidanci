import { reactive } from 'vue';
import { Fetch } from '../utils/web.mjs';

import { currentUser } from './user.mjs';

export type Word = {
	dict?: string;
	orthography: string;
	translation: string;
};

type WordRecord = {
	word: string;
	confidence: number;
};

export type DictInfo = {
	name: string;
	count: number;
	// 用户特定信息
	enabled?: boolean;
	untrainedCount?: number;
	unconfidentLeaderboard?: WordRecord[];
};

export const dictInfos = reactive({} as { [name: string]: DictInfo; });

async function FetchDictInfo(dict: string) {
	const info = (await Fetch<DictInfo>('GET', `/dictionary/info?dict=${dict}&user=${currentUser.value}`)).data;
	dictInfos[dict] = info;
}

export async function FetchAllDictInfo() {
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