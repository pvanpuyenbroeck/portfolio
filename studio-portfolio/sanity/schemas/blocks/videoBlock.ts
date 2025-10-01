import {defineField, defineType} from 'sanity';

export default defineType({
  name: 'videoBlock',
  title: 'Video Block',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'thumbnailUrl',
      title: 'Thumbnail URL',
      type: 'url',
    }),
    defineField({
      name: 'uploadDate',
      title: 'Upload Date',
      type: 'datetime',
    }),
    defineField({
      name: 'duration',
      title: 'Duration (ISO 8601)',
      type: 'string',
      description: 'Duration in ISO 8601 format, e.g., PT2M30S.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'videoUrl',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Video Block',
        subtitle,
      };
    },
  },
});
