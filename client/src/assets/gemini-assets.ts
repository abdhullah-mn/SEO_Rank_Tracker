export type SeoIssueSeverity = "critical" | "warning" | "info";

export interface SeoAnalysisKeyword {
  word: string;
  count: number;
  density: number;
}

export interface SeoAnalysisIssue {
  severity: SeoIssueSeverity;
  category: string;
  message: string;
  recommendation: string;
}

export const seoAnalysisSchema = {
  type: "object",
  properties: {
    overallScore: { type: "integer" },
    categories: {
      type: "object",
      properties: {
        seo: { type: "integer" },
        performance: { type: "integer" },
        accessibility: { type: "integer" },
        bestPractices: { type: "integer" },
      },
      required: ["seo", "performance", "accessibility", "bestPractices"],
    },
    keywords: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          count: { type: "integer" },
          density: { type: "number" },
        },
        required: ["word", "count", "density"],
      },
    },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: {
            type: "string",
            enum: ["critical", "warning", "info"],
          },
          category: { type: "string" },
          message: { type: "string" },
          recommendation: { type: "string" },
        },
        required: ["severity", "category", "message", "recommendation"],
      },
    },
  },
  required: ["overallScore", "categories", "keywords", "issues"],
} as const;

export function buildSeoAnalysisPrompt(scrapedData: Record<string, any>): string {
  const safeMeta = scrapedData.metaData ?? {};
  const safeHeadings = scrapedData.headings ?? {};
  const safeLinks = scrapedData.links ?? {};
  const safeImages = scrapedData.images ?? {};

  return `You are an expert SEO analyst. Analyze the following website data and provide a comprehensive SEO audit.

Website URL: ${scrapedData.url ?? ""}
Load Time: ${scrapedData.loadTime ?? 0}ms
Status Code: ${scrapedData.statusCode ?? 0}
Page Size: ${Math.round((scrapedData.pageSize ?? 0) / 1024)}KB
Word Count: ${scrapedData.wordCount ?? 0}

META DATA:
- Title: "${safeMeta.title ?? ""}" (${(safeMeta.title ?? "").length} chars)
- Description: "${safeMeta.description ?? ""}" (${(safeMeta.description ?? "").length} chars)
- Canonical: "${safeMeta.canonical ?? ""}"
- Robots: "${safeMeta.robots ?? ""}"
- OG Title: "${safeMeta.ogTitle ?? ""}"
- OG Description: "${safeMeta.ogDescription ?? ""}"
- OG Image: "${safeMeta.ogImage ?? ""}"
- Twitter Card: "${safeMeta.twitterCard ?? ""}"
- Viewport: "${safeMeta.viewport ?? ""}"
- Charset: "${safeMeta.charset ?? ""}"

HEADINGS:
- H1: ${safeHeadings.h1 ?? ""} (texts: ${JSON.stringify(safeHeadings.h1Texts ?? [])})
- H2: ${safeHeadings.h2 ?? ""}
- H3: ${safeHeadings.h3 ?? ""}
- H4: ${safeHeadings.h4 ?? ""}
- H5: ${safeHeadings.h5 ?? ""}
- H6: ${safeHeadings.h6 ?? ""}

LINKS:
- Internal: ${safeLinks.internal ?? 0}
- External: ${safeLinks.external ?? 0}
- Total: ${safeLinks.total ?? 0}

IMAGES:
- Total: ${safeImages.total ?? 0}
- Missing Alt Text: ${safeImages.missingAlt ?? 0}
- With Alt Text: ${safeImages.withAlt ?? 0}

PAGE CONTENT (first 3000 chars):
${scrapedData.bodyText ?? ""}

Scoring guidelines:
- Title: 50-60 chars optimal, must exist
- Description: 150-160 chars optimal, must exist
- H1: exactly 1 is ideal
- Images: all should have alt text
- Load time: <3s good, <5s ok, >5s poor
- Page size: <3MB good
- Must have viewport meta, charset, canonical
- OG tags and Twitter cards are important
- Internal linking is good for SEO
- Word count: >300 words for content pages
- Check heading hierarchy

Severity levels must be exactly one of: "critical", "warning", or "info".
Provide 5-15 issues sorted by severity (critical first). Be specific and actionable with recommendations.
Extract top 10 keywords by frequency from the page content.`;
}

