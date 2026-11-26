const jwt = require('jsonwebtoken');

const PAYMENT_TOKEN_AUDIENCE = 'ecpay-payment-form';
const PAYMENT_TOKEN_ISSUER = 'flower-store';
const PAYMENT_TOKEN_PURPOSE = 'ecpay-payment';
const PAYMENT_TOKEN_TTL = '15m';

function signPaymentAccessToken(orderId, userId) {
  return jwt.sign(
    { orderId, purpose: PAYMENT_TOKEN_PURPOSE },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      audience: PAYMENT_TOKEN_AUDIENCE,
      expiresIn: PAYMENT_TOKEN_TTL,
      issuer: PAYMENT_TOKEN_ISSUER,
      subject: userId
    }
  );
}

function verifyPaymentAccessToken(token, order) {
  if (typeof token !== 'string' || token.length === 0) return false;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: PAYMENT_TOKEN_AUDIENCE,
      issuer: PAYMENT_TOKEN_ISSUER
    });

    return payload.purpose === PAYMENT_TOKEN_PURPOSE
      && payload.orderId === order.id
      && payload.sub === order.user_id;
  } catch (_error) {
    return false;
  }
}

module.exports = { signPaymentAccessToken, verifyPaymentAccessToken };
