import { useEffect, useState } from "react";

interface StatusResponse {
	ok: boolean;
	message: string;
	runtime: string;
}

export function App() {
	const [status, setStatus] = useState<StatusResponse | undefined>();

	useEffect(() => {
		const abortController = new AbortController();

		void fetch("/api/status", { signal: abortController.signal })
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(`Status request failed: ${response.status}`);
				}
				setStatus((await response.json()) as StatusResponse);
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
				setStatus({
					ok: false,
					message: error instanceof Error ? error.message : "Unknown error",
					runtime: "browser",
				});
			});

		return () => {
			abortController.abort();
		};
	}, []);

	return (
		<main className="shell">
			<section className="hero">
				<p className="eyebrow">Rsbuild + Cloudflare Workers</p>
				<h1>React app, Worker API, one build graph.</h1>
				<p className="lede">
					The browser entry is compiled by Rsbuild React support while the
					Worker entry is emitted through rsbuild-cloudflare.
				</p>
			</section>

			<section className="status-panel" aria-label="Worker status">
				<div>
					<span className={status?.ok ? "dot dot-ok" : "dot"} />
					<span className="label">Worker status</span>
				</div>
				<strong>{status ? status.message : "Loading..."}</strong>
				<small>{status ? status.runtime : "fetching /api/status"}</small>
			</section>
		</main>
	);
}
