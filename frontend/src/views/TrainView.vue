<template>
	<div v-if="loading">加载中...</div>
	<div v-else-if="!inProgress">
		<label>训练模式：</label>
		<select v-model="mode">
			<option value="self-report">自我申报</option>
			<option value="test">测验</option>
		</select>
		<br />
		<button @click="startTraining">开始新的训练</button>
		<button @click="$router.push('/')">回到首页</button>
	</div>
	<div v-else>
		<div>
			<p>第 {{ index + 1 }} / {{ words.length }} 题</p>
			<h2 v-if="current">{{ current.word }}</h2>

			<div v-if="!showAnswer">
				<div v-if="mode === 'self-report'">
						<button @click="prepareScore(1)">记住</button>
						<button @click="prepareScore(0.5)">模糊</button>
						<button @click="prepareScore(0)">忘记</button>
				</div>
				<div v-else-if="mode === 'test'">
						<div v-for="(choice, i) in choices" :key="i">
							<button @click="prepareScore(choice === correct ? 1 : 0)">{{ choice }}</button>
						</div>
						<button @click="mark(0)">我不会</button>
				</div>
			</div>
			<div v-else>
				<p>翻译：{{ current.translation }}</p>
				<button @click="submitScore">下一个</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { fetchTrainSet, reportTrainResult } from '../api/backend.js';

const user = 'Nianyi'; // TODO: 从设置中读取
const size = 10;
const mode = ref('self-report'); // 或 'test'

const inProgress = ref(false);
const loading = ref(false);
const showAnswer = ref(false);
const pendingScore = ref(null);

const words = ref([]);
const index = ref(0);
const results = ref([]);

const current = computed(() => words.value[index.value]);

const choices = ref([]);
const correct = ref('');

const vocabularyCache = ref({}); // dictName → { orthography → translation }

async function preloadTranslations() {
	for (const w of words.value) {
		if (!vocabularyCache.value[w.dict]) {
			const res = await fetch(`/dictionary/vocabulary?dict=${w.dict}`).then(r => r.json());
			const map = {};
			for (const entry of res.data) {
				map[entry.orthography] = entry.translation;
			}
			vocabularyCache.value[w.dict] = map;
		}
	}
	// 给每个 word 添加 .translation 字段
	words.value.forEach(w => {
		w.translation = vocabularyCache.value[w.dict][w.word];
	});
}

async function startTraining() {
	loading.value = true;
	inProgress.value = true;
	words.value = await fetchTrainSet(user, size);
	await preloadTranslations();
	index.value = 0;
	results.value = [];
	loading.value = false;

	if (mode.value === 'test') generateChoices();
}

function mark(score) {
	results.value.push({
		dict: current.value.dict,
		word: current.value.word,
		scores: [score]
	});
	index.value++;
	if (index.value >= words.value.length) finishTraining();
	else if (mode.value === 'test') generateChoices();
}

function finishTraining() {
	inProgress.value = false;
	const time = Date.now();
	reportTrainResult(user, time, results.value);
	alert('训练完成！');
}

async function generateChoices() {
	const all = await fetch(`/dictionary/vocabulary?dict=${current.value.dict}`).then(r => r.json());
	const vocab = all.data.map(w => w.translation);
	correct.value = vocab.find((_, i) => all.data[i].orthography === current.value.word);
	const shuffled = vocab.filter(v => v !== correct.value).sort(() => Math.random() - 0.5).slice(0, 3);
	shuffled.push(correct.value);
	choices.value = shuffled.sort(() => Math.random() - 0.5);
}

function prepareScore(score) {
	pendingScore.value = score;
	showAnswer.value = true;
}

function submitScore() {
	results.value.push({
		dict: current.value.dict,
		word: current.value.word,
		scores: [pendingScore.value]
	});
	showAnswer.value = false;
	pendingScore.value = null;
	index.value++;
	if (index.value >= words.value.length) finishTraining();
}
</script>
