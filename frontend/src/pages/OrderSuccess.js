// frontend/src/pages/OrderSuccess.js
import React from 'react';
import { Link } from 'react-router-dom';

function OrderSuccess() {
    return (
        <div className="success-page">
            <div className="success-icon">✅</div>
            <h1>Заказ оформлен!</h1>
            <p>Спасибо за заказ. Мы свяжемся с вами для подтверждения.</p>
            <Link to="/" className="back-btn" style={{ marginTop: '30px' }}>
                Вернуться на главную
            </Link>
        </div>
    );
}

export default OrderSuccess;