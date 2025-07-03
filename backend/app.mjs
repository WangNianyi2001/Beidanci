import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const PORT = 8533;
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));



app.get('/', (_, res) => {
	res.send('Beidanci backend is running (ESM mode).');
});


import userRoutes from './routes/user.mjs';
app.use('/user', userRoutes);

import dictRoutes from './routes/dictionary.mjs';
app.use('/dictionary', dictRoutes);

import trainRoutes from './routes/train.mjs';
app.use('/train', trainRoutes);



app.listen(PORT, () => {
	console.log(`Beidanci backend listening at http://localhost:${PORT}`);
});
