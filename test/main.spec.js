import chai from 'chai';

import { something } from '../index.js';

chai.should();

describe('something', () => {
  it('should work', async () => {
    await something();
  });
});
