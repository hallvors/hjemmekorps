import settings from '../hjemmekorps-settings/instruments';

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
      description: "Norske mobilnumre støttes",
      name: "phone",
      type: "array",
      of: [{type: "string"}]
    },
    {
      title: "E-post",
      name: "email",
      type: "array",
      of: [{type: "email"}]
    },
    {
      title: "Portrett",
      name: "portrait",
      type: "image",
    },
    {
      title: "Instrument",
      name: "instrument",
      type: "string",
      options: {
        list: settings.instruments,
      },
    },
    {
      title: "Korps",
      name: "band",
      type: "reference",
      to: [{ type: "band" }],
    },
  ],
};
