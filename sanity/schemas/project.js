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
      title: "Korps",
      name: "band",
      type: "reference",
      to: [{ type: "band" }],
    },
    {
      title: "Navn",
      name: "name",
      type: "string",
    },
    {
      title: "Tempo",
      name: "bpm",
      type: "number",
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
