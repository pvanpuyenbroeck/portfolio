import {defineArrayMember, defineType} from 'sanity';

export default defineType({
  name: 'tldrBlock',
  title: 'TL;DR Block',
  type: 'object',
  fields: [
    {
      name: 'bullets',
      title: 'Bullets',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (Rule) => Rule.required().min(1).error('Provide at least one bullet point.'),
    },
  ],
});
