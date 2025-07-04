<template>
	<h1>Beidanci / 训练</h1>

	<nav>
		<button class="back" @click="onBackToHomepage">⏪ 回到首页</button>
		<button v-if="!isLoading && !isTraining" @click="onStartTraining">♿ 开始新的训练</button>
	</nav>

	<main>
		<p v-if="isLoading">加载中...</p>
		<div v-else-if="isTraining" class="training fc centered stretched">
			<p>第 {{ index + 1 }} / {{ trainingSet.length }} 题</p>
			<h2 v-if="currentWord">{{ currentWord.orthography }}</h2>

			<div v-if="!answered" class="options-container">
				<div v-if="app.userSettings.value.training.mode === 'self-report'" class="options fc stretched gapped">
					<button class="option remembered" @click="MarkScore(1)">记住</button>
					<button class="option blurred" @click="MarkScore(0.5)">模糊</button>
					<button class="option forgotten" @click="MarkScore(0)">忘记</button>
				</div>
				<div v-else-if="app.userSettings.value.training.mode === 'test'" class="options fc stretched gapped">
					<button class="option"
						v-for="(choice, i) in choices" :key="i"
						@click="MarkScore(choice.orthography === correctWord!.orthography ? 1 : 0)">
						{{ choice.translation }}
					</button>
					<button class="option dont-know" @click="MarkScore(0)">我不会</button>
				</div>
			</div>
			<div v-else class="fc stretched centered gapped">
				<p v-if="app.userSettings.value.training.mode === 'test'">{{ pendingScore === 1 ? '正确 ✅' : '错误 ❌' }}</p>
				<p>
					<label>释义</label>
					<span>{{ currentWord.translation }}</span>
				</p>
				<button @click="onNextQuestion">下一个</button>
			</div>
		</div>
	</main>
</template>

<style lang="stylus" scoped>
.option {
	color: #333;

	&.remembered {
		color: #239b56;
	}

	&.blurred {
		color: #d68910;
	}

	&.dont-know, &.forgotten {
		color: #cb4335;
	}
}
</style>

<script setup lang="ts">
import {
	UseAppState,
	type Word, GetDictionary,
	GenerateTrainingSet, ReportTrainingResult, type TrainingResult,
} from '../stores/appState.mjs';
const app = UseAppState();

// 状态

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const isLoading = ref(false);
const isTraining = ref(false);
const answered = ref(false);
const pendingScore = ref(null as number | null);

function onBackToHomepage() {
	if(isTraining.value) {
		if(!confirm('正在训练中，退出将丢失训练进度。是否退出？'))
			return;
	}
	router.push('/');
}

// 训练

const trainingSet = ref([] as Word[]);
const index = ref(0);
const results = ref([] as TrainingResult[]);

const currentWord = computed(() => trainingSet.value[index.value] as Word);

const choices = ref([] as Word[]);
const correctWord = ref(null as Word | null);

const cachedDicts: {
	[key: string]: {
		[key: string]: Word;
	};
} = {};

async function onStartTraining() {
	isLoading.value = true;

	trainingSet.value = await GenerateTrainingSet();;

	// 预加载词库。
	for(const word of trainingSet.value) {
		const dictName = word.dict;
		if(!dictName || (dictName in cachedDicts))
			continue;

		const wordList = await GetDictionary(dictName);
		const dict = {} as { [word: string]: Word; };
		for(const word of wordList) {
			word.dict = dictName;
			dict[word.orthography] = word;
		}
		cachedDicts[dictName] = dict;
	}
	results.value = [];

	isLoading.value = false;
	isTraining.value = true;
	
	index.value = 0;
	GenerateChoices();
}

function GenerateChoices() {
	const dict = cachedDicts[currentWord.value.dict!];

	correctWord.value = dict[currentWord.value.orthography];

	choices.value = Object.values(dict)
		.filter(word => word.orthography !== correctWord.value!.orthography)
		.sort(() => Math.random() - 0.5)
		.slice(0, 3);
	choices.value.push(correctWord.value);
	choices.value.sort(() => Math.random() - 0.5);
}

function MarkScore(score: number) {
	answered.value = true;
	pendingScore.value = score;
}

function onNextQuestion() {
	results.value.push({
		dict: currentWord.value.dict!,
		word: currentWord.value.orthography,
		scores: [pendingScore.value!]
	});

	pendingScore.value = null;
	index.value++;

	answered.value = false;
	if(index.value >= trainingSet.value.length)
		onFinishTraining();
	else
		GenerateChoices();
}

async function onFinishTraining() {
	isTraining.value = false;
	alert('训练完成！');
	await ReportTrainingResult(results.value);
}
</script>
