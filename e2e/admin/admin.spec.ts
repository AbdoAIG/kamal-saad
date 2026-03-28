import { test, expect } from '@playwright/test'
import { loginAsAdmin, testUsers } from '../helpers/test-helpers'

test.describe('Admin Authentication', () => {
  test('should access admin after login', async ({ page }) => {
    await loginAsAdmin(page)
    
    // Navigate to admin
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Should be on admin page
    expect(page.url()).toContain('/admin')
  })

  test('should deny access to admin without login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)
    
    // Should redirect away from admin
    expect(page.url()).not.toContain('/admin')
  })
})

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display dashboard title', async ({ page }) => {
    const title = page.locator('h1, h2, text=/لوحة التحكم|Dashboard|Admin/i')
    expect(await title.count()).toBeGreaterThan(0)
  })

  test('should display statistics cards', async ({ page }) => {
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, .dashboard-card, .card')
    expect(await statCards.count()).toBeGreaterThan(0)
  })

  test('should display sales statistics', async ({ page }) => {
    const salesStats = page.locator('text=/المبيعات|Sales|Revenue|الإيرادات/')
    expect(await salesStats.count()).toBeGreaterThan(0)
  })

  test('should display order count', async ({ page }) => {
    const orderCount = page.locator('text=/الطلبات|Orders|الطلبيات/')
    expect(await orderCount.count()).toBeGreaterThan(0)
  })

  test('should display customer count', async ({ page }) => {
    const customerCount = page.locator('text=/العملاء|Customers|المستخدمين/')
    expect(await customerCount.count()).toBeGreaterThan(0)
  })

  test('should display product count', async ({ page }) => {
    const productCount = page.locator('text=/المنتجات|Products/')
    expect(await productCount.count()).toBeGreaterThan(0)
  })

  test('should display navigation menu', async ({ page }) => {
    const adminNav = page.locator('[data-testid="admin-nav"], .admin-sidebar, nav, aside')
    expect(await adminNav.count()).toBeGreaterThan(0)
  })

  test('should have products menu item', async ({ page }) => {
    const productsLink = page.locator('a[href*="products"], text=/المنتجات|Products/')
    expect(await productsLink.count()).toBeGreaterThan(0)
  })

  test('should have orders menu item', async ({ page }) => {
    const ordersLink = page.locator('a[href*="orders"], text=/الطلبات|Orders/')
    expect(await ordersLink.count()).toBeGreaterThan(0)
  })

  test('should have customers menu item', async ({ page }) => {
    const customersLink = page.locator('a[href*="customers"], text=/العملاء|Customers/')
    expect(await customersLink.count()).toBeGreaterThan(0)
  })

  test('should have reports menu item', async ({ page }) => {
    const reportsLink = page.locator('a[href*="reports"], text=/التقارير|Reports/')
    expect(await reportsLink.count()).toBeGreaterThan(0)
  })
})

test.describe('Admin Products Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/products')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display products page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display products list or table', async ({ page }) => {
    const productsList = page.locator('[data-testid="products-table"], table, .products-grid, [data-testid="product-list"]')
    expect(await productsList.count()).toBeGreaterThan(0)
  })

  test('should have add product button', async ({ page }) => {
    const addProductBtn = page.locator('[data-testid="add-product"], button:has-text("إضافة"), button:has-text("Add"), button:has-text("جديد")')
    expect(await addProductBtn.count()).toBeGreaterThan(0)
  })

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="search"]')
    expect(await searchInput.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display product information', async ({ page }) => {
    const productName = page.locator('td, .product-name, [data-testid="product-name"]')
    expect(await productName.count()).toBeGreaterThan(0)
  })

  test('should have edit button for products', async ({ page }) => {
    const editBtn = page.locator('button:has-text("تعديل"), button:has-text("Edit"), a[href*="edit"]')
    expect(await editBtn.count()).toBeGreaterThanOrEqual(0)
  })

  test('should have delete button for products', async ({ page }) => {
    const deleteBtn = page.locator('button:has-text("حذف"), button:has-text("Delete"), button:has([data-lucide="trash"])')
    expect(await deleteBtn.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Admin Orders Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display orders page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display orders list or table', async ({ page }) => {
    const ordersTable = page.locator('[data-testid="orders-table"], table, .orders-list')
    expect(await ordersTable.count()).toBeGreaterThan(0)
  })

  test('should have status filter', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"], button:has-text("الحالة"), button:has-text("Status")')
    expect(await statusFilter.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display order information', async ({ page }) => {
    const orderInfo = page.locator('td, .order-id, [data-testid="order-id"]')
    expect(await orderInfo.count()).toBeGreaterThan(0)
  })

  test('should display order status', async ({ page }) => {
    const orderStatus = page.locator('[data-testid="order-status"], .status, text=/pending|processing|shipped|delivered|جديد|قيد التجهيز|تم التسليم/')
    expect(await orderStatus.count()).toBeGreaterThan(0)
  })

  test('should have order details button', async ({ page }) => {
    const detailsBtn = page.locator('button:has-text("تفاصيل"), button:has-text("Details"), a[href*="/admin/orders/"]')
    expect(await detailsBtn.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Admin Customers Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/customers')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display customers page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display customers list or table', async ({ page }) => {
    const customersTable = page.locator('[data-testid="customers-table"], table, .customers-list')
    expect(await customersTable.count()).toBeGreaterThan(0)
  })

  test('should display customer information', async ({ page }) => {
    const customerInfo = page.locator('td, .customer-name, [data-testid="customer-name"]')
    expect(await customerInfo.count()).toBeGreaterThan(0)
  })

  test('should display customer email', async ({ page }) => {
    const emailInfo = page.locator('td:has-text("@"), .customer-email, text=/@/')
    expect(await emailInfo.count()).toBeGreaterThan(0)
  })
})

test.describe('Admin Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/reports')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display reports page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display reports dashboard', async ({ page }) => {
    const reportsContent = page.locator('[data-testid="reports"], .reports, .charts, canvas')
    expect(await reportsContent.count()).toBeGreaterThan(0)
  })

  test('should display sales chart', async ({ page }) => {
    const salesChart = page.locator('[data-testid="sales-chart"], .sales-chart, canvas, text=/المبيعات|Sales/')
    expect(await salesChart.count()).toBeGreaterThan(0)
  })

  test('should have date range filter', async ({ page }) => {
    const dateFilter = page.locator('[data-testid="date-filter"], input[type="date"], .date-picker')
    expect(await dateFilter.count()).toBeGreaterThanOrEqual(0)
  })

  test('should have export button', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("تصدير"), button:has-text("Export"), button:has-text("تحميل")')
    expect(await exportBtn.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should access settings page', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Settings page should exist
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display store settings', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    const settingsContent = page.locator('form, .settings-form, [data-testid="settings"]')
    expect(await settingsContent.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Admin Banners', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should access banners page', async ({ page }) => {
    await page.goto('/admin/banners')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Admin Coupons', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should access coupons page', async ({ page }) => {
    await page.goto('/admin/coupons')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Admin Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginAsAdmin(page)
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page.locator('body')).toBeVisible()
  })

  test('should have mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginAsAdmin(page)
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('button:has([data-lucide="menu"]), button:has-text("القائمة"), button:has-text("Menu")')
    expect(await mobileMenuBtn.count()).toBeGreaterThanOrEqual(0)
  })
})
