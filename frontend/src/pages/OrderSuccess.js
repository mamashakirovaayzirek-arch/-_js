import React from 'react';
import { Link } from 'react-router-dom';

function OrderSuccess() {
    const lang = localStorage.getItem('lang') || 'ru';

    const t = {
        ru: {
            title: 'Заказ оформлен!',
            thanks: 'Спасибо за заказ. Мы свяжемся с вами для подтверждения.',
            backHome: 'Вернуться на главную'
        },
        ky: {
            title: 'Буйрутма берилди!',
            thanks: 'Буйрутмаңыз үчүн рахмат. Биз сиз менен байланышабыз.',
            backHome: 'Башкы бетке кайтуу'
        }
    }[lang];

    return (
        <div className="success-page">
            <div className="success-icon">✅</div>
            <h1>{t.title}</h1>
            <p>{t.thanks}</p>
            <Link to="/" className="back-btn" style={{ marginTop: '30px' }}>
                {t.backHome}
            </Link>
        </div>
    );
}

export default OrderSuccess;