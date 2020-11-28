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
      title: "Musikanter",
      name: "members",
      type: "array",
      of: [{ type: "reference", to: [{ type: "member" }] }],
    },
  ],
};