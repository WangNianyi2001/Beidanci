import Express from 'express';
import Fs from 'fs';
import Path from 'path';
import { userDir } from '../utils/localData.mjs';

const router = Express.Router();
export default router;

// GET /user/list
router.get('/list', (_, res) => {
	const users = Fs.readdirSync(userDir)
		.filter(file => file.endsWith('.json'))
		.map(file => Path.basename(file, '.json'));
	res.json({ success: true, data: users });
});

// POST /user/create?user=
router.post('/create', (req, res) => {
	const userName = req.query.user;
	if (!userName)
		return res.status(400).json({ success: false, message: 'Missing user name' });

	const filePath = Path.join(userDir, `${userName}.json`);
	if (Fs.existsSync(filePath))
		return res.status(409).json({ success: false, message: 'User already exists' });

	const record = {
		name: userName,
		trainingRecords: {},
		enabledDicts: [],
	};
	Fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
	res.json({ success: true });
});

// GET /user/info?user=
router.get('/info', (req, res) => {
	const userName = req.query.user;
	if (!userName)
		return res.status(400).json({ success: false, message: 'Missing user name' });

	const filePath = Path.join(userDir, `${userName}.json`);
	if (!Fs.existsSync(filePath)) {
		return res.status(404).json({ success: false, message: 'User not found' });
	}

	const data = JSON.parse(Fs.readFileSync(filePath, 'utf-8'));
	res.json({ success: true, data });
});

// DELETE /user?user=
router.delete('/', (req, res) => {
	const userName = req.query.user;
	if (!userName)
		return res.status(400).json({ success: false, message: 'Missing user name' });

	const filePath = Path.join(userDir, `${userName}.json`);
	if (!Fs.existsSync(filePath)) {
		return res.status(404).json({ success: false, message: 'User not found' });
	}
	Fs.unlinkSync(filePath);
	res.json({ success: true });
});

// PATCH /user/set-dictionary-enabled?user=&dict=&enabled=
router.patch('/set-dictionary-enabled', (req, res) => {
	const { user, dict, enabled } = req.query;

	if (!user || !dict || typeof enabled !== 'string') {
		return res.status(400).json({ success: false, message: 'Missing user, dict, or enabled flag' });
	}

	const filePath = Path.join(userDir, `${user}.json`);
	if (!Fs.existsSync(filePath))
		return res.status(404).json({ success: false, message: 'User not found' });

	const userData = JSON.parse(Fs.readFileSync(filePath, 'utf-8'));
	const enabledDicts = new Set(userData.enabledDicts);

	if (enabled === 'true') {
		enabledDicts.add(dict);
	} else if (enabled === 'false') {
		enabledDicts.delete(dict);
	} else {
		return res.status(400).json({ success: false, message: 'Invalid enabled value' });
	}

	userData.enabledDicts = Array.from(enabledDicts);
	Fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
	res.json({ success: true });
});

// DELETE /user/reset-dictionary?user=&dict=
router.delete('/reset-dictionary', (req, res) => {
	const { user, dict } = req.query;

	if (!user || !dict)
		return res.status(400).json({ success: false, message: 'Missing user or dict' });

	const filePath = Path.join(userDir, `${user}.json`);
	if (!Fs.existsSync(filePath))
		return res.status(404).json({ success: false, message: 'User not found' });

	const userData = JSON.parse(Fs.readFileSync(filePath, 'utf-8'));
	delete userData.trainingRecords[dict];

	Fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
	res.json({ success: true });
});

