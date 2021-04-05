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
      title: 'Instrument',
      name: 'instrument',
      type: 'string',
    },
    {
      title: 'Lydfil',
      name: 'file',
      type: 'file',
    },
    {
      title: 'Tidsdata',
      name: 'meta',
      type: 'array',
      of: [
        {
          type: "object", fields: [
            {
              title: "Hendelse",
              name: "event",
              type: "string"
            },
            {
              title: "Takt",
              name: "measure",
              type: "number"
            },
            {
              title: "Tid",
              name: "time",
              type: "number"
            }
        ]}
      ]
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
