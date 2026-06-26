const express = require('express');
const {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  getSalesStats,
} = require('../controllers/saleController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All routes here are admin-only
router.use(protect);
router.use(admin);

router.post('/', createSale);
router.get('/', getSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSaleById);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

module.exports = router;
