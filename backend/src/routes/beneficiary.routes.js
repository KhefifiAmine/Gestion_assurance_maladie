const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiary.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const upload = require('../middleware/upload.middleware');

router.use(verifyToken);

router.get('/my', beneficiaryController.getMyBeneficiaries);
router.post('/', upload.array('document', 5), beneficiaryController.addBeneficiary);
router.put('/:id', upload.array('document', 5), beneficiaryController.updateBeneficiary);
router.delete('/:id', beneficiaryController.deleteBeneficiary);

// Routes pour RH (Gestion des bénéficiaires)
const { isRH } = require('../middleware/auth.middleware');
router.get('/all', isRH, beneficiaryController.getAllBeneficiaries);
router.put('/:id/status', isRH, beneficiaryController.updateStatus);

module.exports = router;
