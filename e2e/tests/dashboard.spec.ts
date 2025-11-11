import { test, expect } from '@playwright/test';

test.describe('PROPER 2.9 Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentication', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');
      
      // Fill in login form
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      
      // Submit form
      await page.click('[data-testid="login-button"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should show user information
      await expect(page.locator('[data-testid="user-name"]')).toContainText('Admin User');
    });

    test('should show error with invalid credentials', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');
      
      // Fill in invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@email.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      // Submit form
      await page.click('[data-testid="login-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Wait for dashboard to load
      await expect(page).toHaveURL('/dashboard');
      
      // Click logout
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should display all key metrics', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Check for key metrics
      await expect(page.locator('[data-testid="total-incidents"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-patrols"]')).toBeVisible();
      await expect(page.locator('[data-testid="security-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="patrol-efficiency"]')).toBeVisible();
    });

    test('should display real-time status indicators', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Check system status
      await expect(page.locator('[data-testid="system-status"]')).toContainText('Online');
      
      // Check WebSocket connection status
      await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');
    });

    test('should display recent activity feed', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Check for recent activity section
      await expect(page.locator('[data-testid="recent-incidents"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-access-events"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-patrols"]')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to all major modules', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Test navigation to each module
      const modules = [
        { name: 'Incidents', path: '/incidents' },
        { name: 'Patrols', path: '/patrols' },
        { name: 'Access Control', path: '/access-control' },
        { name: 'Guest Safety', path: '/guest-safety' },
        { name: 'Analytics', path: '/analytics' },
        { name: 'Settings', path: '/settings' }
      ];
      
      for (const module of modules) {
        await page.click(`text=${module.name}`);
        await expect(page).toHaveURL(module.path);
        
        // Verify module page loads
        await expect(page.locator('h1')).toContainText(module.name);
        
        // Go back to dashboard
        await page.click('text=Dashboard');
        await expect(page).toHaveURL('/dashboard');
      }
    });
  });

  test.describe('Real-time Features', () => {
    test('should receive real-time incident alerts', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Wait for WebSocket connection
      await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');
      
      // Simulate incident alert (this would be triggered by backend)
      await page.evaluate(() => {
        // Simulate WebSocket message
        const event = new CustomEvent('websocket-message', {
          detail: {
            type: 'incident_alert',
            data: {
              incident_id: 'test-incident-123',
              incident_type: 'theft',
              severity: 'high',
              location: 'Parking Lot A'
            }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Should show incident alert notification
      await expect(page.locator('[data-testid="incident-alert"]')).toBeVisible();
      await expect(page.locator('[data-testid="incident-alert"]')).toContainText('theft');
      await expect(page.locator('[data-testid="incident-alert"]')).toContainText('high');
    });

    test('should receive real-time patrol updates', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Wait for WebSocket connection
      await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');
      
      // Simulate patrol update
      await page.evaluate(() => {
        const event = new CustomEvent('websocket-message', {
          detail: {
            type: 'patrol_update',
            data: {
              patrol_id: 'test-patrol-123',
              guard_id: 'guard-456',
              status: 'active',
              current_location: { lat: 40.7128, lng: -74.0060 }
            }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Should show patrol update
      await expect(page.locator('[data-testid="patrol-update"]')).toBeVisible();
      await expect(page.locator('[data-testid="patrol-update"]')).toContainText('active');
    });

    test('should receive unauthorized access alerts', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Wait for WebSocket connection
      await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');
      
      // Simulate unauthorized access
      await page.evaluate(() => {
        const event = new CustomEvent('websocket-message', {
          detail: {
            type: 'unauthorized_access',
            data: {
              access_point: 'Restricted Area',
              attempted_by: 'unknown',
              location: 'Server Room'
            }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Should show unauthorized access alert
      await expect(page.locator('[data-testid="unauthorized-access-alert"]')).toBeVisible();
      await expect(page.locator('[data-testid="unauthorized-access-alert"]')).toContainText('Restricted Area');
    });
  });

  test.describe('Quick Actions', () => {
    test('should trigger emergency response', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Click emergency response button
      await page.click('[data-testid="emergency-response-button"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="emergency-confirmation"]')).toBeVisible();
      
      // Confirm emergency response
      await page.click('[data-testid="confirm-emergency"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="emergency-success"]')).toContainText('Emergency response activated');
    });

    test('should trigger lockdown protocol', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Click lockdown button
      await page.click('[data-testid="lockdown-button"]');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="lockdown-confirmation"]')).toBeVisible();
      
      // Confirm lockdown
      await page.click('[data-testid="confirm-lockdown"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="lockdown-success"]')).toContainText('Lockdown protocol activated');
    });

    test('should create incident report', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Click report incident button
      await page.click('[data-testid="report-incident-button"]');
      
      // Should open incident form
      await expect(page.locator('[data-testid="incident-form"]')).toBeVisible();
      
      // Fill incident details
      await page.fill('[data-testid="incident-title"]', 'Test Incident');
      await page.fill('[data-testid="incident-description"]', 'This is a test incident');
      await page.selectOption('[data-testid="incident-type"]', 'theft');
      await page.selectOption('[data-testid="incident-severity"]', 'medium');
      
      // Submit incident
      await page.click('[data-testid="submit-incident"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="incident-success"]')).toContainText('Incident reported successfully');
    });
  });

  test.describe('AI Features', () => {
    test('should display AI risk assessment', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Check for AI risk assessment section
      await expect(page.locator('[data-testid="ai-risk-assessment"]')).toBeVisible();
      await expect(page.locator('[data-testid="risk-level"]')).toBeVisible();
      await expect(page.locator('[data-testid="risk-factors"]')).toBeVisible();
    });

    test('should display predictive analytics', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Check for predictive analytics section
      await expect(page.locator('[data-testid="predictive-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="incident-forecast"]')).toBeVisible();
      await expect(page.locator('[data-testid="trend-analysis"]')).toBeVisible();
    });

    test('should display patrol optimization', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Check for patrol optimization section
      await expect(page.locator('[data-testid="patrol-optimization"]')).toBeVisible();
      await expect(page.locator('[data-testid="route-efficiency"]')).toBeVisible();
      await expect(page.locator('[data-testid="optimization-recommendations"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Should display mobile navigation
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Should show hamburger menu
      await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
      
      // Click hamburger menu
      await page.click('[data-testid="hamburger-menu"]');
      
      // Should show mobile navigation menu
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Should display properly on tablet
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      
      // Should show navigation sidebar
      await expect(page.locator('[data-testid="navigation-sidebar"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Wait for dashboard to load
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'admin@hotel.com');
      await page.fill('[data-testid="password-input"]', 'securepassword123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to incidents page with large dataset
      await page.click('text=Incidents');
      
      // Should load incidents efficiently
      await expect(page.locator('[data-testid="incidents-table"]')).toBeVisible();
      
      // Should support pagination
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    });
  });
}); 