import {defineArrayMember, defineField, defineType} from 'sanity';

export default defineType({
  name: 'comparisonTable',
  title: 'Comparison Table',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'productMode',
      title: 'Product Mode',
      type: 'boolean',
      description: 'When enabled, each row can be emitted as a Product schema.',
      initialValue: false,
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (Rule) => Rule.required().min(2).error('Add at least two columns.'),
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'array',
          name: 'row',
          title: 'Row',
          of: [defineArrayMember({type: 'string'})],
        }),
      ],
      validation: (Rule) =>
        Rule.custom((rows, context) => {
          if (!Array.isArray(rows)) return true;
          const columns = (context.parent as {columns?: string[]})?.columns || [];
          if (!columns.length) return 'Add columns before defining rows.';
          const mismatched = rows.some((row) => Array.isArray(row) && row.length !== columns.length);
          return mismatched ? 'Each row must have the same number of cells as the defined columns.' : true;
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      rows: 'rows.length',
    },
    prepare({title, rows}) {
      return {
        title: title || 'Comparison Table',
        subtitle: rows ? `${rows} row${rows === 1 ? '' : 's'}` : 'No rows yet',
      };
    },
  },
});
