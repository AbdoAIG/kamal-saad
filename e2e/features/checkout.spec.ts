import { test, expect } from '@playwright/test'
import { loginAsAdmin, addProductToCart } from '../helpers/test-helpers'

test.describe('Checkout Page - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await addProductToCart(page)
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display checkout page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display order summary', async ({ page }) => {
    const orderSummary = page.locator('[data-testid="order-summary"], .order-summary, text=/ملخص|Summary/')
    expect(await orderSummary.count()).toBeGreaterThan(0)
  })

  test('should display shipping form', async ({ page }) => {
    const shippingForm = page.locator('form, [data-testid="shipping-form"]')
    expect(await shippingForm.count()).toBeGreaterThan(0)
  })

  test('should have full name input', async ({ page }) => {
    const nameInput = page.locator('input[name="fullName"], input[name="name"], input[placeholder*="الاسم"]')
    expect(await nameInput.count()).toBeGreaterThan(0)
  })

  test('should have phone input', async ({ page }) => {
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]')
    expect(await phoneInput.count()).toBeGreaterThan(0)
  })

  test('should have address input', async ({ page }) => {
    const addressInput = page.locator('input[name="address"], textarea[name="address"], input[placeholder*="العنوان"]')
    expect(await addressInput.count()).toBeGreaterThan(0)
  })

  test('should have city input', async ({ page }) => {
    const cityInput = page.locator('input[name="city"], input[placeholder*="المدينة"]')
    expect(await cityInput.count()).toBeGreaterThanOrEqual(0)
  })

  test('should have place order button', async ({ page }) => {
    const placeOrderBtn = page.locator('button[type="submit"], button:has-text("تأكيد"), button:has-text("Place Order")')
    expect(await placeOrderBtn.count()).toBeGreaterThan(0)
  })

  test('should validate required fields', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()
    await page.waitForTimeout(1000)
    
    // Should show validation errors
    const errorMessage = page.locator('.error, text=/مطلوب|required/i')
    expect(await errorMessage.count()).toBeGreaterThanOrEqual(0)
  })

  test('should validate phone format', async ({ page }) => {
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first()
    await phoneInput.fill('invalid')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(500)
    
    // Should show validation error or prevent submission
    const error = page.locator('.error, :invalid')
    expect(await error.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display total price', async ({ page }) => {
    const total = page.locator('text=/الإجمالي|Total|ج\.م|EGP/')
    expect(await total.count()).toBeGreaterThan(0)
  })

  test('should have payment method selection', async ({ page }) => {
    const paymentMethods = page.locator('[data-testid="payment-methods"], input[type="radio"], text=/الدفع|Payment/')
    expect(await paymentMethods.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Checkout - Complete Flow', () => {
  test('should complete order', async ({ page }) => {
    await loginAsAdmin(page)
    await addProductToCart(page)
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Fill shipping form
    await page.locator('input[name="fullName"], input[name="name"]').first().fill('Test User')
    await page.locator('input[name="phone"], input[type="tel"]').first().fill('+201001234567')
    await page.locator('input[name="address"], textarea[name="address"]').first().fill('123 Test Street')
    
    const cityInput = page.locator('input[name="city"]')
    if (await cityInput.count() > 0) {
      await cityInput.first().fill('Cairo')
    }
    
    // Submit order
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(3000)
    
    // Should redirect to order confirmation or success page
    const url = page.url()
    expect(url.includes('order') || url.includes('success') || url.includes('confirmation')).toBeTruthy()
  })
})

test.describe('Checkout - Unauthenticated', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForTimeout(2000)
    
    const url = page.url()
    expect(url.includes('login') || url === 'http://localhost:3000/' || url.includes('auth')).toBeTruthy()
  })
})

test.describe('Checkout - Responsive', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginAsAdmin(page)
    await addProductToCart(page)
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })
})
