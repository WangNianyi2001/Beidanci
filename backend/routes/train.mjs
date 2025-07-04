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

// GET /train/generate?user=&size=
router.get('/generate', (req, res) => {
	const { user } = req.query;
	const size = parseInt(req.query.size) || 25;

	if (!user)
		return res.status(400).json({ success: false, message: 'Missing user' });

	try {
		const userData = LoadUser(user);
		const enabledDicts = userData.enabledDicts;

		const allCandidates = [];
		for (const dictName of enabledDicts) {
			const words = LoadDict(dictName);
			const records = userData.trainingRecords[dictName] || [];
			const trainedSet = new Set(records.map(R => R.word));
			for (const word of words) {
				allCandidates.push({
					...word,
					dict: dictName,
					trained: trainedSet.has(word.orthography)
				});
			}
		}

		// 先用“随机挑选”作为 placeholder（未来替换为智能挑选）
		const shuffled = allCandidates.sort(() => Math.random() - 0.5);
		const selected = shuffled.slice(0, size);

		res.json({ success: true, data: selected });
	} catch (err) {
		res.status(404).json({ success: false, message: err.message });
	}
});

// POST /train/report?user=
router.post('/report', (req, res) => {
	const { user } = req.query;
	const { time, results } = req.body;

	if (!user || !time || !Array.isArray(results))
		return res.status(400).json({ success: false, message: 'Missing user, time, or results' });

	try {
		const userData = LoadUser(user);

		for (const item of results) {
			const { dict, word, scores } = item;
			if (!dict || !word || !Array.isArray(scores)) continue;

			const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

			if (!userData.trainingRecords[dict])
				userData.trainingRecords[dict] = [];

			const records = userData.trainingRecords[dict];
			const existing = records.find(R => R.word === word);

			if (existing) {
				existing.lastConfidence = avg;
				existing.lastTrainedTime = time;
				existing.count += scores.length;
			} else {
				records.push({
					word,
					lastConfidence: avg,
					lastTrainedTime: time,
					count: scores.length
				});
			}
		}

		SaveUser(user, userData);
		res.json({ success: true });
	} catch (err) {
		res.status(404).json({ success: false, message: err.message });
	}
});
