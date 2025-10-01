export default {
  name: 'casepost',
  title: 'Case Study Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'client',
      title: 'Klant',
      type: 'string',
    },
    {
      name: 'projectDate',
      title: 'Projectdatum',
      type: 'date',
    },
    {
      name: 'coverImage',
      title: 'Cover Afbeelding',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'thumbnail',
      title: 'Thumbail Afbeelding',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'thumbnailTitle',
      title: 'Thumbnail Titel',
      type: 'string',
    },
    {
      name: 'thumbnailDescription',
      title: 'Thumbnail Omschrijving',
      type: 'string',
    },
    {
      name: 'mobileImage',
      title: 'Mockup mobiele Afbeelding',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'intro',
      title: 'Korte Inleiding',
      type: 'text',
      description: 'Een korte samenvatting van de case study.',
    },
    {
      name: 'body',
      title: 'Inhoud',
      type: 'array',
      of: [{ type: 'block'}, {type:'image'}],
    },
    {
      name: 'gallery',
      title: 'Afbeeldingen Galerij',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },
    {
      name: 'website',
      title: 'Live Website URL',
      type: 'url',
    },
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'testimonial' }] }],
    },
  ],
};
