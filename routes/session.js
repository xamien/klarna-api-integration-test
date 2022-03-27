const { Router } = require('express');

const router = Router();

const KlarnaService = require('../services/KlarnaService');

const klarnaService = new KlarnaService().getInstance();

/* Session detail */
router.get('/:id', async (req, res) => {
  const sessionResponse = await klarnaService.getSessionDetail(req.params.id);
  res.render('session-detail', {
    title: 'Session Detail',
    sessionId: req.params.id,
    session: JSON.stringify(sessionResponse.data, undefined, 2)
  });
});

/* Create new session */
router.post('/new', async (req, res) => {
  const response = await klarnaService.createSession({
    locale: 'en-US',
    purchase_country: 'US',
    purchase_currency: 'USD',
    merchant_reference1: 'Klarna_customerorderID',
    order_amount: 18000,
    order_tax_amount: 2000,
    order_lines: [
      {
        reference: 'KLN-100',
        quantity: 1,
        unit_price: 8000,
        image_url: 'https://www.klarna.com/example/image/prod.jpg',
        total_amount: 8000,
        type: 'physical',
        product_url: 'https://www.klarna.com/example/widget1=prod',
        name: 'Klarna Widget 1'
      },
      {
        reference: 'KLN-101',
        quantity: 1,
        unit_price: 8000,
        image_url: 'https://www.klarna.com/example/image/prod.jpg',
        total_amount: 8000,
        type: 'physical',
        product_url: 'https://www.klarna.com/example/widget2=prod',
        name: 'Klarna Widget 2'
      },
      {
        quantity: 1,
        total_amount: 2000,
        type: 'sales_tax',
        name: 'Tax',
        unit_price: 2000
      }
    ]
  });

  if (response) {
    res.redirect('/');
    return;
  }

  res.redirect('/', 500);
});

/* Payment page */
router.get('/:id/payment', async (req, res) => {
  const sessionResponse = await klarnaService.getSessionDetail(req.params.id);
  res.render('session-payment', {
    title: 'Init Payment',
    sessionId: req.params.id,
    session: {
      clientToken: sessionResponse.data.client_token
    }
  });
});

module.exports = router;
