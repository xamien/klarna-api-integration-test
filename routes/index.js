const { Router } = require('express');

const router = Router();

const KlarnaService = require('../services/KlarnaService');

const klarnaService = new KlarnaService().getInstance();

/* GET index page. */
router.get('/', (req, res) => {
  const sessions = klarnaService.getSessions();
  const orders = klarnaService.getOrders();

  res.render('dashboard', {
    title: 'Dashboard',
    sessions,
    orders
  });
});

module.exports = router;
