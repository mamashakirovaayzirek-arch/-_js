import React from 'react';

const DiscountBanner = ({ totalSpent, cartTotal }) => {
  const LOYALTY_THRESHOLD = 2000;
  const LOYALTY_DISCOUNT = 200;
  
  const progress = Math.min((totalSpent / LOYALTY_THRESHOLD) * 100, 100);
  const hasDiscount = totalSpent >= LOYALTY_THRESHOLD;
  
  const discountedTotal = hasDiscount ? Math.max(0, cartTotal - LOYALTY_DISCOUNT) : cartTotal;

  return (
    <div className="discount-banner">
      <div className="discount-info">
        <p>💎 Накоплено: <strong>{totalSpent} сом</strong></p>
        
        {hasDiscount ? (
          <p className="discount-active">
            🎉 У вас скидка {LOYALTY_DISCOUNT} сом на этот заказ!
          </p>
        ) : (
          <p>
            До скидки {LOYALTY_DISCOUNT} сом: <strong>{LOYALTY_THRESHOLD - totalSpent} сом</strong>
          </p>
        )}
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {hasDiscount && (
        <div className="cart-summary">
          <p>Сумма: {cartTotal} сом</p>
          <p className="discount-amount">- Скидка: {LOYALTY_DISCOUNT} сом</p>
          <p className="final-amount">Итого: {discountedTotal} сом</p>
        </div>
      )}
    </div>
  );
};

export default DiscountBanner;