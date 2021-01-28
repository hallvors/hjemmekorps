export default {
  title: "Admin",
  name: "adminUser",
  type: "document",
  fields: [
    {
      title: "Navn",
      name: "name",
      type: "string",
    },
    {
      title: "Vennenavn",
      name: "friendly_name",
      type: "string",
      desc: "Hva elever og kjente kaller deg",
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
      title: "Aktiv",
      description: "Skru av tilgang til systemet ved å skru av denne",
      name: "enabled",
      type: "boolean",
    },
  ],
  initialValue: {
    enabled: true
  },
};
