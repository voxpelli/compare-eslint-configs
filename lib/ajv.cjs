// Copied from https://raw.githubusercontent.com/eslint/eslint/main/lib/shared/ajv.js
// Copyright OpenJS Foundation and other contributors, <www.openjsf.org>
// MIT Licensed

'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const Ajv = require('ajv');
const metaSchema = require('ajv/lib/refs/json-schema-draft-04.json');

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

module.exports = (additionalOptions = {}) => {
  const ajv = new Ajv({
    meta: false,
    useDefaults: true,
    validateSchema: false,
    missingRefs: 'ignore',
    verbose: true,
    schemaId: 'auto',
    ...additionalOptions,
  });

  ajv.addMetaSchema(metaSchema);
  // @ts-ignore
  ajv._opts.defaultMeta = metaSchema.id;

  return ajv;
};
