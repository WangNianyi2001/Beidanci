import { Fetch } from '../utils/web.mjs';

import { currentUser, FetchCurrentUserInfo } from './user.mjs';
import { type Word } from './dictionary.mjs';

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
	await FetchCurrentUserInfo();
}