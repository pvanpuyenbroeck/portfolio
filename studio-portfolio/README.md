# AI-Ready Blogpost Stack

This repository contains two deliverables:

- **Sanity schema bundle** under `sanity/schemas` for modelling AI-optimised blog posts with rich, structured blocks.
- **Cloudflare Worker** under `worker/` that renders Sanity documents to HTML and emits JSON-LD for search engines.

Both pieces are designed to be minimal, dependency-light, and ready for production usage in Webstudio or any other static host expecting pre-rendered HTML.

## Sanity schema bundle

1. Copy the `sanity/schemas` directory into your Sanity v3 studio (e.g. `./sanity/schemas`).
2. Update your studio config to import the exported `schemaTypes` array:

   ```ts
   // sanity.config.ts
   import schemaTypes from './sanity/schemas';

   export default defineConfig({
     // ...
     schema: {
       types: schemaTypes,
     },
   });
   ```

3. The main document type is `blogPost`. It references reusable blocks for TL;DR summaries, content sections, FAQs, videos, and comparison tables. Fields are localisation-friendly and ship with validation where appropriate.

## Cloudflare Worker

The worker serialises structured Sanity payloads into HTML and JSON-LD. Endpoints:

- `POST /render` → returns `{ html, schemas }`.
- `POST /preview` → returns a fully styled HTML preview containing the rendered article and JSON-LD `<script>` tags.

### Setup

```bash
cd worker
npm install
npm run dev
```

This starts `wrangler dev` on http://localhost:8787. The worker is ESM, uses the default Cloudflare bundler, and ships with strict TypeScript settings (`worker/tsconfig.json`).

### Expected payload shape

The worker expects the same JSON shape you would get from a GROQ query (with image URLs resolved). Minimal required fields: `title`, `metaDescription`, `author`, `publishedAt`, and at least one section.

Below is a trimmed sample payload you can store as `sample.json` for local testing:

```json
{
  "_type": "blogPost",
  "title": "Build AI-Ready Blogposts",
  "metaDescription": "Learn how to model and render AI-optimised blogposts with Sanity and Cloudflare Workers.",
  "keywords": ["AI", "Sanity", "Cloudflare"],
  "author": "Studio Team",
  "coverImage": {
    "url": "https://cdn.sanity.io/images/demo/cover.jpg",
    "alt": "Illustration of AI workflows",
    "width": 1200,
    "height": 675
  },
  "readingTime": 6,
  "publishedAt": "2024-05-01T09:00:00.000Z",
  "updatedAt": "2024-05-02T12:00:00.000Z",
  "tldr": [
    {
      "bullets": [
        "Structure content for AI consumption",
        "Generate SEO-friendly JSON-LD automatically",
        "Render HTML in a serverless-friendly worker"
      ]
    }
  ],
  "sections": [
    {
      "_type": "contentSection",
      "heading": "Why Structure Matters",
      "intro": "AI models respond better to structured, concise sections that are easy to parse.",
      "body": [
        {
          "_type": "block",
          "style": "normal",
          "children": [
            {
              "_type": "span",
              "text": "Structured writing helps search engines and AI summarizers extract accurate facts."
            }
          ],
          "markDefs": []
        },
        {
          "_type": "block",
          "style": "h3",
          "children": [
            {
              "_type": "span",
              "text": "Helper utilities"
            }
          ],
          "markDefs": []
        },
        {
          "_type": "block",
          "style": "normal",
          "children": [
            {
              "_type": "span",
              "text": "Portable Text lets writers stay flexible while guaranteeing proper HTML output."
            }
          ],
          "markDefs": []
        }
      ],
      "bullets": [
        "Short paragraphs (2-4 lines)",
        "Reusable blocks for FAQs and comparisons",
        "Automatic schema generation"
      ],
      "keyTakeaway": "Treat each section as a self-contained module with clear, scannable data.",
      "schemaType": "ArticleSection"
    },
    {
      "_type": "faqSection",
      "title": "Implementation FAQs",
      "items": [
        {
          "question": "Can I localise content later?",
          "answer": "Yes. The schema uses plain strings today but can be wrapped in locale objects when needed."
        },
        {
          "question": "Do I need external dependencies?",
          "answer": "No. The worker avoids heavy packages and only relies on built-in platform features."
        }
      ]
    },
    {
      "_type": "videoBlock",
      "title": "Walkthrough",
      "description": "A 3-minute overview of the rendering pipeline.",
      "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "thumbnailUrl": "https://cdn.sanity.io/images/demo/video-thumb.jpg",
      "uploadDate": "2024-04-30T12:00:00.000Z",
      "duration": "PT3M"
    },
    {
      "_type": "comparisonTable",
      "title": "Renderer Comparison",
      "productMode": true,
      "columns": ["Product", "HTML Output", "Schema Support"],
      "rows": [
        ["Cloudflare Worker", "Serverless HTML", "Article, FAQ, Video"],
        ["Static build", "Bundled HTML", "Depends on tooling"]
      ]
    }
  ],
  "cta": "Need help shipping AI-ready content? Contact our studio team to get started."
}
```

### Example requests

Render raw HTML + JSON-LD payload:

```bash
curl -s \
  -X POST http://localhost:8787/render \
  -H "Content-Type: application/json" \
  --data @sample.json | jq
```

Render full preview page in your browser:

```bash
curl -s \
  -X POST http://localhost:8787/preview \
  -H "Content-Type: application/json" \
  --data @sample.json \
  > preview.html && open preview.html
```

## Implementation notes

- Portable Text is rendered without external libraries and supports headings, paragraphs, code blocks, and ordered/bullet lists.
- Long free-text fields (intros, key takeaways, CTA) are normalised into short paragraphs via `normalizeParagraphs`.
- Images include `loading="lazy"` and width/height metadata when available.
- Structured data builders cover `Article`, `FAQPage`, `VideoObject`, `HowTo`, and `Product` variants, driven by block-level flags.
- The worker validates required fields and responds with `422` + JSON error messages if the payload is incomplete.

## Next steps

- Extend `contentSection.schemaType` with additional schema types if you introduce new structured layouts.
- Adjust the preview stylesheet in `worker/src/index.ts` to mirror your production brand.
- Update GROQ queries to dereference images and comparison tables (`...tableRef->`) before sending payloads to the worker.
