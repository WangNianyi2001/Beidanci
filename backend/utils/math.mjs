// TODO: 令此两值可配置。
export const FORGETTING_RATE = 0.1;  // 遗忘速率倍率
export const LEARNING_T = 0.5;  // 每次学习后，实际的掌握程度对记录值的影响程度，[0,1] 之间。

export function EstimateCurrentConfidence(record, time = Date.now()) {
	const elapsedTime = (time - record.lastTrainedTime) / 86400000;
	return record.lastConfidence * Math.pow(1 + FORGETTING_RATE, -elapsedTime / record.count);
}

export function Lerp(a, b, t) {
	return a * (1-t) + b * t;
}

export function CalculateDirectConfidence(scores) {
	return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function ChooseBetweenTrainedAndUntrained(confidence, aggressiveness) {
	return Math.random() < (1 - confidence) * (1 - aggressiveness);
}