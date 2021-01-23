export default {
  title: "Korps",
  name: "band",
  type: "document",
  fields: [
    {
      title: "Navn",
      name: "name",
      type: "string",
    },
    {
      title: "Logo",
      name: "logo",
      type: "image",
    },
    {
      title: "Undergrupper",
      name: "groups",
      type: "array",
      of: [{type: "string"}]
    },
    {
      title: "Ansvarlig(e) person(er)",
      name: "owner",
      type: "array",
      of: [{ type: "reference", to: [{ type: "adminUser" }] }],
    },
  ],
};
