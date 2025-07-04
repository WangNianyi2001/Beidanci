import Express from 'express';
import Fs from 'fs';
import Path from 'path';
import { userDir, dictDir } from '../utils/localData.mjs';

const router = Express.Router();
export default router;

// 工具函数：加载用户记录
export function LoadUser(user) {
	const path = Path.join(userDir, `${user}.json`);
	if (!Fs.existsSync(path))
		throw new Error('User not found');
	return JSON.parse(Fs.readFileSync(path, 'utf-8'));
}

// 工具函数：保存用户记录
export function SaveUser(user, data) {
	const path = Path.join(userDir, `${user}.json`);
	Fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// 工具函数：加载词库词表
export function LoadDict(dictName) {
	const path = Path.join(dictDir, `${dictName}.json`);
	if (!Fs.existsSync(path))
		throw new Error('Dict not found');
	const dict = JSON.parse(Fs.readFileSync(path, 'utf-8'));
	return dict.vocabulary;
}

// GET /train/untrained-count?user=&dict=
router.get('/untrained-count', (req, res) => {
	const { user, dict } = req.query;
	if (!user || !dict)
		return res.status(400).json({ success: false, message: 'Missing user or dict' });

	try {
		const userData = LoadUser(user);
		const trained = new Set((userData.trainingRecords[dict] || []).map(R => R.word));
		const allWords = LoadDict(dict);
		const untrainedCount = allWords.filter(W => !trained.has(W.orthography)).length;
		res.json({ success: true, data: { count: untrainedCount } });
	} catch (err) {
		res.status(404).json({ success: false, message: err.message });
	}
});



// 接收、处理训练结果
// POST /train/report?user=
router.post('/report', (req, res) => {
	const { user } = req.query;
	const { time, results } = req.body;

	if (!user || !time || !Array.isArray(results))
		return res.status(400).json({ success: false, message: 'Missing user, time, or results' });

	try {
		const userData = LoadUser(user);

		if(!userData.trainingRecords)
			userData.trainingRecords = {};
		UpdateTrainingRecordsByTrainingResult(userData.trainingRecords, time, results);
	
		SaveUser(user, userData);

		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
});

function UpdateTrainingRecordsByTrainingResult(records, time, results) {
	for (const result of results) {
		if (!result.dict || !result.word || !Array.isArray(result.scores))
			continue;

		// 检查是否已经有此词库的记录了。
		if(!(result.dict in records))
			records[result.dict] = [];
		const dictRecords = records[result.dict];

		// 查询既有训练记录。
		const previousRecordIndex = dictRecords.findIndex(record => record.word === result.word);
		if(previousRecordIndex === -1)
			dictRecords.push(CreateNewRecord(time, result));
		else
			UpdateExistingRecord(dictRecords[previousRecordIndex], time, result);
	}
	// 对结果按掌握度从小到大排序。
	for(const dictRecords of Object.values(records)) {
		dictRecords.sort((a, b) => a.lastConfidence - b.lastConfidence);
	}
}

function CreateNewRecord(time, result) {
	const scores = result.scores;
	return ({
		word: result.word,
		lastConfidence: CalculateDirectConfidence(scores),
		lastTrainedTime: time,
		count: scores.length,
	});
}

function CalculateDirectConfidence(scores) {
	return scores.reduce((a, b) => a + b, 0) / (scores.length + 1);
}

// TODO: 令此两值可配置。
const FORGETTING_RATE = 0.1;  // 遗忘速率倍率
const LEARNING_T = 0.5;  // 每次学习后，实际的掌握程度对记录值的影响程度，[0,1] 之间。

function UpdateExistingRecord(record, time, result) {
	const scores = result.scores;
	const ecc = EstimateCurrentConfidence(record);
	const dcc = CalculateDirectConfidence(scores);

	record.lastConfidence = Math.exp(Lerp(Math.log(ecc), Math.log(dcc), LEARNING_T));
	record.lastTrainedTime = time;
	record.count += scores.length;
}

function Lerp(a, b, t) {
	return a * (1-t) + b * t;
}

function EstimateCurrentConfidence(record, time = Date.now()) {
	const elapsedTime = (time - record.lastTrainedTime) / 86400000;
	return record.lastConfidence * Math.pow(1 + FORGETTING_RATE, -elapsedTime / record.count);
}



// 生成训练词集。
// GET /train/generate?user=&size=
router.get('/generate', (req, res) => {
	const { user } = req.query;
	if (!user)
		return res.status(400).json({ success: false, message: 'Missing user' });

	try {
		const userData = LoadUser(user);
		const batchSize = parseInt(req.query.size) || userData.settings?.training?.batchSize || 25;
		const aggressiveness = userData.settings?.training?.aggressiveness || 0.3;
		const enabledDicts = userData.enabledDicts;

		// 先将所有单词分类。
		const untrainedCandidates = [], trainedCandidates = [];
		for (const dict of enabledDicts) {
			const dictRecords = userData.trainingRecords[dict] || [];
			const trainedIndex = new Map(dictRecords.map(r => [r.word, r]));
			for(const word of LoadDict(dict)) {
				if(trainedIndex.has(word.orthography)) {
					trainedCandidates.push({
						...word, dict,
						confidence: EstimateCurrentConfidence(trainedIndex.get(word.orthography)),
						trained: true,
					});
				}
				else {
					untrainedCandidates.push({
						...word, dict,
						trained: false,
					});
				}
			}
		}
		trainedCandidates.sort((a, b) => a.confidence - b.confidence);

		// 建立结果
		const result = [];
		for(let i = 0; i < batchSize; ++i) {
			// 皆耗尽，提早结束。
			if(!untrainedCandidates.length && !trainedCandidates.length)
				break;
			// 只剩训练过的词，按掌握程度从小到大加入。
			if(!untrainedCandidates.length) {
				result.push(...trainedCandidates.slice(0, batchSize - i));
				break;
			}
			// 只剩未训练过的词，打乱后直接加入。
			if(!trainedCandidates.length) {
				untrainedCandidates.sort(() => Math.random() - .5);
				result.push(...untrainedCandidates.slice(0, batchSize - i));
				break;
			}
			// 正常依概率选择。
			const trained = trainedCandidates.shift();
			const chooseTrained = ChooseBetweenTrainedAndUntrained(trained.confidence, aggressiveness);
			if(chooseTrained)
				result.push(trained);
			else {
				const index = Math.floor(Math.random() * untrainedCandidates.length);
				result.push(untrainedCandidates.splice(index, 1)[0]);
			}
		}

		// 返回
		res.json({ success: true, data: result });
	} catch (err) {
		res.status(404).json({ success: false, message: err.message });
	}
});

function ChooseBetweenTrainedAndUntrained(confidence, aggressiveness) {
	return Math.random() < (1 - confidence) * (1 - aggressiveness);
}