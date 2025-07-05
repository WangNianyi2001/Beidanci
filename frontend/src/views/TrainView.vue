<template>
	<h1>Beidanci / 训练</h1>

	<nav>
		<button class="back" @click="onBackToHomepage">⏪ 回到首页</button>
	</nav>

	<main>
		<p v-if="isLoading">加载中...</p>
		<div v-else-if="!trainingSession" class="fc centered">
			<button v-if="hasTrainableWords" @click="onStartTraining">♿ 开始新的训练</button>
			<div v-else class="fc centered gapped">
				<p>词库中无词</p>
				<button @click="$router.push('/dictionary')">📚 去管理词库</button>
			</div>
		</div>
		<div v-else class="training fc centered stretched">
			<p>第 {{ trainingSession.answeredCount + 1 }} / {{ remainingQuestionCount! + trainingSession.answeredCount + 1 }} 题</p>
			<h2 v-if="currentQuestion">{{ currentWord!.orthography }}</h2>

			<div v-if="!hasJustAnswered" class="options-container">
				<div v-if="trainingSession.settings.mode === 'self-report'" class="options fc stretched gapped">
					<button class="option remembered" @click="onAnswered(1)">记住</button>
					<button class="option blurred" @click="onAnswered(0.5)">模糊</button>
					<button class="option forgotten" @click="onAnswered(0)">忘记</button>
				</div>
				<div v-else-if="trainingSession.settings.mode === 'test'" class="options fc stretched gapped">
					<button class="option"
						v-for="(choice, i) in currentQuestion?.choices!" :key="i"
						@click="onAnswered(choice.orthography === currentWord!.orthography ? 1 : 0)">
						{{ choice.translation }}
					</button>
					<button class="option dont-know" @click="onAnswered(0)">我不会</button>
				</div>
			</div>
			<div v-else class="fc stretched centered gapped">
				<p v-if="trainingSession.settings.mode === 'test'">{{ pendingScore === 1 ? '正确 ✅' : '错误 ❌' }}</p>
				<p>
					<label>释义</label>
					<span>{{ currentWord!.translation }}</span>
				</p>
				<button @click="onNextQuestion">{{ isFinishing ? '完成训练' : '下一题' }}</button>
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
	TrainingSession, GenerateTrainingSet,
} from '../modules/appState.mjs';
const app = UseAppState();

// 路由

import { useRouter } from 'vue-router';
const router = useRouter();

function onBackToHomepage() {
	if(trainingSession.value) {
		if(!confirm('正在训练中，退出将丢失训练进度。是否退出？'))
			return;
	}
	router.push('/');
}

// 状态

import { ref, computed } from 'vue';
const hasTrainableWords = computed(() => app.enabledDicts.value.reduce((sum, b) => sum + b.count, 0));
const isLoading = ref(false);
const hasJustAnswered = ref(false);  // 是否刚点完选项，正在查看结果。
const isFinishing = computed(() => remainingQuestionCount.value === 0);

// 训练

const trainingSession = ref(null as TrainingSession | null);
const currentQuestion = computed(() => trainingSession.value?.currentQuestion);
const currentWord = computed(() => trainingSession.value?.currentQuestion?.target);
const remainingQuestionCount = computed(() => trainingSession?.value?.pool.length!);
const pendingScore = ref(NaN);

async function onStartTraining() {
	isLoading.value = true;

	const trainingSet = await GenerateTrainingSet();
	trainingSession.value = new TrainingSession(app.userSettings.value.training, trainingSet);
	await trainingSession.value.Initialize();
	
	isLoading.value = false;
	trainingSession.value!.NextQuestion();
}

function onAnswered(score: number) {
	pendingScore.value = score;
	hasJustAnswered.value = true;
}

function onNextQuestion() {
	trainingSession.value!.MarkScore(pendingScore.value);
	hasJustAnswered.value = false;
	pendingScore.value = NaN;

	if(isFinishing.value)
		onFinishTraining();
	else
		trainingSession.value!.NextQuestion();
}

async function onFinishTraining() {
	isLoading.value = true;

	const session = trainingSession.value!;
	trainingSession.value = null;
	await session.ReportResults();
	
	isLoading.value = false;

	alert('训练完成！');
}
</script>
