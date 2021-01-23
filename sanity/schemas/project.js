export default {
  title: "Prosjekt",
  name: "project",
  type: "document",
  fields: [
    {
      title: "Eier",
      name: "owner",
      type: "reference",
      to: [{ type: "adminUser" }],
    },
    {
      title: "Navn",
      name: "name",
      type: "string",
    },
    {
      title: "Notefil",
      name: "sheetmusic",
      type: "file",
    },
    {
      title: "Stemmer",
      name: "partslist",
      type: "array",
      of: [{type: "projectassignment"}]
    },
    {
      title: "Generert lydfil",
      name: "generated_soundfile",
      type: "file",
    },

  ],
};
