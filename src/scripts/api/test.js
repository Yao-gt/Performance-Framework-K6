import http from 'k6/http'
import exec from 'k6/execution'
import { check, group, sleep } from 'k6'
import { expect } from 'https://jslib.k6.io/k6-testing/0.6.1/index.js'
import { SharedArray } from 'k6/data'

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js"

import { BASE_URL, API_ENDPOINTS, CURRENCIES } from '../../config/config.js'


const products = new SharedArray('Products from Products.json file', function () {
  const fileData = open('../../data/products.json')
  const jsonData = JSON.parse(fileData)
  return jsonData.products
})


export const options = {
   scenarios: {
    // smoke_1_vu: {
    //   executor: 'shared-iterations',
    //   vus: 1,
    //   iterations: 3
    // },
    smoke_ramping: {
      executor: 'ramping-vus',
      startvus: 0,
      stages: [
        { target: 5, duration: '10s' },
        { target: 5, duration: '10m' },
        { target: 0, duration: '5s' }
      ],
      gracefulRampDown: '1s',
    }
  },
}

export default function () {
    console.log(`---------------------------------------------------`)
    console.log(`1. Starting test scenario.`)
    // Load the homepage
    let homepageRes = http.get(`${BASE_URL}/`)
    if (homepageRes.status !== 200) {
        exec.test.abort(`Got unexpected status code ${homepageRes.status} when trying to setup. Exiting.`)
    }
    check(homepageRes, {
        'Verify success Hot Product tittle on Homepage': (r) => r.body.includes('Hot Products')
    })

    // Setting a random currency for the session
    const randomCurrency = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)]
    console.log(`2. Setting a random currency for the session and adding different products to the cart: ${randomCurrency}`)
    const requestBodyCurrency = { currency: randomCurrency }
    let setCurrencyRes = http.post(`${API_ENDPOINTS.SET_CURRENCY}`, requestBodyCurrency)
    expect(setCurrencyRes.status, 'Set Currency API should return successful response').toBe(200)


    // Adding different products to the cart
    const amountRandomProducts = Math.floor(Math.random() * products.length)
    console.log(`3. Adding ${amountRandomProducts} different products to the cart.`)
    group('Adding different products to cart', function () {
        for (let id = 0; id <= amountRandomProducts - 1; id++) {
            // Generate a random product ID to add to the cart
            let idRandom = Math.floor(Math.random() * products.length)
            console.log(`   -Viewing product with id ${products[idRandom].id} to the cart.`)
            let productRes = http.get(`${API_ENDPOINTS.PRODUCT}/${products[idRandom].id}`)
            check(productRes, {
                'Verify product name on Product Page': (r) => r.body.includes(products[idRandom].name)
            })
            expect(productRes.status, 'Product API should return successful response').toBe(200)
            
            sleep(1)

            console.log(`   -Adding product with id ${products[idRandom].id} to the cart.`)
            // Add the product to the cart
            const requestBodyAddProduct = { 
                product_id: products[idRandom].id, 
                quantity: Math.floor(Math.random() * 5) + 1
            }
            let addToCartPostRes = http.post(`${API_ENDPOINTS.CART}`, requestBodyAddProduct, { redirects: 0 })
            expect(addToCartPostRes.status, 'Add to Cart API should return found response').toBe(302)

            sleep(2)
        }
    })

    console.log(`4. Proceeding to view the cart and checkout with ${amountRandomProducts} different products added.`)
    group('Viewing and Checking Out Cart', function () {

        // View the cart if at least one product was added
        if (amountRandomProducts > 0) { 
            let cartRes = http.get(`${API_ENDPOINTS.CART}`)
            expect(cartRes.status, 'Cart API should return successful response').toBe(200)
            check(cartRes, {
                'Verify cart tittle': (r) => r.body.includes("Cart")
            })

            // Proceed to checkout
            let randomEmail = `user${Math.floor(Math.random() * 1000)}@example.com`
            const requestBodyCheckout = {
                email: randomEmail,
                street_address: "1600 Amphitheatre Parkway",
                zip_code: "94043",
                city: "Mountain View",
                state: "CA",
                country: "United States",
                credit_card_number: "4432-8015-6152-0454",
                credit_card_expiration_month: 1,
                credit_card_expiration_year: 2027,
                credit_card_cvv: 672
            }
            let checkoutRes = http.post(`${API_ENDPOINTS.CHECKOUT}`, requestBodyCheckout)
            expect(checkoutRes.status, 'Checkout API should return successful response').toBe(200)
        } else {
            console.log(`   No products were added to the cart, skipping checkout process.`)
        }

    })

    console.log(`5. Finished checkout process.`)

    console.log(`---------------------------------------------------`)

    sleep(1)  

}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const testName = __ENV.TEST_NAME || 'smoke-test'
  const reportPath = `reports/${testName}_${timestamp}.html`
  
  return {
    [reportPath]: htmlReport(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true })
  }
}