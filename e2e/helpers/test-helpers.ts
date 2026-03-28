/**
 * E2E Test Helpers
 * Utility functions for E2E tests
 */

import { Page, expect } from '@playwright/test'

/**
 * Test user credentials
 */
export const testUsers = {
  customer: {
    email: 'test-customer@example.com',
    password: 'TestPassword123!',
    name: 'Test Customer',
  },
  admin: {
    email: 'adminkms@abdoaig',
    password: 'admin318',
    name: 'Super Admin',
  },
}

/**
 * Login helper using the Auth Modal
 */
export async function loginAsCustomer(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Click on the login button in the header to open the auth modal
  const loginButton = page.locator('button:has-text("تسجيل الدخول"), button:has-text("Sign In"), button:has-text("login")').first()
  await loginButton.click()
  await page.waitForTimeout(500)
  
  // Fill in the login form in the modal
  await page.locator('input#login-email, input[type="email"]').first().fill(testUsers.customer.email)
  await page.locator('input#login-password, input[type="password"]').first().fill(testUsers.customer.password)
  await page.locator('button[type="submit"]:has-text("تسجيل الدخول"), button[type="submit"]:has-text("Sign In")').first().click()
  
  await page.waitForTimeout(2000)
}

/**
 * Login as admin helper using the Auth Modal
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Click on the login button in the header to open the auth modal
  const loginButton = page.locator('button:has-text("تسجيل الدخول"), button:has-text("Sign In"), button:has-text("login")').first()
  await loginButton.click()
  await page.waitForTimeout(500)
  
  // Fill in the login form in the modal
  await page.locator('input#login-email, input[type="email"]').first().fill(testUsers.admin.email)
  await page.locator('input#login-password, input[type="password"]').first().fill(testUsers.admin.password)
  await page.locator('button[type="submit"]:has-text("تسجيل الدخول"), button[type="submit"]:has-text("Sign In")').first().click()
  
  await page.waitForTimeout(2000)
}

/**
 * Open the auth modal
 */
export async function openAuthModal(page: Page, mode: 'login' | 'register' = 'login') {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Click on the login/register button
  const authButton = page.locator('button:has-text("تسجيل الدخول"), button:has-text("Sign In"), button:has-text("login")').first()
  await authButton.click()
  await page.waitForTimeout(500)
  
  // If register mode, click on register tab
  if (mode === 'register') {
    const registerTab = page.locator('button:has-text("حساب جديد"), button:has-text("Sign Up")').first()
    await registerTab.click()
    await page.waitForTimeout(300)
  }
}

/**
 * Generate random email for registration tests
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `test-${timestamp}-${random}@example.com`
}

/**
 * Add product to cart helper
 */
export async function addProductToCart(page: Page, productIndex: number = 0) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Wait for products to load
  await page.waitForSelector('[data-testid="product-card"], .product-card, a[href*="/product/"]', { timeout: 15000 })
  
  // Click on a product
  const productCards = page.locator('[data-testid="product-card"], .product-card, a[href*="/product/"]')
  const count = await productCards.count()
  
  if (count > productIndex) {
    await productCards.nth(productIndex).click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    
    // Click add to cart button
    const addToCartBtn = page.locator('button:has-text("أضف"), button:has-text("Add to Cart"), button:has-text("أضف للسلة")').first()
    await addToCartBtn.click()
    await page.waitForTimeout(1000)
  }
}

/**
 * Clear cart helper
 */
export async function clearCart(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Open cart sidebar
  const cartButton = page.locator('button:has([data-testid="cart-icon"]), button:has(svg), [data-testid="cart-button"]').first()
  const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
  await cartIcon.click()
  await page.waitForTimeout(500)
  
  // Remove all items
  const removeButtons = page.locator('button:has-text("حذف"), button:has-text("Remove"), button:has-text("إزالة")')
  const count = await removeButtons.count()
  
  for (let i = 0; i < count; i++) {
    await removeButtons.first().click()
    await page.waitForTimeout(300)
  }
}

/**
 * Wait for page to be ready
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

/**
 * Take screenshot on failure
 */
export async function takeScreenshotOnFailure(page: Page, testName: string) {
  try {
    await page.screenshot({ path: `test-results/${testName}-failure.png` })
  } catch (e) {
    console.error('Failed to take screenshot:', e)
  }
}

/**
 * Check if element is visible with retry
 */
export async function isElementVisible(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

/**
 * Get product card count
 */
export async function getProductCount(page: Page): Promise<number> {
  const productCards = page.locator('[data-testid="product-card"], .product-card, a[href*="/product/"]')
  return await productCards.count()
}
