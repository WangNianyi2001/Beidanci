export async function Fetch<T = any>(method: string, url: string, init?: any) {
	const res = await fetch(url, { method, ...init });
	if(!res.ok)
		throw new Error(`${res.status}: ${await res.text()}`);

	return await res.json() as {
		success: boolean,
		message?: string,
		data: T,
	};
}