const express = require('express');
const router = express.Router();
const traceabilityController = require('./controller/traceability.controller');

// GET /api/public/trace/:batch_id - Public / Konsumen tanpa autentikasi
router.get('/trace/:batch_id', traceabilityController.traceBatch);

module.exports = router;
