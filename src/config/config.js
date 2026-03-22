// Homepage URL of the application under test. Can be overridden by setting the BASE_URL environment variable when running the tests.
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'

// API endpoints
export const API_ENDPOINTS = {
    PRODUCT: `${BASE_URL}/product`,
    CART: `${BASE_URL}/cart`,
    SET_CURRENCY: `${BASE_URL}/setCurrency`,
    CHECKOUT: `${BASE_URL}/cart/checkout`,
    EMPTY_CART: `${BASE_URL}/cart/empty`
}

// List of supported currencies for the application
export const CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD']
