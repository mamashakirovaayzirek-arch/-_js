// backend/data.js

const restaurants = [
    {
        id: 1,
        name: "ЧЫГДАН",
        description: "Ноциональные блюда!",
        address: "ул. Ленина, 45",
        phone: "+996 555 123 456",
        latitude: 40.5138,
        longitude: 72.8161,
        rating: 4.8,
        logo: "/images/logo1.jpg",
        categories: [
            {
                name: "Супы",
                items: [
                    { id: 101, name: "Лагман", description: "Домашняя лапша с говядиной и овощами", price: 280, image: "/images/lagman.jpg" },
                    { id: 102, name: "Шорпо", description: "Бараний суп с картошкой и нутом", price: 250, image: "/images/shorpo.jpg" },
                    { id: 103, name: "Мастава", description: "Рисовый суп с овощами", price: 200, image: "/images/mastava.jpg" }
                ]
            },
            {
                name: "Горячие блюда",
                items: [
                    { id: 201, name: "Плов", description: "Осский плов с бараниной, морковью и изюмом", price: 350, image: "/images/plov.jpg" },
                    { id: 202, name: "Манты", description: "На пару, 4 шт., с мясом и тыквой", price: 300, image: "/images/manty.jpg" },
                    { id: 203, name: "Ганфан", description: "Жареный рис с мясом и овощами", price: 320, image: "/images/ganfan.jpg" },
                    { id: 204, name: "Шашлык", description: "Баранина, 6 шампуров, с луком", price: 450, image: "/images/shashlik.jpg" }
                ]
            },
            {
                name: "Выпечка",
                items: [
                    { id: 301, name: "Самса", description: "С мясом, из тандыра", price: 80, image: "/images/samsa.jpg" },
                    { id: 302, name: "Лепёшка", description: "Тандырная, круглая", price: 40, image: "/images/lepeshka.jpg" },
                    { id: 303, name: "Боорсок", description: "Вкусняшки, 200г", price: 120, image: "/images/boorsok.jpg" }
                ]
            },
            {
                name: "Напитки",
                items: [
                    { id: 401, name: "Чай", description: "Зелёный/чёрный, с лимоном", price: 50, image: "/images/tea.jpg" },
                    { id: 402, name: "Компот", description: "Домашний, сезонный", price: 80, image: "/images/kompot.jpg" },
                    { id: 403, name: "Айран", description: "Домашний, 0.5л", price: 60, image: "/images/ayran.jpg" },
                    { id: 404, name: "Максым", description: "Традиционный", price: 70, image: "/images/maxsim.jpg" }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "БУУДАЙ",
        description: "Европейская и кыргызская кухня. Уютная атмосфера для всей семьи.",
        address: "ул. Курманжан Датки, 12",
        phone: "+996 555 987 654",
        latitude: 40.5280,
        longitude: 72.8050,
        rating: 4.5,
        logo: "/images/logo2.jpg",
        categories: [
            {
                name: "Завтраки",
                items: [
                    { id: 1101, name: "Блинчики", description: "Со сметаной и мёдом, 3 шт.", price: 180, image: "/images/bliny.jpg" },
                    { id: 1102, name: "Сырники", description: "С вареньем, 4 шт.", price: 200, image: "/images/syrniki.jpg" },
                    { id: 1103, name: "Омлет", description: "С овощами и сыром", price: 220, image: "/images/omlet.jpg" }
                ]
            },
            {
                name: "Салаты",
                items: [
                    { id: 1201, name: "Цезарь", description: "С курицей, пармезаном, соусом", price: 350, image: "/images/cezar.jpg" },
                    { id: 1202, name: "Греческий", description: "С фетой и оливками", price: 320, image: "/images/greek.jpg" },
                    { id: 1203, name: "Оливье", description: "Классический", price: 280, image: "/images/olivie.jpg" }
                ]
            },
            {
                name: "Горячее",
                items: [
                    { id: 1301, name: "Стейк", description: "Говяжий, с гарниром", price: 650, image: "/images/steak.jpg" },
                    { id: 1302, name: "Паста Карбонара", description: "С беконом и сливками", price: 420, image: "/images/carbonara.jpg" },
                    { id: 1303, name: "Котлеты", description: "С пюре и подливкой", price: 380, image: "/images/kotlety.jpg" }
                ]
            },
            {
                name: "Десерты",
                items: [
                    { id: 1401, name: "Чизкейк", description: "Классический", price: 250, image: "/images/cheesecake.jpg" },
                    { id: 1402, name: "Тирамису", description: "Итальянский", price: 280, image: "/images/tiramisu.jpg" },
                    { id: 1403, name: "Мороженое", description: "3 шарика", price: 150, image: "/images/icecream.jpg" }
                ]
            }
        ]
    },
    {
        id: 3,
        name: "ЗИРЕ",
        description: "Быстрая еда, бургеры, пицца. Доставка по городу.",
        address: "ул. Айтматова, 78",
        phone: "+996 555 777 888",
        latitude: 40.5200,
        longitude: 72.8100,
        rating: 4.2,
        logo: "/images/logo3.jpg",
        categories: [
            {
                name: "Бургеры",
                items: [
                    { id: 2101, name: "Классический", description: "Говядина, сыр, овощи", price: 280, image: "/images/burger1.jpg" },
                    { id: 2102, name: "Двойной", description: "Две котлеты, двойной сыр", price: 380, image: "/images/burger2.jpg" },
                    { id: 2103, name: "Чикен", description: "Куриная котлета", price: 250, image: "/images/burger3.jpg" }
                ]
            },
            {
                name: "Пицца",
                items: [
                    { id: 2201, name: "Маргарита", description: "Сыр, томаты, базилик", price: 450, image: "/images/pizza1.jpg" },
                    { id: 2202, name: "Пепперони", description: "Острая колбаса", price: 550, image: "/images/pizza2.jpg" },
                    { id: 2203, name: "4 сыра", description: "Моцарелла, пармезан, дорблю, чеддер", price: 600, image: "/images/pizza3.jpg" }
                ]
            },
            {
                name: "Закуски",
                items: [
                    { id: 2301, name: "Картофель фри", description: "Большая порция", price: 150, image: "/images/fries.jpg" },
                    { id: 2302, name: "Наггетсы", description: "Куриные, 6 шт.", price: 200, image: "/images/nuggets.jpg" },
                    { id: 2303, name: "Луковые кольца", description: "В кляре", price: 180, image: "/images/onion.jpg" }
                ]
            },
            {
                name: "Напитки",
                items: [
                    { id: 2401, name: "Кола", description: "0.5л", price: 80, image: "/images/cola.jpg" },
                    { id: 2402, name: "Фанта", description: "0.5л", price: 80, image: "/images/fanta.jpg" },
                    { id: 2403, name: "Милкшейк", description: "Ваниль/клубника/шоколад", price: 200, image: "/images/milkshake.jpg" }
                ]
            }
        ]
    }
];

const getRestaurantsList = () => {
    return restaurants.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        address: r.address,
        phone: r.phone,
        latitude: r.latitude,
        longitude: r.longitude,
        rating: r.rating,
        logo: r.logo,
        categories: r.categories.map(c => c.name)
    }));
};

const getRestaurantById = (id) => {
    return restaurants.find(r => r.id === parseInt(id));
};

module.exports = {
    restaurants,
    getRestaurantsList,
    getRestaurantById
};