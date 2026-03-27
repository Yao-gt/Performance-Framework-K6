import http from 'k6/http'
import exec from 'k6/execution'
import { browser } from 'k6/browser'
import { sleep, check, fail } from 'k6'

import { BASE_URL } from '../../config/config.js'
import { homePage } from '../browser/pages/homePage.js'
import { formatNameFile } from '../../config/utils.js'

export const options = {
  thresholds: {
    browser_web_vital_lcp: ['p(95) < 2500'],
    http_req_failed: ['rate < 0.01']
  },
  scenarios: {
    smoke_1_vu: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        }
      }
    }
    // smoke_ramping: {
    //   executor: 'ramping-vus',
    //   startvus: 0,
    //   stages: [
    //     { target: 5, duration: '10s' },
    //     { target: 5, duration: '10m' },
    //     { target: 0, duration: '5s' }
    //   ],
    //   gracefulRampDown: '1s'
    // }
  }
}

export function setup() {
  const res = http.get(BASE_URL)
  if (res.status !== 200) {
    exec.test.abort(`Got unexpected status code ${res.status} when trying to setup. Exiting.`)
  }
}

export default async function () {
  let checkData
  const page = await browser.newPage()

  try {
    await page.goto(BASE_URL)

    checkData = await page.locator(homePage.locators.h3tittle).textContent()
    check(page, {
      'Check header': checkData === 'Hot Products'
    })

    await page.locator(homePage.locators.currency).click()
    await page.waitForTimeout(500)

    await page.screenshot({ path: `browser_evidences/screenshot_currency_${formatNameFile()}.png` })

  } catch (error) {
    fail(`Browser iteration failed: ${error.message}`)
  } finally {
    await page.close()
  }

  sleep(1)
}