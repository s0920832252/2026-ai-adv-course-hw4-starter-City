const {
  signPaymentAccessToken,
  verifyPaymentAccessToken
} = require('../src/utils/paymentAccessToken');

describe('Payment access token', () => {
  it('only grants short-lived access to the matching owner and order', () => {
    const now = new Date('2026-11-26T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    try {
      const order = { id: 'order-1', user_id: 'user-1' };
      const token = signPaymentAccessToken(order.id, order.user_id);

      expect(verifyPaymentAccessToken(token, order)).toBe(true);
      expect(verifyPaymentAccessToken(token, { id: 'order-2', user_id: 'user-1' })).toBe(false);
      expect(verifyPaymentAccessToken(token, { id: 'order-1', user_id: 'user-2' })).toBe(false);

      vi.setSystemTime(new Date(now.getTime() + 16 * 60 * 1000));
      expect(verifyPaymentAccessToken(token, order)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
