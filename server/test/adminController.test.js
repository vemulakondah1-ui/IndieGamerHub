'use strict';

// Only tests the self-action guards added this session (adminUpdateUserRole /
// adminToggleUserStatus reject an admin acting on their own account). Both
// guards throw before any DB call, so no live Mongo connection is needed here.

const test = require('node:test');
const assert = require('node:assert/strict');
const { adminUpdateUserRole, adminToggleUserStatus } = require('../controllers/adminController');

function makeReq({ selfId, targetId, body = {} }) {
  return { user: { _id: selfId }, params: { id: targetId }, body };
}

test('adminUpdateUserRole: rejects an admin changing their own role', async () => {
  const req = makeReq({ selfId: 'admin-1', targetId: 'admin-1', body: { role: 'gamer' } });
  await assert.rejects(
    () => adminUpdateUserRole(req, {}),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, 'You cannot change your own role');
      return true;
    }
  );
});

test('adminToggleUserStatus: rejects an admin deactivating their own account', async () => {
  const req = makeReq({ selfId: 'admin-1', targetId: 'admin-1' });
  await assert.rejects(
    () => adminToggleUserStatus(req, {}),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.message, 'You cannot deactivate your own account');
      return true;
    }
  );
});
