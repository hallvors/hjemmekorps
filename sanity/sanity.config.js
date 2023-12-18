// sanity.config.js
import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';

import schemas from './schemas/schema';

export default defineConfig({
  title: 'Hjemmekorps',
  projectId: '5ggq2na3',
  dataset: process.env['SANITY_DATASET'] || 'production',
  plugins: [deskTool(), visionTool()],
  schema: {
    types: schemas,
  },
});
