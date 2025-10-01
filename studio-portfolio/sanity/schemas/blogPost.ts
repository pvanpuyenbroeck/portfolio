import {defineArrayMember, defineField, defineType} from 'sanity';

export default defineType({
  name: 'blogPost',
  title: 'AI Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().min(50).max(160),
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'width',
          title: 'Width (px)',
          type: 'number',
        }),
        defineField({
          name: 'height',
          title: 'Height (px)',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading Time (minutes)',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(60),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tldr',
      title: 'TL;DR',
      type: 'array',
      of: [defineArrayMember({type: 'tldrBlock'})],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        defineArrayMember({type: 'contentSection'}),
        defineArrayMember({type: 'faqSection'}),
        defineArrayMember({type: 'videoBlock'}),
        defineArrayMember({type: 'comparisonTable'}),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'cta',
      title: 'Call To Action',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'author',
      published: 'publishedAt',
    },
    prepare({title, subtitle, published}) {
      return {
        title,
        subtitle: subtitle ? `${subtitle} • ${published ? new Date(published).toLocaleDateString() : ''}` : undefined,
      };
    },
  },
});
