import settings from '../hjemmekorps-settings/instruments';

export default {
  title: 'Musikant',
  name: 'member',
  type: 'document',
  fields: [
    {
      title: 'Navn',
      name: 'name',
      type: 'string',
    },
    {
      title: 'Etternavn',
      name: 'surname',
      type: 'string',
    },
    {
      title: 'Telefon',
      description: 'Norske mobilnumre støttes',
      name: 'phone',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      title: 'E-post',
      name: 'email',
      type: 'array',
      of: [{ type: 'email' }],
    },
    {
      title: 'Portrett',
      name: 'portrait',
      type: 'image',
    },
    {
      title: 'Instrument',
      name: 'instrument',
      type: 'string',
      options: {
        list: settings.instruments,
      },
    },
    {
      title: 'Korps',
      name: 'band',
      type: 'reference',
      to: [{ type: 'band' }],
    },
    {
      title: 'Undergruppe',
      name: 'subgroup',
      type: 'string',
    },
    {
      title: 'Aktiv',
      description:
        'Musikanter som permitteres eller slutter kan de-aktiveres her',
      name: 'visible',
      type: 'boolean',
    },
  ],
  initialValue: {
    visible: true,
  },
  preview: {
    select: {
      name: 'name',
      surname: 'surname',
      subtitle: 'band.name',
      group: 'subgroup',
      visible: 'visible',
    },
    prepare: values => ({
      title:
        [values.name, values.surname].filter(Boolean).join(' ') +
        (values.visible ? '' : ' [inaktiv]'),
      subtitle: [values.subtitle, values.group].filter(Boolean).join(', '),
    }),
  },
};
