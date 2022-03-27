// eslint-disable-next-line max-classes-per-file
const LokiJS = require('lokijs');
// eslint-disable-next-line import/extensions
const Lfsa = require('lokijs/src/loki-fs-structured-adapter.js');

const axios = require('axios').default;
const debug = require('debug')('klarna:service');
const error = require('debug')('klarna:service:error');

class KlarnaService {
  /**
   * New instance of Klarna API Service.
   * @param username
   * @param password
   * @param apiUrl
   */
  constructor(username, password, apiUrl) {
    this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    this.apiUrl = apiUrl;

    const adapter = new Lfsa();
    const thisCs = this;
    this.db = new LokiJS('klarna.db', {
      adapter,
      autoload: true,
      autoloadCallback: () => {
        thisCs.sessionDb = (thisCs.db.getCollection('session') ? thisCs.db.getCollection('session') : thisCs.db.addCollection('session'));
        thisCs.orderDb = (thisCs.db.getCollection('order') ? thisCs.db.getCollection('order') : thisCs.db.addCollection('order'));
      },
      autosave: true,
      autosaveInterval: 4000
    });
  }

  /**
   * Create new session.
   * @param body
   * @returns {Promise<AxiosResponse<any>|null>}
   */
  async createSession(body) {
    try {
      const response = await axios.post(`${this.apiUrl}/payments/v1/sessions`, body, {
        headers: {
          Authorization: this.authHeader
        }
      });
      debug(response);
      response.data.payment = true;
      response.data.status = 'incomplete';
      this.sessionDb.insert(response.data);

      return response;
    } catch (err) {
      error(err);
    }
    return null;
  }

  /**
   * Create new order.
   * @param authorizationToken
   * @param body
   * @returns {Promise<AxiosResponse<any>|null>}
   */
  async createOrder(authorizationToken, body) {
    try {
      const response = await axios.post(`${this.apiUrl}/payments/v1/authorizations/${authorizationToken}/order`, body, {
        headers: {
          Authorization: this.authHeader
        }
      });
      debug(response);
      this.orderDb.insert(response.data);

      return response;
    } catch (err) {
      error(err);
    }
    return null;
  }

  /**
   * Capture order.
   * @param orderId
   * @param body
   * @returns {Promise<AxiosResponse<any>|null>}
   */
  async captureOrder(orderId, body) {
    try {
      const response = await axios.post(`${this.apiUrl}/ordermanagement/v1/orders/${orderId}/captures`, body, {
        headers: {
          Authorization: this.authHeader
        }
      });
      debug(response);
      return response;
    } catch (err) {
      error(err);
    }
    return null;
  }

  /**
   * Refund order.
   * @param orderId
   * @param body
   * @returns {Promise<AxiosResponse<any>|null>}
   */
  async refundOrder(orderId, body) {
    try {
      const response = await axios.post(`${this.apiUrl}/ordermanagement/v1/orders/${orderId}/refunds`, body, {
        headers: {
          Authorization: this.authHeader
        }
      });
      debug(response);
      return response;
    } catch (err) {
      error(err);
    }
    return null;
  }

  /**
   * Cancel order.
   * @param orderId
   * @returns {Promise<AxiosResponse<any>|null>}
   */
  async cancelOrder(orderId) {
    try {
      const response = await axios.post(`${this.apiUrl}/ordermanagement/v1/orders/${orderId}/cancel`, {}, {
        headers: {
          Authorization: this.authHeader
        }
      });
      debug(response);
      return response;
    } catch (err) {
      error(err);
    }
    return null;
  }

  /**
   * Get session detail using session id.
   * @param sessionId
   * @returns {Promise<AxiosResponse<any>|null>}
   */
  async getSessionDetail(sessionId) {
    try {
      const response = await axios.get(`${this.apiUrl}/payments/v1/sessions/${sessionId}`, {
        headers: {
          Authorization: this.authHeader
        }
      });
      debug(response);
      return response;
    } catch (err) {
      error(err);
    }
    return null;
  }

  /**
   * Get order detail using order id.
   * @param orderId
   * @returns {Promise<AxiosResponse<any>|null>}
   */
  async getOrderDetail(orderId) {
    try {
      const response = await axios.get(`${this.apiUrl}/ordermanagement/v1/orders/${orderId}`, {
        headers: {
          Authorization: this.authHeader
        }
      });
      debug(response);
      return response;
    } catch (err) {
      error(err);
    }
    return null;
  }

  // DB Services
  /**
   * Get all sessions from DB.
   * @returns {*}
   */
  getSessions() {
    return this.sessionDb.find();
  }

  /**
   * Get all orders from DB.
   * @returns {*}
   */
  getOrders() {
    return this.orderDb.find();
  }

  /**
   * Update Session in DB.
   * @param sessionId
   * @param update
   */
  updateSession(sessionId, update) {
    const updateCallback = (data) => {
      if (update.status) {
        // eslint-disable-next-line no-param-reassign
        data.status = update.status;

        // eslint-disable-next-line no-param-reassign
        data.payment = (update.status !== 'complete');
      }

      if (update.authorization_token) {
        // eslint-disable-next-line no-param-reassign
        data.authorization_token = update.authorization_token;
      }

      return data;
    };

    this.sessionDb.findAndUpdate({
      session_id: sessionId
    }, updateCallback);
  }

  /**
   * Update Order in DB.
   * @param orderId
   * @param update
   */
  updateOrder(orderId, update) {
    const updateCallback = (data) => {
      if (update.status) {
        // eslint-disable-next-line no-param-reassign
        data.status = update.status;
      }

      if (update.order_amount) {
        // eslint-disable-next-line no-param-reassign
        data.order_amount = update.order_amount;
      }

      if (update.captured_amount) {
        // eslint-disable-next-line no-param-reassign
        data.captured_amount = update.captured_amount;
      }

      if (update.refunded_amount) {
        // eslint-disable-next-line no-param-reassign
        data.refunded_amount = update.refunded_amount;
      }

      return data;
    };

    this.orderDb.findAndUpdate({
      order_id: orderId
    }, updateCallback);
  }
}

class Singleton {
  /**
   * New instance of Klarna API Service.
   * @param username
   * @param password
   * @param apiUrl
   */
  constructor(username = null, password = null, apiUrl = null) {
    if (!Singleton.instance) {
      Singleton.instance = new KlarnaService(username, password, apiUrl);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getInstance() {
    return Singleton.instance;
  }
}

module.exports = Singleton;
