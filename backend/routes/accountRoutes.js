const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    getAccountSummary,
    getAccountSessions,
    revokeOtherSessions,
    deleteAccount
} = require('../controllers/accountController');

router.use(authMiddleware);

router.get('/summary', getAccountSummary);
router.get('/sessions', getAccountSessions);
router.post('/sessions/revoke-others', revokeOtherSessions);
router.post('/delete', deleteAccount);

module.exports = router;
