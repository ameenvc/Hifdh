import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, compareWords } from '../src/recitation.js';
test('Arabic normalization ignores vowel marks and alef variants', () => {
 assert.equal(normalize('بِسْمِ ٱللَّهِ'), normalize('بسم الله'));
});
test('matching recognized words turn correct and unspoken words stay pending', () => {
 assert.deepEqual(compareWords('الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'الحمد لله'), ['correct','correct','pending','pending']);
});
test('a substituted word is a possible mistake', () => {
 assert.deepEqual(compareWords('مَالِكِ يَوْمِ الدِّينِ', 'مالك نور الدين'), ['correct','mistake','correct']);
});
test('empty recognition does not flag a mistake', () => {
 assert.deepEqual(compareWords('الرَّحْمَٰنِ الرَّحِيمِ',''), ['pending','pending']);
});
