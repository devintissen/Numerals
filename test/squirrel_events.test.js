const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const { squirrelUpdateArgs, handleSquirrelEvent } = require('../squirrel_events.js');

const EXE = 'C:\\Users\\me\\AppData\\Local\\Numerals\\app-1.1.1\\Numerals.exe';
const UPDATE_EXE = 'C:\\Users\\me\\AppData\\Local\\Numerals\\Update.exe';

function fakeSpawn() {
  const calls = [];
  const spawn = (file, args, options) => {
    calls.push({ file, args, options });
    return new EventEmitter();
  };
  return { spawn, calls };
}

test('maps each Squirrel event to the same Update.exe arguments as before', () => {
  assert.deepEqual(squirrelUpdateArgs('--squirrel-install', EXE), ['--createShortcut=Numerals.exe']);
  assert.deepEqual(squirrelUpdateArgs('--squirrel-updated', EXE), ['--createShortcut=Numerals.exe']);
  assert.deepEqual(squirrelUpdateArgs('--squirrel-uninstall', EXE), ['--removeShortcut=Numerals.exe']);
  assert.deepEqual(squirrelUpdateArgs('--squirrel-obsolete', EXE), []);
  assert.equal(squirrelUpdateArgs(undefined, EXE), null);
  assert.equal(squirrelUpdateArgs('--squirrel-something-else', EXE), null);
});

test('install runs Update.exe from the folder above the app and quits', () => {
  const { spawn, calls } = fakeSpawn();
  const quit = handleSquirrelEvent({ platform: 'win32', argv: [EXE, '--squirrel-install'], execPath: EXE, spawn });
  assert.equal(quit, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].file, UPDATE_EXE);
  assert.deepEqual(calls[0].args, ['--createShortcut=Numerals.exe']);
  assert.equal(calls[0].options.detached, true);
});

test('obsolete quits without running Update.exe', () => {
  const { spawn, calls } = fakeSpawn();
  assert.equal(handleSquirrelEvent({ platform: 'win32', argv: [EXE, '--squirrel-obsolete'], execPath: EXE, spawn }), true);
  assert.equal(calls.length, 0);
});

test('normal launches and other platforms are left alone', () => {
  const { spawn, calls } = fakeSpawn();
  assert.equal(handleSquirrelEvent({ platform: 'win32', argv: [EXE], execPath: EXE, spawn }), false);
  assert.equal(handleSquirrelEvent({ platform: 'darwin', argv: ['Numerals', '--squirrel-install'], execPath: '/Applications/Numerals.app/Contents/MacOS/Numerals', spawn }), false);
  assert.equal(calls.length, 0);
});

test('a missing Update.exe does not crash the app', () => {
  const child = new EventEmitter();
  handleSquirrelEvent({ platform: 'win32', argv: [EXE, '--squirrel-uninstall'], execPath: EXE, spawn: () => child });
  assert.doesNotThrow(() => child.emit('error', new Error('ENOENT')));
});
