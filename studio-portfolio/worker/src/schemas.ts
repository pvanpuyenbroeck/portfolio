import {BlogPostDocument, ComparisonTable, ContentSection, FAQSection, VideoBlock} from './portableText';

export type JsonLd = Record<string, unknown>;

function getImageUrl(image?: {url?: string; asset?: {url?: string}} | null): string | undefined {
  return image?.url || image?.asset?.url || undefined;
}

function collectSectionHeadings(sections: Array<ContentSection | FAQSection | VideoBlock | ComparisonTable>): string[] {
  const headings: string[] = [];
  sections.forEach((section) => {
    if ((section as ContentSection)._type === 'contentSection' && (section as ContentSection).heading) {
      headings.push((section as ContentSection).heading);
      return;
    }
    if ((section as FAQSection)._type === 'faqSection' && (section as FAQSection).title) {
      headings.push((section as FAQSection).title as string);
    }
    if ((section as VideoBlock)._type === 'videoBlock' && (section as VideoBlock).title) {
      headings.push((section as VideoBlock).title as string);
    }
    if ((section as ComparisonTable)._type === 'comparisonTable' && (section as ComparisonTable).title) {
      headings.push((section as ComparisonTable).title as string);
    }
  });
  return headings;
}

export function buildArticle(post: BlogPostDocument, sections: Array<ContentSection | FAQSection | VideoBlock | ComparisonTable>): JsonLd | null {
  if (!post.title) return null;
  const articleSections = collectSectionHeadings(sections);
  const coverImage = getImageUrl(post.coverImage);

  const base: JsonLd = {
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    author: post.author,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    keywords: post.keywords && post.keywords.length ? post.keywords.join(', ') : undefined,
    image: coverImage,
    articleSection: articleSections.length ? articleSections : undefined,
  };

  return clean(base);
}

export function buildFAQ(section: FAQSection): JsonLd | null {
  if (!section.items || !section.items.length) return null;
  return clean({
    '@type': 'FAQPage',
    mainEntity: section.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  });
}

interface VideoShape {
  videoUrl?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
}

export function buildVideo(source: VideoShape): JsonLd | null {
  if (!source.videoUrl) return null;
  return clean({
    '@type': 'VideoObject',
    name: source.title,
    description: source.description,
    thumbnailUrl: source.thumbnailUrl ? [source.thumbnailUrl] : undefined,
    uploadDate: source.uploadDate,
    duration: source.duration,
    contentUrl: source.videoUrl,
    embedUrl: source.videoUrl,
  });
}

export function buildHowTo(section: ContentSection): JsonLd | null {
  if (section.schemaType !== 'HowTo') return null;
  const steps = Array.isArray(section.bullets)
    ? section.bullets.map((bullet) => ({
        '@type': 'HowToStep',
        name: bullet,
        text: bullet,
      }))
    : undefined;

  const description = section.keyTakeaway || section.intro;

  return clean({
    '@type': 'HowTo',
    name: section.heading,
    description,
    step: steps,
  });
}

function rowToProduct(row: string[], columns: string[], table: ComparisonTable): JsonLd | null {
  if (!columns.length || !row.length) return null;
  const name = row[0] || table.title;
  if (!name) return null;

  const additionalProperty = columns.slice(1).map((column, index) => ({
    '@type': 'PropertyValue',
    name: column,
    value: row[index + 1],
  }));
  const filteredProperties = additionalProperty.filter((prop) => prop.value);

  return clean({
    '@type': 'Product',
    name,
    description: table.caption,
    additionalProperty: filteredProperties.length ? filteredProperties : undefined,
  });
}

export function buildProductsFromTable(table: ComparisonTable): JsonLd[] {
  if (!table.productMode || !table.columns || !table.rows) return [];
  return table.rows
    .filter((row): row is string[] => Array.isArray(row))
    .map((row) => rowToProduct(row, table.columns as string[], table))
    .filter((product): product is JsonLd => Boolean(product));
}

export function collectSchemas(post: BlogPostDocument): JsonLd[] {
  const schemas: JsonLd[] = [];
  const sections = post.sections || [];

  const article = buildArticle(post, sections);
  if (article) schemas.push(article);

  sections.forEach((section) => {
    switch (section._type) {
      case 'faqSection': {
        const faq = buildFAQ(section as FAQSection);
        if (faq) schemas.push(faq);
        break;
      }
      case 'videoBlock': {
        const video = buildVideo(section as VideoBlock);
        if (video) schemas.push(video);
        break;
      }
      case 'comparisonTable': {
        const products = buildProductsFromTable(section as ComparisonTable);
        schemas.push(...products);
        break;
      }
      case 'contentSection': {
        const contentSection = section as ContentSection;
        if (contentSection.schemaType === 'HowTo') {
          const howTo = buildHowTo(contentSection);
          if (howTo) schemas.push(howTo);
        }
        if (contentSection.schemaType === 'Product') {
          const tableSource = contentSection.table || contentSection.tableRef;
          if (tableSource) {
            schemas.push(...buildProductsFromTable(tableSource));
          }
        }
        if (contentSection.videoUrl) {
          const videoFromSection = buildVideo({
            videoUrl: contentSection.videoUrl,
            title: contentSection.heading,
            description: contentSection.intro || contentSection.keyTakeaway,
          });
          if (videoFromSection) schemas.push(videoFromSection);
        }
        break;
      }
      default:
        break;
    }
  });

  return schemas;
}

function clean(schema: JsonLd | null): JsonLd | null {
  if (!schema) return null;
  const result: JsonLd = {'@context': 'https://schema.org'};
  Object.entries(schema).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      const filtered = value.filter((item) => item !== undefined && item !== null && item !== '');
      if (filtered.length) result[key] = filtered;
      return;
    }
    result[key] = value;
  });
  return result;
}
