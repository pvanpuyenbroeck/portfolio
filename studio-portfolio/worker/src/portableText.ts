/* eslint-disable @typescript-eslint/no-use-before-define */
export interface PortableTextMarkDef {
  _key: string;
  _type: string;
  href?: string;
  openInNewTab?: boolean;
  [key: string]: unknown;
}

export interface PortableTextSpan {
  _key?: string;
  _type?: string;
  marks?: string[];
  text?: string;
}

export interface PortableTextBlock {
  _key?: string;
  _type: 'block' | 'code' | string;
  style?: 'normal' | 'h3' | 'h4' | 'h5' | 'h6' | string;
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDef[];
  listItem?: 'bullet' | 'number';
  level?: number;
  code?: string;
  language?: string;
}

export interface ImageAsset {
  url?: string;
}

export interface ImageWithMeta {
  alt?: string;
  asset?: ImageAsset;
  url?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export interface ComparisonTable {
  _type?: 'comparisonTable';
  title?: string;
  caption?: string;
  productMode?: boolean;
  columns?: string[];
  rows?: (string[] | null | undefined)[];
}

export interface InlineTable extends ComparisonTable {}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  _type: 'faqSection';
  title?: string;
  items?: FAQItem[];
}

export interface VideoBlock {
  _type: 'videoBlock';
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
}

export interface TLDRBlock {
  bullets: string[];
}

export interface ContentSection {
  _type: 'contentSection';
  heading: string;
  intro?: string;
  body?: PortableTextBlock[];
  bullets?: string[];
  table?: InlineTable | null;
  tableRef?: ComparisonTable | null;
  image?: ImageWithMeta | null;
  videoUrl?: string;
  keyTakeaway?: string;
  schemaType?: 'None' | 'HowTo' | 'Product' | 'ArticleSection';
}

export interface BlogPostDocument {
  _type: 'blogPost';
  title: string;
  metaDescription?: string;
  keywords?: string[];
  author?: string;
  coverImage?: ImageWithMeta | null;
  readingTime?: number;
  publishedAt?: string;
  updatedAt?: string;
  tldr?: TLDRBlock[];
  sections?: Array<ContentSection | FAQSection | VideoBlock | ComparisonTable>;
  cta?: string;
}

export type PortableTextValue = PortableTextBlock[] | undefined | null;

const SENTENCE_SPLIT_REGEX = /(?<=[.!?])\s+(?=[A-Z0-9"'\(]|$)/g;
const MAX_PARAGRAPH_LENGTH = 420;

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeParagraphs(raw?: string | null): string {
  if (!raw) return '';
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const sentences = cleaned.split(SENTENCE_SPLIT_REGEX).filter(Boolean);
  if (!sentences.length) {
    return `<p>${escapeHtml(cleaned)}</p>`;
  }
  const paragraphs: string[] = [];
  let buffer = '';
  sentences.forEach((sentence) => {
    const next = buffer ? `${buffer} ${sentence}`.trim() : sentence.trim();
    if (next.length > MAX_PARAGRAPH_LENGTH && buffer) {
      paragraphs.push(buffer.trim());
      buffer = sentence.trim();
    } else {
      buffer = next;
    }
  });
  if (buffer) {
    paragraphs.push(buffer.trim());
  }
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
}

function renderSpan(span: PortableTextSpan, markDefs: PortableTextMarkDef[]): string {
  const text = escapeHtml(span.text || '');
  const marks = span.marks || [];
  if (!marks.length) return text;
  return marks.reduce((acc, mark) => {
    const def = markDefs.find((candidate) => candidate._key === mark);
    if (def?.href) {
      const safeHref = escapeAttribute(def.href);
      return `<a href="${safeHref}"${def.openInNewTab ? ' target="_blank" rel="noopener"' : ''}>${acc}</a>`;
    }
    if (mark === 'strong') return `<strong>${acc}</strong>`;
    if (mark === 'em') return `<em>${acc}</em>`;
    return acc;
  }, text);
}

function escapeAttribute(input?: string): string {
  return input ? input.replace(/"/g, '&quot;') : '';
}

export function renderPortableText(blocks: PortableTextValue): string {
  if (!blocks || !Array.isArray(blocks) || !blocks.length) return '';
  const html: string[] = [];
  const listStack: {type: 'bullet' | 'number'; level: number}[] = [];

  const closeLists = (targetLevel: number) => {
    while (listStack.length > targetLevel) {
      const last = listStack.pop();
      if (last) {
        html.push(last.type === 'number' ? '</ol>' : '</ul>');
      }
    }
  };

  blocks.forEach((block) => {
    if (block._type === 'code') {
      closeLists(0);
      const codeContent = escapeHtml(block.code || '');
      html.push(`<pre><code>${codeContent}</code></pre>`);
      return;
    }

    if (block._type !== 'block' || !block.children) return;

    const markDefs = block.markDefs || [];
    const content = block.children.map((span) => renderSpan(span, markDefs)).join('');

    if (block.listItem) {
      const listType = block.listItem;
      const level = block.level ?? 1;
      const stackTop = listStack[listStack.length - 1];

      if (!stackTop || stackTop.level < level || stackTop.type !== listType) {
        // Open new list levels as needed
        for (let currentLevel = stackTop ? stackTop.level : 0; currentLevel < level; currentLevel += 1) {
          listStack.push({type: listType, level: currentLevel + 1});
          html.push(listType === 'number' ? '<ol>' : '<ul>');
        }
      } else if (stackTop.level > level) {
        closeLists(level);
        const newTop = listStack[listStack.length - 1];
        if (!newTop || newTop.type !== listType) {
          listStack.push({type: listType, level});
          html.push(listType === 'number' ? '<ol>' : '<ul>');
        }
      }

      html.push(`<li>${content}</li>`);
      return;
    }

    closeLists(0);

    const style = block.style || 'normal';
    if (style === 'normal') {
      html.push(`<p>${content}</p>`);
    } else if (/^h[3-6]$/.test(style)) {
      html.push(`<${style}>${content}</${style}>`);
    } else {
      html.push(`<p>${content}</p>`);
    }
  });

  closeLists(0);
  return html.join('');
}

function renderImage(image?: ImageWithMeta | null): string {
  if (!image) return '';
  const url = image.url || image.asset?.url;
  if (!url) return '';
  const alt = escapeAttribute(image.alt || '');
  const width = image.width ? ` width="${image.width}"` : '';
  const height = image.height ? ` height="${image.height}"` : '';
  return `<figure><img src="${escapeAttribute(url)}" alt="${alt}" loading="lazy"${width}${height} /></figure>`;
}

function renderVideoEmbed(url?: string, title?: string): string {
  if (!url) return '';
  const safeUrl = escapeAttribute(url);
  if (/youtube|youtu\.be|vimeo/.test(url)) {
    return `
      <div class="video-embed">
        <iframe src="${safeUrl}" title="${escapeAttribute(title || 'Embedded video')}" allowfullscreen loading="lazy"></iframe>
      </div>
    `.trim();
  }
  return `<div class="video-link"><a href="${safeUrl}" target="_blank" rel="noopener">Watch video</a></div>`;
}

export function renderTable(table?: ComparisonTable | null): string {
  if (!table || !table.columns || !table.columns.length || !table.rows) return '';
  const headerCells = table.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join('');
  const bodyRows = table.rows
    .filter((row): row is string[] => Array.isArray(row))
    .map((row) => {
      const cells = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
    <figure class="comparison-table">
      ${table.title ? `<figcaption>${escapeHtml(table.title)}</figcaption>` : ''}
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </figure>
  `.trim();
}

export function renderSection(section: ContentSection): string {
  const heading = escapeHtml(section.heading);
  const intro = normalizeParagraphs(section.intro);
  const body = renderPortableText(section.body);
  const bullets = Array.isArray(section.bullets)
    ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '';

  const table = section.table ? renderTable(section.table) : section.tableRef ? renderTable(section.tableRef) : '';
  const image = renderImage(section.image);
  const video = renderVideoEmbed(section.videoUrl, section.heading);
  const takeaway = section.keyTakeaway
    ? `<aside class="key-takeaway" aria-label="Key takeaway">${normalizeParagraphs(section.keyTakeaway)}</aside>`
    : '';

  return `
    <section>
      <h2>${heading}</h2>
      ${intro}
      ${body}
      ${bullets}
      ${table}
      ${image}
      ${video}
      ${takeaway}
    </section>
  `.replace(/\s+$/gm, '').trim();
}
