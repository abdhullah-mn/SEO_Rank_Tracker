const MAX_HTML_SIZE = 5 * 1024 * 1024;
const REQUEST_TIMEOUT = 15000;

const decodeHtml = (value = "") => value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

const getAttribute = (tag, attribute) => {
    const match = tag.match(new RegExp(`${attribute}\\s*=\\s*["']([^"']*)["']`, "i"));
    return match?.[1]?.trim() || "";
};

const getMeta = (html, name) => {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    const tag = tags.find((candidate) => {
        const key = getAttribute(candidate, "name") || getAttribute(candidate, "property");
        return key.toLowerCase() === name.toLowerCase();
    });
    return tag ? getAttribute(tag, "content") : "";
};

const getTagTexts = (html, tagName) => {
    const matches = html.match(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi")) || [];
    return matches.map((match) => decodeHtml(match.replace(new RegExp(`^<${tagName}\\b[^>]*>|<\\/${tagName}>$`, "gi"), ""))).filter(Boolean);
};

const getWords = (html) => decodeHtml(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ""))
    .toLowerCase()
    .match(/[a-z][a-z0-9'-]{2,}/g) || [];

const normalizeUrl = (value) => {
    const url = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
    return new URL(url).toString();
};

const addIssue = (issues, severity, category, message, recommendation) => {
    issues.push({ severity, category, message, recommendation });
};

export const analyzeWebsite = async (inputUrl) => {
    const url = normalizeUrl(inputUrl.trim());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const startedAt = Date.now();

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "SEO-Rank-Tracker/1.0" },
        });
        const html = await response.text();
        const limitedHtml = html.slice(0, MAX_HTML_SIZE);
        const pageUrl = new URL(url);
        const title = decodeHtml((limitedHtml.match(/<title\b[^>]*>[\s\S]*?<\/title>/i) || [""])[0].replace(/<\/?title\b[^>]*>/gi, ""));
        const description = getMeta(limitedHtml, "description");
        const headingData = Object.fromEntries([1, 2, 3, 4, 5, 6].map((level) => [`h${level}`, getTagTexts(limitedHtml, `h${level}`).length]));
        const h1Texts = getTagTexts(limitedHtml, "h1");
        const words = getWords(limitedHtml);
        const wordCounts = new Map();
        words.forEach((word) => wordCounts.set(word, (wordCounts.get(word) || 0) + 1));
        const keywords = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count, density: Number(((count / Math.max(words.length, 1)) * 100).toFixed(2)) }));
        const links = (limitedHtml.match(/<a\b[^>]*href\s*=\s*["'][^"']+["'][^>]*>/gi) || []).map((tag) => getAttribute(tag, "href")).filter(Boolean);
        const images = limitedHtml.match(/<img\b[^>]*>/gi) || [];
        const internalLinks = links.filter((link) => {
            try {
                return new URL(link, url).hostname === pageUrl.hostname;
            } catch {
                return link.startsWith("/") || link.startsWith("#");
            }
        }).length;
        const issues = [];
        if (!title) addIssue(issues, "critical", "SEO", "The page is missing a title tag.", "Add a unique title between 50 and 60 characters.");
        else if (title.length < 30 || title.length > 65) addIssue(issues, "warning", "SEO", "The title length is outside the recommended range.", "Keep the title between 50 and 60 characters where possible.");
        if (!description) addIssue(issues, "critical", "SEO", "The page is missing a meta description.", "Add a useful description between 150 and 160 characters.");
        if (h1Texts.length === 0) addIssue(issues, "warning", "Content", "The page does not contain an H1 heading.", "Add one clear H1 describing the page topic.");
        if (h1Texts.length > 1) addIssue(issues, "info", "Content", "The page contains multiple H1 headings.", "Use one primary H1 and structure supporting content with H2 headings.");
        if (images.some((image) => !getAttribute(image, "alt"))) addIssue(issues, "warning", "Accessibility", "Some images are missing alternative text.", "Add descriptive alt text to informative images.");
        if (response.status >= 400) addIssue(issues, "critical", "Technical", `The page returned HTTP status ${response.status}.`, "Ensure the page responds successfully to search engine crawlers.");
        const seo = Math.max(0, 100 - issues.filter((issue) => issue.category === "SEO").length * 25 - (getMeta(limitedHtml, "viewport") ? 0 : 10));
        const accessibility = Math.max(0, 100 - (images.length ? Math.round((images.filter((image) => !getAttribute(image, "alt")).length / images.length) * 50) : 0));
        const performance = Math.max(0, response.ok ? (Date.now() - startedAt < 3000 ? 100 : 75) : 25);
        const bestPractices = response.ok ? 100 : 50;

        return {
            url,
            status: "completed",
            overallScore: Math.round((seo + accessibility + performance + bestPractices) / 4),
            categories: { seo, performance, accessibility, bestPractices },
            loadTime: Date.now() - startedAt,
            pageSize: Buffer.byteLength(html, "utf8"),
            wordCount: words.length,
            metaData: {
                title,
                description,
                canonical: getMeta(limitedHtml, "canonical") || ((limitedHtml.match(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i) || [""])[0] ? getAttribute((limitedHtml.match(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i) || [""])[0], "href") : ""),
                robots: getMeta(limitedHtml, "robots"),
                ogTitle: getMeta(limitedHtml, "og:title"),
                ogDescription: getMeta(limitedHtml, "og:description"),
                ogImage: getMeta(limitedHtml, "og:image"),
                twitterCard: getMeta(limitedHtml, "twitter:card"),
                viewport: getMeta(limitedHtml, "viewport"),
                charset: getAttribute((limitedHtml.match(/<meta\b[^>]*charset\s*=\s*["']?[^\s"'>]+/i) || [""])[0], "charset"),
            },
            headings: { ...headingData, h1Texts },
            links: { internal: internalLinks, external: links.length - internalLinks, total: links.length },
            images: { total: images.length, missingAlt: images.filter((image) => !getAttribute(image, "alt")).length, withAlt: images.filter((image) => Boolean(getAttribute(image, "alt"))).length },
            keywords,
            issues,
        };
    } finally {
        clearTimeout(timeout);
    }
};