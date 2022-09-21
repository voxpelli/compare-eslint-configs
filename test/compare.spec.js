import chai from 'chai';

import { compareConfigs } from '../lib/compare.js';

chai.should();

describe('compare', () => {
  it('should work', async () => {
    // TODO: Make it sensible
    const differences = await compareConfigs({});

    differences.should.deep.equal({
      'mixedConfigs': {},
      'mixedSeverity': {},
      'onlyActiveIn': {},
    });
  });
});
