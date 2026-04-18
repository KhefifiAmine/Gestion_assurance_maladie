const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiary.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const upload = require('../middleware/upload.middleware');

router.use(verifyToken);

router.get('/my', beneficiaryController.getMyBeneficiaries);
router.post('/', upload.single('document'), beneficiaryController.addBeneficiary);
router.put('/:id', upload.single('document'), beneficiaryController.updateBeneficiary);
router.delete('/:id', beneficiaryController.deleteBeneficiary);

// Routes pour RH (Gestion des bénéficiaires)
const { isRH } = require('../middleware/auth.middleware');
router.get('/all', isRH, beneficiaryController.getAllBeneficiaries);
router.put('/:id/status', isRH, beneficiaryController.updateStatus);

module.exports = router;
