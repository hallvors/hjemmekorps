export default {
  title: 'Opptak',
  name: 'recording',
  type: 'document',
  fields: [
    {
      title: 'Prosjekt',
      name: 'project',
      type: 'reference',
      to: [{ type: 'project' }],
    },
    {
      title: 'Musikant',
      name: 'member',
      type: 'reference',
      to: [{ type: 'member' }],
    },
    {
      title: 'Lydfil',
      name: 'file',
      type: 'file',
    },
    {
      title: 'Volum',
      name: 'volume',
      type: 'number',
      validation: Rule => Rule.min(0).max(100),
    },
  ],
  preview: {
    select: {
      title: 'project.name',
      subtitle: 'member.name',
    },
  },
};
