import {defineArrayMember, defineField, defineType} from 'sanity';

export default defineType({
  name: 'contentSection',
  title: 'Content Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
    defineField({
      name: 'bullets',
      title: 'Bullets',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'tableRef',
      title: 'Table Reference',
      type: 'reference',
      to: [{type: 'comparisonTable'}],
    }),
    defineField({
      name: 'table',
      title: 'Inline Table',
      type: 'object',
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
        }),
        defineField({
          name: 'productMode',
          title: 'Product Mode',
          type: 'boolean',
          description: 'When enabled, rows are treated as individual products for structured data.',
        }),
        defineField({
          name: 'columns',
          title: 'Columns',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
          validation: (Rule) => Rule.min(1),
        }),
        defineField({
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'row',
              title: 'Row',
              type: 'array',
              of: [defineArrayMember({type: 'string'})],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule) => Rule.required().error('Alt text improves accessibility and SEO.'),
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
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
    }),
    defineField({
      name: 'keyTakeaway',
      title: 'Key Takeaway',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'schemaType',
      title: 'Schema Type',
      type: 'string',
      initialValue: 'None',
      options: {
        layout: 'radio',
        list: [
          {title: 'None', value: 'None'},
          {title: 'How To', value: 'HowTo'},
          {title: 'Product', value: 'Product'},
          {title: 'Article Section', value: 'ArticleSection'},
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      subtitle: 'schemaType',
    },
    prepare(selection) {
      const {title, subtitle} = selection;
      return {
        title: title || 'Untitled section',
        subtitle: subtitle && subtitle !== 'None' ? `Schema: ${subtitle}` : undefined,
      };
    },
  },
});
