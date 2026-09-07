'use strict';

// The self-action guard (admin can't act on their own account via a :id-keyed
// route) used to be copy-pasted into adminUpdateUserRole and
// adminToggleUserStatus individually. It's now shared middleware
// (blockSelfAction) wired into both routes in routes/admin.js, so testing it
// once here covers every route that uses it, current and future.

const test = require('node:test');
const assert = require('node:assert/strict');
const blockSelfAction = require('../middleware/blockSelfAction');

function makeReq({ selfId, targetId }) {
  return { user: { _id: selfId }, params: { id: targetId } };
}

test('blockSelfAction: rejects when the acting admin targets their own id', () => {
  const guard = blockSelfAction('You cannot change your own role');
  const req = makeReq({ selfId: 'admin-1', targetId: 'admin-1' });
  assert.throws(
    () => guard(req, {}, () => {}),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, 'You cannot change your own role');
      return true;
    }
  );
});

test('blockSelfAction: calls next() and does not throw when targeting a different id', () => {
  const guard = blockSelfAction('You cannot deactivate your own account');
  const req = makeReq({ selfId: 'admin-1', targetId: 'user-2' });
  let nextCalled = false;
  assert.doesNotThrow(() => guard(req, {}, () => { nextCalled = true; }));
  assert.equal(nextCalled, true);
});
