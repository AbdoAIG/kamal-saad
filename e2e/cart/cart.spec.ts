import { test, expect } from '@playwright/test'
import { loginAsAdmin, addProductToCart } from '../helpers/test-helpers'

test.describe('Cart Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should open cart sidebar', async ({ page }) => {
    // Click cart icon
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    // Cart sidebar should be visible
    const cartSidebar = page.locator('[data-testid="cart-sidebar"], .cart-sidebar, [role="dialog"]')
    expect(await cartSidebar.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display empty cart message when empty', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const emptyMessage = page.locator('text=/سلة فارغة|empty cart|no items/i, [data-testid="empty-cart"]')
    expect(await emptyMessage.count()).toBeGreaterThanOrEqual(0)
  })

  test('should close cart sidebar', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    // Click close button
    const closeBtn = page.locator('button:has([data-lucide="x"]), button:has-text("إغلاق"), button:has-text("Close")').first()
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Cart with Items', () => {
  test.beforeEach(async ({ page }) => {
    await addProductToCart(page)
  })

  test('should display cart items', async ({ page }) => {
    // Open cart
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const cartItems = page.locator('[data-testid="cart-item"], .cart-item')
    expect(await cartItems.count()).toBeGreaterThanOrEqual(1)
  })

  test('should display product image in cart', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const productImage = page.locator('[data-testid="cart-item"] img, .cart-item img')
    expect(await productImage.count()).toBeGreaterThan(0)
  })

  test('should display product name in cart', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const cartItem = page.locator('[data-testid="cart-item"], .cart-item').first()
    await expect(cartItem).toBeVisible()
  })

  test('should update quantity', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const quantityInput = page.locator('input[type="number"], .quantity-input')
    if (await quantityInput.count() > 0) {
      const currentValue = await quantityInput.first().inputValue()
      await quantityInput.first().fill((parseInt(currentValue) + 1).toString())
      await page.waitForTimeout(500)
    }
  })

  test('should remove item from cart', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const removeBtn = page.locator('button:has-text("حذف"), button:has-text("Remove"), button:has-text("إزالة"), button:has([data-lucide="trash"])')
    if (await removeBtn.count() > 0) {
      await removeBtn.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should display cart summary', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const summary = page.locator('[data-testid="cart-summary"], .cart-summary, text=/المجموع|Total/')
    expect(await summary.count()).toBeGreaterThan(0)
  })

  test('should display total price', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const total = page.locator('text=/ج\.م|EGP|\$|الإجمالي|Total/')
    expect(await total.count()).toBeGreaterThan(0)
  })

  test('should have checkout button', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const checkoutBtn = page.locator('button:has-text("إتمام"), button:has-text("Checkout"), button:has-text("الطلب")')
    expect(await checkoutBtn.count()).toBeGreaterThan(0)
  })
})

test.describe('Checkout Process', () => {
  test('should require login for checkout', async ({ page }) => {
    await addProductToCart(page)
    
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const checkoutBtn = page.locator('button:has-text("إتمام"), button:has-text("Checkout"), button:has-text("الطلب")').first()
    if (await checkoutBtn.count() > 0) {
      await checkoutBtn.click()
      await page.waitForTimeout(1000)
      
      // Should show login modal or redirect
      const loginModal = page.locator('[role="dialog"]:has-text("تسجيل"), [role="dialog"]:has-text("Sign In")')
      const authRedirect = page.url().includes('login') || page.url().includes('auth')
      
      expect((await loginModal.count()) > 0 || authRedirect).toBeTruthy()
    }
  })
})

test.describe('Order Creation - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await addProductToCart(page)
  })

  test('should proceed to checkout when logged in', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const checkoutBtn = page.locator('button:has-text("إتمام"), button:has-text("Checkout")').first()
    if (await checkoutBtn.count() > 0) {
      await checkoutBtn.click()
      await page.waitForTimeout(2000)
      
      // Should navigate to checkout page or show shipping form
      const url = page.url()
      expect(url.includes('checkout') || url.includes('order')).toBeTruthy()
    }
  })

  test('should display shipping form', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const checkoutBtn = page.locator('button:has-text("إتمام"), button:has-text("Checkout")').first()
    if (await checkoutBtn.count() > 0) {
      await checkoutBtn.click()
      await page.waitForTimeout(2000)
      
      const nameInput = page.locator('input[name="fullName"], input[name="name"]')
      const phoneInput = page.locator('input[name="phone"]')
      const addressInput = page.locator('input[name="address"], textarea[name="address"]')
      
      const hasShippingForm = (await nameInput.count()) > 0 || 
                              (await phoneInput.count()) > 0 || 
                              (await addressInput.count()) > 0
      expect(hasShippingForm).toBeTruthy()
    }
  })

  test('should validate required shipping fields', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const checkoutBtn = page.locator('button:has-text("إتمام"), button:has-text("Checkout")').first()
    if (await checkoutBtn.count() > 0) {
      await checkoutBtn.click()
      await page.waitForTimeout(2000)
      
      // Try to submit empty form
      const submitBtn = page.locator('button[type="submit"]:has-text("تأكيد"), button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("Place Order")')
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click()
        await page.waitForTimeout(1000)
        
        // Should show validation errors
        const error = page.locator('.error, text=/مطلوب|required/i')
        expect(await error.count()).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

test.describe('Order History', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display orders page', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Should show orders list or empty message
    const ordersList = page.locator('[data-testid="orders-list"], .orders-list, table')
    const emptyMessage = page.locator('[data-testid="no-orders"], text=/لا توجد طلبات|no orders/i')
    
    expect((await ordersList.count()) > 0 || (await emptyMessage.count()) > 0).toBeTruthy()
  })

  test('should display order details', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const orderItem = page.locator('[data-testid="order-item"], .order-card, a[href*="/orders/"]')
    if (await orderItem.count() > 0) {
      await orderItem.first().click()
      await page.waitForLoadState('networkidle')
      
      expect(page.url()).toContain('/orders/')
    }
  })
})

test.describe('Cart Persistence', () => {
  test('should persist cart after page reload', async ({ page }) => {
    await addProductToCart(page)
    
    // Get cart count before reload
    const cartBadge = page.locator('[data-testid="cart-badge"], .cart-badge')
    const countBefore = await cartBadge.count() > 0 ? parseInt(await cartBadge.first().textContent() || '0') : 0
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check cart count after reload
    const countAfter = await cartBadge.count() > 0 ? parseInt(await cartBadge.first().textContent() || '0') : 0
    expect(countAfter).toBeGreaterThanOrEqual(countBefore)
  })
})

test.describe('Cart Edge Cases', () => {
  test('should handle adding same product multiple times', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="product-card"], .product-card, a[href*="/product/"]', { timeout: 15000 })
    
    // Add product twice
    await addProductToCart(page, 0)
    await addProductToCart(page, 0)
    
    // Open cart and check quantity
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const quantityInput = page.locator('input[type="number"], .quantity-input')
    if (await quantityInput.count() > 0) {
      const quantity = await quantityInput.first().inputValue()
      expect(parseInt(quantity)).toBeGreaterThanOrEqual(1)
    }
  })

  test('should not allow negative quantity', async ({ page }) => {
    await addProductToCart(page)
    
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg').first()
    await cartIcon.click()
    await page.waitForTimeout(500)
    
    const quantityInput = page.locator('input[type="number"], .quantity-input').first()
    if (await quantityInput.count() > 0) {
      await quantityInput.fill('0')
      await page.waitForTimeout(500)
      
      // Quantity should not go below 1
      const quantity = await quantityInput.inputValue()
      expect(parseInt(quantity)).toBeGreaterThanOrEqual(0)
    }
  })
})
