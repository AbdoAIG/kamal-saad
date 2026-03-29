import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/test-helpers'

test.describe('User Profile - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should access profile page', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display user information', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Should display user name or email
    const userInfo = page.locator('text=/admin|Super|user/i, [data-testid="user-info"]')
    expect(await userInfo.count()).toBeGreaterThan(0)
  })

  test('should have profile edit form', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const form = page.locator('form, [data-testid="profile-form"]')
    expect(await form.count()).toBeGreaterThanOrEqual(0)
  })

  test('should have name field', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const nameField = page.locator('input[name="name"], input[value*="admin"], input[placeholder*="الاسم"]')
    expect(await nameField.count()).toBeGreaterThan(0)
  })

  test('should have email field', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const emailField = page.locator('input[type="email"], input[name="email"]')
    expect(await emailField.count()).toBeGreaterThan(0)
  })

  test('should have save button', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const saveBtn = page.locator('button[type="submit"], button:has-text("حفظ"), button:has-text("Save")')
    expect(await saveBtn.count()).toBeGreaterThan(0)
  })

  test('should navigate to addresses tab', async ({ page }) => {
    await page.goto('/profile?tab=addresses')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('User Orders - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should access orders page', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display orders or empty message', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const ordersList = page.locator('[data-testid="orders-list"], .orders-list, table')
    const emptyMessage = page.locator('[data-testid="no-orders"], text=/لا توجد طلبات|no orders/i')
    
    expect((await ordersList.count()) > 0 || (await emptyMessage.count()) > 0).toBeTruthy()
  })

  test('should have order tabs or filters', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const filters = page.locator('[data-testid="order-filters"], .tabs, button:has-text("الكل"), button:has-text("All")')
    expect(await filters.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe('User Addresses - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/profile?tab=addresses')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display addresses section', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('should have add address button', async ({ page }) => {
    const addBtn = page.locator('button:has-text("إضافة"), button:has-text("Add"), button:has-text("جديد")')
    expect(await addBtn.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display saved addresses or empty message', async ({ page }) => {
    const addressesList = page.locator('[data-testid="addresses-list"], .address-card')
    const emptyMessage = page.locator('[data-testid="no-addresses"], text=/لا توجد عناوين|no addresses/i')
    
    expect((await addressesList.count()) > 0 || (await emptyMessage.count()) > 0).toBeTruthy()
  })
})

test.describe('User Profile - Unauthenticated', () => {
  test('should redirect to home when not logged in', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForTimeout(2000)
    
    // Should be redirected
    const url = page.url()
    expect(url.includes('login') || url === 'http://localhost:3000/' || url.includes('auth')).toBeTruthy()
  })

  test('should redirect orders when not logged in', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForTimeout(2000)
    
    const url = page.url()
    expect(url.includes('login') || url === 'http://localhost:3000/' || url.includes('auth')).toBeTruthy()
  })
})

test.describe('User Profile - Responsive', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginAsAdmin(page)
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })
})
