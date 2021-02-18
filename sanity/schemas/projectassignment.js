export default {
  title: 'Stemme-musikantkopling',
  name: 'projectassignment',
  type: 'object',

  fields: [
    { title: 'Stemme', name: 'part', type: 'string' },
    {
      title: 'Musikanter',
      name: 'members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'member' }] }],
    },
    {
      title: "Notefil",
      name: "sheetmusic",
      type: "file",
    },
  ],
};
