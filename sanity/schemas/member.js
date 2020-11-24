export default {
  title: "Musikant",
  name: "member",
  type: "document",
  fields: [
    {
      title: "Navn",
      name: "name",
      type: "string",
    },
    {
      title: "Telefon",
      name: "phone",
      type: "string",
    },
    {
      title: "E-post",
      name: "email",
      type: "email",
    },
    {
      title: "Portrett",
      name: "portrait",
      type: "image",
    },
    {
      title: 'Korps',
      name: 'band',
      type: 'reference',
      to: [{type: 'band'}]
    }
  ],
};
