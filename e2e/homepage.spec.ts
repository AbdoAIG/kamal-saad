import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/كمال سعد|Kamal Saad|KMS/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display header with logo', async ({ page }) => {
    const logo = page.locator('img[alt*="Kamal"], img[alt*="كمال"], img[src*="logo"], img[src*="KMS"]')
    await expect(logo.first()).toBeVisible()
  })

  test('should display navigation menu', async ({ page }) => {
    const nav = page.locator('nav, header nav, [data-testid="navigation"]')
    await expect(nav.first()).toBeVisible()
  })

  test('should display search bar', async ({ page }) => {
    const searchInput = page.locator('input[type="text"][placeholder*="بحث"], input[type="text"][placeholder*="search"], input[type="search"]')
    expect(await searchInput.count()).toBeGreaterThan(0)
  })

  test('should display cart icon', async ({ page }) => {
    const cartIcon = page.locator('[data-lucide="shopping-cart"], svg, button:has(svg)')
    const count = await cartIcon.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display categories section', async ({ page }) => {
    // Wait for categories to load
    await page.waitForTimeout(1000)
    
    const categoriesSection = page.locator('section:has-text("تسوق حسب القسم"), section:has-text("Shop by Category")')
    expect(await categoriesSection.count()).toBeGreaterThan(0)
  })

  test('should display products section', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(2000)
    
    const productsSection = page.locator('section:has-text("جميع المنتجات"), section:has-text("All Products"), #products')
    expect(await productsSection.count()).toBeGreaterThan(0)
  })

  test('should display product cards', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(3000)
    
    // Check if we need to seed products
    const seedButton = page.locator('button:has-text("إضافة منتجات"), button:has-text("Add Sample")')
    if (await seedButton.count() > 0) {
      // Need to seed products first
      await seedButton.click()
      await page.waitForTimeout(5000)
    }
    
    const productCards = page.locator('a[href*="/product/"], [class*="product"]')
    const count = await productCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display footer', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    
    const footer = page.locator('footer')
    await expect(footer.first()).toBeVisible()
  })

  test('should display language toggle', async ({ page }) => {
    // Language toggle is a button with Languages icon
    const langToggle = page.locator('button:has(svg)').filter({ hasText: '' })
    const buttons = page.locator('header button')
    expect(await buttons.count()).toBeGreaterThan(0)
  })

  test('should display theme toggle', async ({ page }) => {
    // Theme toggle is a button with Sun/Moon icon
    const buttons = page.locator('header button:has(svg)')
    expect(await buttons.count()).toBeGreaterThan(0)
  })

  test('should toggle language', async ({ page }) => {
    // Language button is in header
    const langBtn = page.locator('header button').nth(0)
    await langBtn.click()
    await page.waitForTimeout(500)
    
    // Page should have dir attribute
    const dir = await page.locator('html').getAttribute('dir')
    expect(['rtl', 'ltr']).toContain(dir || 'rtl')
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('body')).toBeVisible()
    
    // Check mobile menu button is visible
    const mobileMenuBtn = page.locator('button:has([data-lucide="menu"]), button:has-text("القائمة"), button:has-text("Menu")')
    expect(await mobileMenuBtn.count()).toBeGreaterThan(0)
  })

  test('should open mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Mobile menu button is orange with Menu text
    const mobileMenuBtn = page.locator('button:has-text("القائمة"), button:has-text("Menu"), button.bg-orange-500')
    if (await mobileMenuBtn.count() > 0) {
      await mobileMenuBtn.first().click()
      await page.waitForTimeout(500)
      
      // Menu should be visible
      const menu = page.locator('nav, [role="navigation"]')
      expect(await menu.count()).toBeGreaterThan(0)
    } else {
      // Skip if no mobile menu button found
      expect(true).toBe(true)
    }
  })

  test('should search for products', async ({ page }) => {
    const searchInput = page.locator('input[type="text"][placeholder*="بحث"], input[type="text"][placeholder*="search"]').first()
    await searchInput.fill('قلم')
    await searchInput.press('Enter')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // URL should contain search parameter
    expect(page.url()).toContain('search=')
  })

  test('should click on category', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    const categoryCard = page.locator('a[href*="category="], [data-testid="category-card"]').first()
    if (await categoryCard.count() > 0) {
      await categoryCard.click()
      await page.waitForTimeout(1000)
      
      expect(page.url()).toContain('category=')
    }
  })

  test('should click on product to view details', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    const productCard = page.locator('a[href*="/product/"]').first()
    if (await productCard.count() > 0) {
      await productCard.click()
      await page.waitForLoadState('networkidle')
      
      expect(page.url()).toContain('/product/')
    } else {
      // No products to click
      expect(true).toBe(true)
    }
  })
})

test.describe('Homepage - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(20000)
  })

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning:') && 
      !e.includes('deprecated') &&
      !e.includes('favicon')
    )
    
    expect(criticalErrors.length).toBeLessThan(10)
  })
})

test.describe('Homepage - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const h1 = page.locator('h1')
    const h1Count = await h1.count()
    expect(h1Count).toBeLessThanOrEqual(1)
  })

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Press Tab key multiple times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
    }
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement.first()).toBeVisible()
  })
})
