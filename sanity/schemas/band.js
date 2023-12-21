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
      description: "Legg til navn på undergrupper i stigende rekkefølge, fra de yngste til de eldste. For eksempel: Aspirantkorps, Juniorkorps, Hovedkorps.",
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
