
const SERP_API_URL = "https://serpapi.com/search.json";
const DEFAULT_RESULT_COUNT = 100;

const normalizeDomain = (domain) => {
	return domain
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, "")
		.replace(/^www\./, "")
		.split("/")[0]
		.split(":")[0];
};

const getHostname = (url) => {
	try {
		return normalizeDomain(new URL(url).hostname);
	} catch {
		return "";
	}
};

const belongsToDomain = (url, targetDomain) => {
	const resultDomain = getHostname(url);
	return resultDomain === targetDomain || resultDomain.endsWith(`.${targetDomain}`);
};

export const checkKeywordRank = async ({
	keyword,
	domain,
	location = "Sri Lanka",
	language = "en",
	device = "desktop",
}) => {
	const apiKey = process.env.SERP_API_KEY;

	if (!apiKey) {
		throw new Error("SERP_API_KEY is not configured.");
	}

	if (!keyword?.trim() || !domain?.trim()) {
		throw new Error("Keyword and domain are required to check a rank.");
	}

	const targetDomain = normalizeDomain(domain);
	const params = new URLSearchParams({
		engine: "google",
		q: keyword.trim(),
		api_key: apiKey,
		location,
		hl: language,
		device,
		num: String(DEFAULT_RESULT_COUNT),
	});

	const response = await fetch(`${SERP_API_URL}?${params}`);
	const data = await response.json();

	if (!response.ok || data.error) {
		throw new Error(data.error || `SerpApi request failed with status ${response.status}.`);
	}

	const organicResults = Array.isArray(data.organic_results) ? data.organic_results : [];
	const results = organicResults
		.filter((result) => result.link)
		.map((result, index) => ({
			position: Number(result.position) || index + 1,
			url: result.link,
			domain: getHostname(result.link),
			title: result.title || "",
			snippet: result.snippet || "",
		}));

	const trackedResult = results.find((result) => belongsToDomain(result.url, targetDomain));

	return {
		currentPosition: trackedResult?.position ?? null,
		competitors: results.filter((result) => !belongsToDomain(result.url, targetDomain)),
		searchedAt: new Date(),
		location,
		device,
	};
};