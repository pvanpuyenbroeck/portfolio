import {collectSchemas, JsonLd} from './schemas';
import {
  BlogPostDocument,
  ComparisonTable,
  ContentSection,
  FAQSection,
  TLDRBlock,
  VideoBlock,
  escapeHtml,
  normalizeParagraphs,
  renderSection,
  renderTable,
} from './portableText';

interface RenderResult {
  html: string;
  schemas: JsonLd[];
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {status: 405});
    }

    let payload: BlogPostDocument;
    try {
      payload = (await request.json()) as BlogPostDocument;
    } catch (error) {
      return new Response('Invalid JSON body', {status: 400});
    }

    const url = new URL(request.url);

    if (url.pathname === '/render') {
      try {
        const result = renderPayload(payload);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }

    if (url.pathname === '/preview') {
      try {
        const result = renderPayload(payload);
        return new Response(renderPreviewPage(result), {
          headers: {'Content-Type': 'text/html; charset=UTF-8'},
        });
      } catch (error) {
        return errorResponse(error);
      }
    }

    return new Response('Not Found', {status: 404});
  },
};

function renderPayload(post: BlogPostDocument): RenderResult {
  const errors = validatePost(post);
  if (errors.length) {
    throw new Error(`Invalid blog post payload: ${errors.join(', ')}`);
  }

  const html = renderArticle(post);
  const schemas = collectSchemas(post);

  return {html, schemas};
}

function validatePost(post: BlogPostDocument): string[] {
  const issues: string[] = [];
  if (!post || typeof post !== 'object') {
    issues.push('payload missing');
    return issues;
  }
  if (!post.title) issues.push('title missing');
  if (!post.metaDescription) issues.push('metaDescription missing');
  if (!post.author) issues.push('author missing');
  if (!post.publishedAt) issues.push('publishedAt missing');
  if (!Array.isArray(post.sections) || !post.sections.length) issues.push('sections missing');
  return issues;
}

function renderArticle(post: BlogPostDocument): string {
  const header = renderHeader(post);
  const tldr = renderTldr(post.tldr);
  const sections = renderSections(post.sections);
  const cta = post.cta ? `<footer class="cta">${normalizeParagraphs(post.cta)}</footer>` : '';

  return `
    <article itemscope itemtype="https://schema.org/Article">
      ${header}
      ${tldr}
      ${sections}
      ${cta}
    </article>
  `.trim();
}

function renderHeader(post: BlogPostDocument): string {
  const coverImage = renderCoverImage(post.coverImage);
  const metaLines = [
    post.author ? `<span class="byline" itemprop="author">${escapeHtml(post.author)}</span>` : null,
    post.publishedAt ? `<time datetime="${escapeHtml(post.publishedAt)}" itemprop="datePublished">${formatDate(post.publishedAt)}</time>` : null,
    post.updatedAt ? `<time datetime="${escapeHtml(post.updatedAt)}" itemprop="dateModified">Updated ${formatDate(post.updatedAt)}</time>` : null,
    post.readingTime ? `<span class="reading-time">${Math.round(post.readingTime)} min read</span>` : null,
  ].filter(Boolean);

  const meta = metaLines.length ? `<p class="meta">${metaLines.join(' • ')}</p>` : '';

  return `
    <header>
      <h1 itemprop="headline">${escapeHtml(post.title)}</h1>
      ${meta}
      ${coverImage}
      <p class="description" itemprop="description">${escapeHtml(post.metaDescription || '')}</p>
    </header>
  `.trim();
}

function renderCoverImage(image?: {url?: string; asset?: {url?: string}; alt?: string; width?: number; height?: number} | null): string {
  if (!image) return '';
  const url = image.url || image.asset?.url;
  if (!url) return '';
  const alt = escapeAttribute(image.alt || '');
  const width = image.width ? ` width="${image.width}"` : '';
  const height = image.height ? ` height="${image.height}"` : '';
  return `<figure class="cover"><img src="${escapeAttribute(url)}" alt="${alt}" loading="lazy"${width}${height} /></figure>`;
}

function renderTldr(blocks?: TLDRBlock[] | null): string {
  if (!blocks || !blocks.length) return '';
  const items = blocks.flatMap((block) => (Array.isArray(block.bullets) ? block.bullets : []));
  if (!items.length) return '';
  const list = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  return `<section aria-label="TL;DR"><h2>TL;DR</h2><ul>${list}</ul></section>`;
}

function renderSections(sections?: Array<ContentSection | FAQSection | VideoBlock | ComparisonTable> | null): string {
  if (!sections || !sections.length) return '';
  return sections
    .map((section) => {
      if (!section || typeof section !== 'object') return '';
      switch (section._type) {
        case 'contentSection':
          return renderSection(section as ContentSection);
        case 'faqSection':
          return renderFaqSection(section as FAQSection);
        case 'videoBlock':
          return renderVideoSection(section as VideoBlock);
        case 'comparisonTable':
          return renderComparisonSection(section as ComparisonTable);
        default:
          return '';
      }
    })
    .join('');
}

function renderFaqSection(section: FAQSection): string {
  if (!section.items || !section.items.length) return '';
  const title = section.title ? escapeHtml(section.title) : 'Frequently Asked Questions';
  const items = section.items
    .map((item) => {
      const answerHtml = normalizeParagraphs(item.answer);
      return `<div class="faq-item"><h3>${escapeHtml(item.question)}</h3>${answerHtml}</div>`;
    })
    .join('');
  return `<section class="faq"><h2>${title}</h2>${items}</section>`;
}

function renderVideoSection(block: VideoBlock): string {
  const heading = block.title ? `<h2>${escapeHtml(block.title)}</h2>` : '';
  const description = block.description ? normalizeParagraphs(block.description) : '';
  const videoEmbed = block.videoUrl
    ? `
        <div class="video-embed">
          <iframe src="${escapeAttribute(block.videoUrl)}" title="${escapeAttribute(block.title || 'Video')}" allowfullscreen loading="lazy"></iframe>
        </div>
      `.trim()
    : '';
  return `<section class="video-block">${heading}${description}${videoEmbed}</section>`;
}

function renderComparisonSection(table: ComparisonTable): string {
  const title = table.title ? `<h2>${escapeHtml(table.title)}</h2>` : '';
  const tableHtml = renderTable(table);
  return `<section class="comparison">${title}${tableHtml}</section>`;
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(date);
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderPreviewPage(result: RenderResult): string {
  const schemaScripts = result.schemas
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(extractHeadline(result.html) || 'Preview')}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; line-height: 1.6; color: #1a1a1a; background: #f7f7f7; }
      article { max-width: 760px; margin: 0 auto; background: #fff; padding: 2rem; border-radius: 16px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12); }
      h1, h2, h3 { line-height: 1.25; }
      h2 { margin-top: 2.5rem; }
      header { margin-bottom: 2rem; }
      .meta { color: #475569; font-size: 0.9rem; margin-bottom: 1rem; }
      .cover img { width: 100%; height: auto; border-radius: 12px; }
      section { margin-bottom: 2rem; }
      ul { padding-left: 1.5rem; }
      table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; }
      thead { background: #f1f5f9; }
      pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; }
      .key-takeaway { background: #eef2ff; border-left: 4px solid #4338ca; padding: 1rem; border-radius: 8px; }
      .faq-item { margin-bottom: 1.5rem; }
      footer.cta { background: #1d4ed8; color: #fff; padding: 1.5rem; border-radius: 12px; text-align: center; font-weight: 600; }
      iframe { width: 100%; min-height: 320px; border: none; border-radius: 12px; }
    </style>
    ${schemaScripts}
  </head>
  <body>
    ${result.html}
  </body>
</html>`;
}

function extractHeadline(html: string): string | null {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (!match) return null;
  return match[1].replace(/<[^>]+>/g, '');
}

function jsonResponse(data: RenderResult): Response {
  return new Response(JSON.stringify(data), {
    headers: {'Content-Type': 'application/json; charset=UTF-8'},
  });
}

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return new Response(JSON.stringify({error: message}), {
    status: 422,
    headers: {'Content-Type': 'application/json; charset=UTF-8'},
  });
}

function escapeAttribute(input: string): string {
  return escapeHtml(input);
}
