import { test, expect } from '@playwright/test'
import { generateRandomEmail, openAuthModal, loginAsAdmin } from '../helpers/test-helpers'

test.describe('Authentication', () => {
  test.describe('Auth Modal', () => {
    test('should open login modal from header', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Click on login button
      const loginButton = page.locator('button:has-text("تسجيل الدخول"), button:has-text("Sign In"), button:has-text("login")').first()
      await loginButton.click()
      await page.waitForTimeout(500)
      
      // Verify modal is visible
      const modal = page.locator('[role="dialog"], .dialog-content')
      await expect(modal.first()).toBeVisible()
    })

    test('should display login form in modal', async ({ page }) => {
      await openAuthModal(page, 'login')
      
      // Check for email input
      const emailInput = page.locator('input[type="email"], input#login-email').first()
      await expect(emailInput).toBeVisible()
      
      // Check for password input
      const passwordInput = page.locator('input[type="password"], input#login-password').first()
      await expect(passwordInput).toBeVisible()
      
      // Check for submit button
      const submitBtn = page.locator('button[type="submit"]:has-text("تسجيل الدخول"), button[type="submit"]:has-text("Sign In")').first()
      await expect(submitBtn).toBeVisible()
    })

    test('should switch to register tab', async ({ page }) => {
      await openAuthModal(page, 'login')
      
      // Click on register tab
      const registerTab = page.locator('button:has-text("حساب جديد"), button:has-text("Sign Up")').first()
      await registerTab.click()
      await page.waitForTimeout(300)
      
      // Check for name input in register form
      const nameInput = page.locator('input#register-name, input[name="name"]').first()
      await expect(nameInput).toBeVisible()
    })

    test('should display Google login button', async ({ page }) => {
      await openAuthModal(page, 'login')
      
      const googleBtn = page.locator('button:has-text("Google"), button:has-text("جوجل")')
      expect(await googleBtn.count()).toBeGreaterThan(0)
    })
  })

  test.describe('Login Flow', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      await openAuthModal(page, 'login')
      
      // Fill invalid credentials
      await page.locator('input[type="email"], input#login-email').first().fill('invalid@example.com')
      await page.locator('input[type="password"], input#login-password').first().fill('wrongpassword')
      await page.locator('button[type="submit"]:has-text("تسجيل الدخول"), button[type="submit"]:has-text("Sign In")').first().click()
      
      await page.waitForTimeout(2000)
      
      // Check for error message
      const errorMessage = page.locator('.text-red-500, [data-testid="error"], text=/فشل|failed|error/i')
      const errorCount = await errorMessage.count()
      expect(errorCount).toBeGreaterThan(0)
    })

    test('should validate email format', async ({ page }) => {
      await openAuthModal(page, 'login')
      
      const emailInput = page.locator('input[type="email"], input#login-email').first()
      await emailInput.fill('notanemail')
      await page.locator('button[type="submit"]:has-text("تسجيل الدخول"), button[type="submit"]:has-text("Sign In")').first().click()
      
      // Check HTML5 validation
      const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
      expect(isValid).toBe(false)
    })

    test('should show password visibility toggle', async ({ page }) => {
      await openAuthModal(page, 'login')
      
      const passwordInput = page.locator('input[type="password"], input#login-password').first()
      await expect(passwordInput).toBeVisible()
      
      // Check for eye icon (visibility toggle)
      const eyeIcon = page.locator('button:has(svg), [data-lucide="eye"], [data-lucide="eye-off"]')
      const iconCount = await eyeIcon.count()
      expect(iconCount).toBeGreaterThan(0)
    })
  })

  test.describe('Register Flow', () => {
    test('should display registration form', async ({ page }) => {
      await openAuthModal(page, 'register')
      
      // Check for all registration fields
      const nameInput = page.locator('input#register-name, input[name="name"]').first()
      await expect(nameInput).toBeVisible()
      
      const emailInput = page.locator('input#register-email, input[type="email"]').first()
      await expect(emailInput).toBeVisible()
      
      const passwordInput = page.locator('input#register-password, input[type="password"]').first()
      await expect(passwordInput).toBeVisible()
    })

    test('should register new user', async ({ page }) => {
      const randomEmail = generateRandomEmail()
      
      await openAuthModal(page, 'register')
      
      // Fill registration form
      await page.locator('input#register-name, input[name="name"]').first().fill('Test User')
      await page.locator('input#register-email, input[type="email"]').first().fill(randomEmail)
      await page.locator('input#register-password, input[type="password"]').first().fill('TestPassword123!')
      await page.locator('button[type="submit"]:has-text("إنشاء حساب"), button[type="submit"]:has-text("Create Account")').first().click()
      
      await page.waitForTimeout(3000)
      
      // Should redirect or close modal after successful registration
      const modal = page.locator('[role="dialog"], .dialog-content')
      const modalVisible = await modal.count()
      expect(modalVisible).toBe(0)
    })
  })

  test.describe('Protected Routes', () => {
    test('should require login for admin routes', async ({ page }) => {
      await page.goto('/admin')
      await page.waitForTimeout(2000)
      
      // Should redirect to home or show unauthorized
      const url = page.url()
      expect(url).not.toContain('/admin')
    })

    test('should require login for profile page', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForTimeout(2000)
      
      // Should redirect to home
      const url = page.url()
      expect(url.includes('login') || url === 'http://localhost:3000/' || url.includes('auth')).toBeTruthy()
    })
  })

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await loginAsAdmin(page)
      
      // Wait for user menu to be visible
      await page.waitForTimeout(1000)
      
      // Click on user dropdown
      const userMenu = page.locator('button:has-text("Super Admin"), button:has-text("admin"), [data-testid="user-menu"]').first()
      if (await userMenu.count() > 0) {
        await userMenu.click()
        await page.waitForTimeout(300)
        
        // Click logout
        const logoutBtn = page.locator('text=/تسجيل الخروج|Logout|Sign out/i').first()
        if (await logoutBtn.count() > 0) {
          await logoutBtn.click()
          await page.waitForTimeout(2000)
          
          // Verify logged out
          const loginBtn = page.locator('button:has-text("تسجيل الدخول"), button:has-text("Sign In")')
          expect(await loginBtn.count()).toBeGreaterThan(0)
        }
      }
    })
  })
})
