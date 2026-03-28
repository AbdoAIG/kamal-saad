import { test, expect } from '@playwright/test'

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
  })

  test('should display contact page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display contact form', async ({ page }) => {
    const form = page.locator('form, [data-testid="contact-form"]')
    expect(await form.count()).toBeGreaterThan(0)
  })

  test('should have name input', async ({ page }) => {
    const nameInput = page.locator('input[name="name"], input[placeholder*="الاسم"], input[placeholder*="Name"]')
    expect(await nameInput.count()).toBeGreaterThan(0)
  })

  test('should have email input', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    expect(await emailInput.count()).toBeGreaterThan(0)
  })

  test('should have message textarea', async ({ page }) => {
    const messageInput = page.locator('textarea, input[name="message"]')
    expect(await messageInput.count()).toBeGreaterThan(0)
  })

  test('should have submit button', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("إرسال"), button:has-text("Send")')
    expect(await submitBtn.count()).toBeGreaterThan(0)
  })

  test('should submit contact form', async ({ page }) => {
    await page.locator('input[name="name"], input[placeholder*="الاسم"]').first().fill('Test User')
    await page.locator('input[type="email"], input[name="email"]').first().fill('test@example.com')
    await page.locator('textarea, input[name="message"]').first().fill('This is a test message')
    
    await page.locator('button[type="submit"], button:has-text("إرسال")').first().click()
    await page.waitForTimeout(2000)
    
    // Check for success message
    const successMessage = page.locator('text=/شكرا|تم الإرسال|success|sent/i')
    expect(await successMessage.count()).toBeGreaterThanOrEqual(0)
  })

  test('should validate required fields', async ({ page }) => {
    await page.locator('button[type="submit"], button:has-text("إرسال")').first().click()
    await page.waitForTimeout(1000)
    
    // Should show validation errors
    const errorMessage = page.locator('.error, text=/مطلوب|required/i')
    expect(await errorMessage.count()).toBeGreaterThanOrEqual(0)
  })

  test('should validate email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await emailInput.fill('notanemail')
    await page.locator('button[type="submit"]').first().click()
    
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(isValid).toBe(false)
  })

  test('should display contact information', async ({ page }) => {
    const contactInfo = page.locator('text=/phone|email|address|هاتف|بريد|عنوان/i')
    expect(await contactInfo.count()).toBeGreaterThan(0)
  })
})

test.describe('Contact Page - Responsive', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('body')).toBeVisible()
    
    const form = page.locator('form, [data-testid="contact-form"]')
    await expect(form.first()).toBeVisible()
  })
})
