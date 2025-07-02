const base = '';

export async function fetchTrainSet(user, size = 25) {
	const res = await fetch(`${base}/train/generate?user=${user}&size=${size}`);
	const json = await res.json();
	return json.data;
}

export async function reportTrainResult(user, time, results) {
	const res = await fetch(`${base}/train/report?user=${user}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ time, results })
	});
	const json = await res.json();
	return json.success;
}
