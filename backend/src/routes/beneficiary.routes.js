const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiary.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/my', beneficiaryController.getMyBeneficiaries);
router.post('/', beneficiaryController.addBeneficiary);
router.delete('/:id', beneficiaryController.deleteBeneficiary);

module.exports = router;
