import {test} from 'node:test';import assert from 'node:assert/strict';
import {restrictedMode} from '../src/privacy-mode.js';
test('only an explicit adult age band permits online features',()=>{
 for(const value of [null,undefined,'under13','teen','prefer-not','invalid'])assert.equal(restrictedMode(value),true);
 assert.equal(restrictedMode('adult'),false);
});
