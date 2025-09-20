export default {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {
      name: 'quote',
      title: 'Quote',
      type: 'text',
      validation: Rule => Rule.required(),
    },
    {
      name: 'author',
      title: 'Naam Auteur',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'position',
      title: 'Positie',
      type: 'string',
    },
    {
      name: 'photo',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
    },
  ],
};
