import { Fetch } from '../utils/web.mjs';

import { currentUser, FetchCurrentUserInfo } from './user.mjs';
import { type Word, GetDictionary } from './dictionary.mjs';

export async function GenerateTrainingSet() {
	return (await Fetch<Word[]>('GET', `/train/generate?user=${currentUser.value}`)).data;
}

export type TrainingMode = 'self-report' | 'test';

export type TrainingSettings = {
	mode: TrainingMode;
	batchSize?: number;
	aggressiveness: number;
	optionsCount: number;
};

export type TrainingResult = {
	dict: string;
	word: string;
	scores: number[];
};

export type TrainingQuestion = {
	target: Word;
	choices?: Word[];
};

export class TrainingSession {
	settings: TrainingSettings;
	targets: Word[] = [];  // 要训练的范围。

	dictNames = new Set<string>();
	dicts: { [name: string]: Word[]; } = {};
	pool: Word[] = [];  // 未来要训练的单词，可能重复。
	currentQuestion: TrainingQuestion | null = null;
	results = new Map<Word, TrainingResult>();
	answeredCount = 0;

	constructor(settings: TrainingSettings, targets: Word[]) {
		this.settings = settings;
		this.targets.push(...targets);

		// 整理需要加载的词库。
		for(const word of this.targets) {
			if(word.dict !== undefined)
				this.dictNames.add(word.dict);
		}
	}

	async Initialize() {
		// 加载词库。
		await Promise.allSettled(
			Array.from(this.dictNames.values())
				.map(async dict => this.dicts[dict] = await GetDictionary(dict))
		);

		// 初始化题库。
		this.pool.push(...this.targets);
	}

	NextQuestion(): TrainingQuestion | null {
		if(this.pool.length === 0)
			return this.currentQuestion = null;

		const poolIndex = Math.floor(Math.random() * this.pool.length);
		// 此问考察的目标词。
		const target = this.pool.splice(poolIndex, 1)[0];
		const question: TrainingQuestion = { target };

		// 生成单选选项。
		if(this.settings.mode === 'test') {
			const choices = Array.from(this.dicts[target.dict!]);

			// 避免抽到目标词。
			choices.splice(choices.indexOf(target), 1);
			choices.sort(() => Math.random() - .5);
			// 取前几个。
			choices.splice(this.settings.optionsCount - 1);
			choices.push(target);
			choices.sort(() => Math.random() - .5);

			question.choices = choices;
		}

		return this.currentQuestion = question;
	}

	MarkScore(score: number) {
		if(!this.currentQuestion)
			return;

		const target = this.currentQuestion.target;
		if(!this.results.has(target)) {
			this.results.set(target, {
				dict: target.dict!,
				word: target.orthography,
				scores: [],
			});
		}
		this.results.get(target)?.scores.push(score);
		++this.answeredCount;

		// 根据结果添加巩固的习题。
		const repeatTime = (score < 0.5) ? 2 : (score < 1) ? 1 : 0;
		for(let i = 0; i < repeatTime; ++i)
			this.pool.push(this.currentQuestion.target);
	}

	async ReportResults() {
		const results = Array.from(this.results.values());
		await Fetch('POST', `/train/report?user=${currentUser.value}`, {
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ time: Date.now(), results })
		});

		// 更新客户端数据，如没学过的词等。
		await FetchCurrentUserInfo();
	}
}