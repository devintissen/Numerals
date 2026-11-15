const test = require('node:test');
const assert = require('node:assert/strict');

const { formatReleaseDate, formatCheckedAt, cleanVersion, describeStatus } = require('../about.js');

const NOW = new Date(2026, 10, 15, 12, 0);

test('formats the release date, adding the year only for past years', () => {
  assert.equal(formatReleaseDate(new Date(2026, 10, 12), NOW), 'Nov 12');
  assert.equal(formatReleaseDate(new Date(2025, 0, 3), NOW), 'Jan 3, 2025');
  assert.equal(formatReleaseDate(new Date('not a date'), NOW), '');
  assert.equal(formatReleaseDate(null, NOW), '');
});

test('formats when updates were last checked', () => {
  assert.equal(formatCheckedAt(new Date(NOW - 20 * 1000), NOW), 'just now');
  assert.equal(formatCheckedAt(new Date(NOW - 5 * 60000), NOW), '5 min ago');
  assert.equal(formatCheckedAt(new Date(2026, 10, 15, 8, 0), NOW), 'today');
  assert.equal(formatCheckedAt(new Date(2026, 10, 12, 8, 0), NOW), 'Nov 12');
});

test('only shows well-formed version numbers', () => {
  assert.equal(cleanVersion('1.2.0'), '1.2.0');
  assert.equal(cleanVersion('1.2.0-beta.1'), '1.2.0-beta.1');
  assert.equal(cleanVersion('<img src=x>'), '');
  assert.equal(cleanVersion(12), '');
});

test('describes every update state', () => {
  assert.deepEqual(describeStatus('idle'), { text: 'Check for updates', action: 'check' });
  assert.equal(describeStatus('checking').text, 'Checking for updates…');
  assert.equal(describeStatus('up-to-date', { checkedAt: new Date() }).text, 'Up to date · checked just now');
  assert.equal(describeStatus('downloading', { version: '1.2.0' }).text, 'Downloading 1.2.0…');
  assert.equal(describeStatus('ready', { version: '1.2.0' }).action, 'restart');
  assert.equal(describeStatus('ready', { version: 'bad<' }).text, 'Restart to update');
  assert.equal(describeStatus('error').linkText, 'Try again');
  assert.equal(describeStatus('store').action, 'store');
  assert.equal(describeStatus('anything else'), null);
});
