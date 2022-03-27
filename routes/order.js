const { Router } = require('express');

const router = Router();

const KlarnaService = require('../services/KlarnaService');

const klarnaService = new KlarnaService().getInstance();

/* Order detail */
router.get('/:id', async (req, res) => {
  const orderResponse = await klarnaService.getOrderDetail(req.params.id);
  const orderData = orderResponse.data;
  res.render('order-detail', {
    title: 'Order Detail',
    orderId: req.params.id,
    order: JSON.stringify(orderResponse.data, undefined, 2),
    canCapture: (orderData.order_amount > orderData.captured_amount && orderData.status !== 'CANCELLED'),
    canCancel: (orderData.captured_amount === 0 && orderData.status !== 'CANCELLED'),
    canRefund: (orderData.captured_amount > orderData.refunded_amount && orderData.status !== 'CANCELLED')
  });
});

/* Create new Order */
router.post('/new', async (req, res) => {
  if (!req.body.sessionId || !req.body.authorizationToken) {
    res.redirect('/');
    return;
  }

  const { sessionId } = req.body;
  const sessionResponse = await klarnaService.getSessionDetail(sessionId);
  if (sessionResponse === null) {
    res.redirect('/', 404);
    return;
  }

  const response = await klarnaService.createOrder(req.body.authorizationToken, {
    locale: sessionResponse.data.locale,
    purchase_country: sessionResponse.data.purchase_country,
    purchase_currency: sessionResponse.data.purchase_currency,
    merchant_reference1: sessionResponse.data.merchant_reference1,
    order_amount: sessionResponse.data.order_amount,
    order_tax_amount: sessionResponse.data.order_tax_amount,
    order_lines: sessionResponse.data.order_lines
  });

  if (response) {
    const sessionDetailResponse = await klarnaService.getSessionDetail(sessionId);
    klarnaService.updateSession(req.body.sessionId, {
      status: sessionDetailResponse.data.status,
      authorization_token: sessionDetailResponse.data.authorization_token,
    });

    const orderId = response.data.order_id;
    const orderResponse = await klarnaService.getOrderDetail(orderId);
    klarnaService.updateOrder(orderId, {
      status: orderResponse.data.status,
      order_amount: orderResponse.data.order_amount,
      captured_amount: orderResponse.data.captured_amount,
      refunded_amount: orderResponse.data.refunded_amount
    });

    res.redirect('/');
    return;
  }

  res.redirect('/', 500);
});

/* Capture Order */
router.post('/:id/capture', async (req, res) => {
  const orderId = req.params.id;
  const orderResponse = await klarnaService.getOrderDetail(orderId);
  if (orderResponse === null) {
    res.redirect('/', 404);
    return;
  }

  await klarnaService.captureOrder(orderId, {
    captured_amount: (orderResponse.data.order_amount - orderResponse.data.captured_amount)
  });

  const orderDetailResponse = await klarnaService.getOrderDetail(orderId);
  klarnaService.updateOrder(orderId, {
    status: orderDetailResponse.data.status,
    order_amount: orderDetailResponse.data.order_amount,
    captured_amount: orderDetailResponse.data.captured_amount,
    refunded_amount: orderDetailResponse.data.refunded_amount
  });

  res.redirect(`/order/${orderId}`);
});

/* Refund Order */
router.post('/:id/refund', async (req, res) => {
  const orderId = req.params.id;
  const orderResponse = await klarnaService.getOrderDetail(orderId);
  if (orderResponse === null) {
    res.redirect('/', 404);
    return;
  }

  await klarnaService.refundOrder(orderId, {
    refunded_amount: (orderResponse.data.captured_amount - orderResponse.data.refunded_amount)
  });

  const orderDetailResponse = await klarnaService.getOrderDetail(orderId);
  klarnaService.updateOrder(orderId, {
    status: orderDetailResponse.data.status,
    order_amount: orderDetailResponse.data.order_amount,
    captured_amount: orderDetailResponse.data.captured_amount,
    refunded_amount: orderDetailResponse.data.refunded_amount
  });

  res.redirect(`/order/${orderId}`);
});

/* Cancel Order */
router.post('/:id/cancel', async (req, res) => {
  const orderId = req.params.id;
  const orderResponse = await klarnaService.getOrderDetail(orderId);
  if (orderResponse === null) {
    res.redirect('/', 404);
    return;
  }

  await klarnaService.cancelOrder(orderId);

  const orderDetailResponse = await klarnaService.getOrderDetail(orderId);
  klarnaService.updateOrder(orderId, {
    status: orderDetailResponse.data.status,
    order_amount: orderDetailResponse.data.order_amount,
    captured_amount: orderDetailResponse.data.captured_amount,
    refunded_amount: orderDetailResponse.data.refunded_amount
  });

  res.redirect(`/order/${orderId}`);
});

module.exports = router;
