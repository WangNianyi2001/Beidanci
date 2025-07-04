import Express from 'express';
import Fs from 'fs';
import Path from 'path';
import { dictDir } from '../utils/localData.mjs';

const router = Express.Router();
export default router;

// GET /dictionary/list
router.get('/list', (_, res) => {
	const files = Fs.readdirSync(dictDir).filter(F => F.endsWith('.json'));
	const dictNames = files.map(F => Path.basename(F, '.json'));
	res.json({ success: true, data: dictNames });
});

// GET /dictionary/info?dict=
import { LoadUser, LoadDict } from './train.mjs';
import { EstimateCurrentConfidence } from '../utils/math.mjs';
router.get('/info', (req, res) => {
	const { dict, user } = req.query;
	if (!dict)
		return res.status(400).json({ success: false, message: 'Missing dict name' });

	const path = Path.join(dictDir, `${dict}.json`);
	if (!Fs.existsSync(path))
		return res.status(404).json({ success: false, message: 'Dict not found' });

	const raw = JSON.parse(Fs.readFileSync(path, 'utf-8'));
	const data = {
		name: raw.name,
		count: raw.vocabulary.length,
	};

	// 添加用户特定的信息
	if(user) {
		const userData = LoadUser(user);

		const enabled = userData.enabledDicts.includes(dict);
		data.enabled = enabled;

		const trained = new Set((userData.trainingRecords[dict] || []).map(R => R.word));
		const allWords = LoadDict(dict);
		const untrainedCount = allWords.filter(W => !trained.has(W.orthography)).length;
		data.untrainedCount = untrainedCount;

		// 罗列最记不住的 top 10 词汇。
		const unconfidentLeaderboard = [];
		if(dict in userData.trainingRecords) {
			// 按现时掌握度排序。
			const records = userData.trainingRecords[dict]
				.map(record => ({
					word: record.word,
					confidence: EstimateCurrentConfidence(record),
				}))
				.filter(r => r.confidence < 0.75);
			records.sort((a, b) => a.confidence - b.confidence);
			unconfidentLeaderboard.push(...records.slice(0, 10));
		}
		data.unconfidentLeaderboard = unconfidentLeaderboard;
	}

	res.json({ success: true, data });
});

// GET /dictionary/vocabulary?dict=
router.get('/vocabulary', (req, res) => {
	const { dict } = req.query;
	if (!dict)
		return res.status(400).json({ success: false, message: 'Missing dict name' });

	const path = Path.join(dictDir, `${dict}.json`);
	if (!Fs.existsSync(path))
		return res.status(404).json({ success: false, message: 'Dict not found' });

	const data = JSON.parse(Fs.readFileSync(path, 'utf-8'));
	res.json({ success: true, data: data.vocabulary });
});

// POST /dictionary/import-csv
// Payload: { name: string, csv: string (raw text) }
router.post('/import-csv', (req, res) => {
	const { name, csv } = req.body;
	if (!name || !csv)
		return res.status(400).json({ success: false, message: 'Missing name or csv' });

	const lines = csv.trim().split(/\r?\n/);
	const vocabulary = [];

	for (const line of lines) {
		const [word, trans] = line.split(',');
		if (!word || !trans)
			return res.status(400).json({ success: false, message: `Invalid CSV line: ${line}` });
		vocabulary.push({
			orthography: word.trim(),
			translation: trans.trim()
		});
	}

	const record = { name, vocabulary };
	const savePath = Path.join(dictDir, `${name}.json`);
	Fs.writeFileSync(savePath, JSON.stringify(record, null, 2));

	res.json({ success: true });
});

// DELETE /dictionary?dict=
router.delete('/', (req, res) => {
	const { dict } = req.query;
	if (!dict)
		return res.status(400).json({ success: false, message: 'Missing dict name' });

	const path = Path.join(dictDir, `${dict}.json`);
	if (!Fs.existsSync(path))
		return res.status(404).json({ success: false, message: 'Dict not found' });

	Fs.unlinkSync(path);
	res.json({ success: true });
});