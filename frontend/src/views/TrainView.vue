<template>
	<h1>Beidanci | 训练</h1>
	<button @click="$router.push('/')">回到首页</button>
	<div v-if="isLoading">加载中...</div>
	<div v-else-if="!inTraining">
		<button @click="startTraining">开始新的训练</button>
	</div>
	<div v-else>
		<div>
			<p>第 {{ index + 1 }} / {{ trainingSet.length }} 题</p>
			<h2 v-if="currentWord">{{ currentWord.orthography }}</h2>

			<div v-if="!answered">
				<div v-if="mode === 'self-report'">
						<button @click="markScore(1)">记住</button>
						<button @click="markScore(0.5)">模糊</button>
						<button @click="markScore(0)">忘记</button>
				</div>
				<div v-else-if="mode === 'test'">
						<div v-for="(choice, i) in choices" :key="i">
							<button @click="markScore(choice.orthography === correctWord.orthography ? 1 : 0)">{{ choice.translation }}</button>
						</div>
						<button @click="markScore(0)">我不会</button>
				</div>
			</div>
			<div v-else>
				<p v-if="mode === 'test'">{{ pendingScore === 1 ? '正确 ✅' : '错误 ❌' }}</p>
				<p>翻译：{{ currentWord.translation }}</p>
				<button @click="nextQuestion">下一个</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { currentUser } from '../stores/userStore.js';

const mode = ref('self-report');
const size = ref(25);

onMounted(async () => {
	const res = await fetch(`/user/info?user=${currentUser.value}`).then(r => r.json());
	mode.value = res.data.settings?.defaultMode ?? 'self-report';
	size.value = res.data.settings?.batchSize ?? 25;
});

const isLoading = ref(false);
const inTraining = ref(false);
const answered = ref(false);
const pendingScore = ref(null);

/** @type {import("vue").Ref<Word[]>} */
const trainingSet = ref([]);
const index = ref(0);
const results = ref([]);

/** @type {import("vue").ComputedRef<Word>} */
const currentWord = computed(() => trainingSet.value[index.value]);

/** @type {import("vue").Ref<Word[]>} */
const choices = ref([]);
/** @type {import("vue").Ref<Word>} */
const correctWord = ref(null);

/** @type {{ [key:string]: { [key:string]: Word } }} */
const cachedDicts = {};

async function startTraining() {
	isLoading.value = true;

	trainingSet.value = (await (await fetch(`/train/generate?user=${currentUser.value}&size=${size}`)).json()).data;

	// Preload dictionaries.
	for(const word of trainingSet.value) {
		const dictName = word.dict;
		if(dictName in cachedDicts)
			continue;

		const res = await fetch(`/dictionary/vocabulary?dict=${word.dict}`).then(r => r.json());
		const dict = {};
		for(const word of res.data) {
			word.dict = dictName;
			dict[word.orthography] = word;
		}
		cachedDicts[word.dict] = dict;
	}
	results.value = [];

	isLoading.value = false;
	inTraining.value = true;
	
	index.value = 0;
	generateChoices();
}

function nextQuestion() {
	results.value.push({
		dict: currentWord.value.dict,
		word: currentWord.value.word,
		scores: [pendingScore.value]
	});

	pendingScore.value = null;
	index.value++;

	answered.value = false;
	if(index.value >= trainingSet.value.length)
		finishTraining();
	else
		generateChoices();
}

function generateChoices() {
	const dict = cachedDicts[currentWord.value.dict];

	correctWord.value = dict[currentWord.value.orthography];

	choices.value = Object.values(dict)
		.filter(word => word.orthography !== correctWord.value.orthography)
		.sort(() => Math.random() - 0.5)
		.slice(0, 3);
	choices.value.push(correctWord.value);
	choices.value.sort(() => Math.random() - 0.5);
}

function markScore(score) {
	answered.value = true;
	pendingScore.value = score;
}

async function finishTraining() {
	inTraining.value = false;
	const time = Date.now();
	alert('训练完成！');

	// Report training result
	await fetch(`/train/report?user=${currentUser.value}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ time, results: results.value })
	});
}
</script>
