import { test, expect } from '@playwright/test';

test('registered customer sends site chat and admin replies from the inbox', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Çat üçün hesabınıza daxil olun' }).click();
  await expect(page).toHaveURL(/\/account/);

  const registration = await page.request.post('/api/customer/register', {
    data: {
      fullName: 'Çat Test Müştərisi',
      phone: '501234567',
      birthDate: '1991-05-14',
      password: 'StrongPassword123',
      termsAccepted: true,
    },
  });
  expect(registration.status()).toBe(201);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Saytdaxili çatı aç' })).toBeVisible();
  await page.getByRole('button', { name: 'Saytdaxili çatı aç' }).click();
  const chat = page.getByRole('dialog', { name: 'Sahara saytdaxili çat' });
  await expect(chat).toBeVisible();
  await chat
    .getByRole('textbox', { name: 'Çat mesajı' })
    .fill('Sifarişim haqqında məlumat istəyirəm');
  await chat.getByRole('button', { name: 'Mesajı göndər' }).click();
  await expect(chat.getByText('Sifarişim haqqında məlumat istəyirəm')).toBeVisible();
  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/gVUAAAAASUVORK5CYII=',
    'base64'
  );
  await chat
    .locator('input[type="file"]')
    .setInputFiles({ name: 'chat-photo.png', mimeType: 'image/png', buffer: onePixelPng });
  await expect(chat.getByAltText('Çat şəkli')).toBeVisible();
  await chat.getByRole('button', { name: 'Səs yaz', exact: true }).click();
  await expect(chat.getByRole('button', { name: 'Səs yazısını dayandır' })).toBeVisible();
  await page.waitForTimeout(300);
  await chat.getByRole('button', { name: 'Səs yazısını dayandır' }).click();
  await expect(chat.locator('audio[aria-label="Səsli mesaj"]')).toBeVisible();

  const adminLogin = await page.request.post('/api/admin/login', {
    data: { password: 'TestAdmin2026!' },
  });
  expect(adminLogin.ok()).toBe(true);
  await page.goto('/AdministratorNT');
  await page.getByRole('button', { name: 'Müştəri çatı' }).click();
  const inbox = page.getByRole('region', { name: 'Müştəri çatları' });
  await expect(inbox.getByText('Çat Test Müştərisi')).toBeVisible();
  await inbox.getByRole('button', { name: /Çat Test Müştərisi/ }).click();
  await expect(
    inbox.locator('.admin-support-messages').getByText('Sifarişim haqqında məlumat istəyirəm')
  ).toBeVisible();
  await inbox
    .getByRole('textbox', { name: 'Müştəriyə cavab' })
    .fill('Sualınızı aldıq, sizə cavab verəcəyik.');
  await inbox.getByRole('button', { name: 'Göndər', exact: true }).click();
  await expect(inbox.getByText('Sualınızı aldıq, sizə cavab verəcəyik.')).toBeVisible();
  await inbox
    .locator('input[type="file"]')
    .setInputFiles({ name: 'admin-photo.png', mimeType: 'image/png', buffer: onePixelPng });
  await expect(inbox.getByAltText('Müştərinin göndərdiyi şəkil')).toHaveCount(2);

  await page.goto('/account');
  await page.getByRole('button', { name: 'Saytdaxili çatı aç' }).click();
  await expect(
    page
      .getByRole('dialog', { name: 'Sahara saytdaxili çat' })
      .getByText('Sualınızı aldıq, sizə cavab verəcəyik.')
  ).toBeVisible();
});

test('account form rejects wrong password and restores server session after valid login', async ({
  page,
}) => {
  const registration = await page.request.post('/api/customer/register', {
    data: {
      fullName: 'Giriş Testi',
      phone: '551122334',
      birthDate: '1988-04-15',
      password: 'CorrectPassword123',
      termsAccepted: true,
    },
  });
  expect(registration.status()).toBe(201);
  const session = await registration.json();
  expect(
    (
      await page.request.post('/api/customer/logout', {
        headers: { 'X-CSRF-Token': session.csrfToken },
        data: {},
      })
    ).ok()
  ).toBe(true);
  await page.goto('/account');
  await page.getByPlaceholder('Məs: 50 123 45 67 və ya email@example.com').fill('551122334');
  await page.getByPlaceholder('Şifrənizi daxil edin').fill('WrongPassword123');
  await page.locator('.account-auth-card form').getByRole('button', { name: 'Daxil Ol' }).click();
  await expect(
    page.getByText('Daxil etdiyiniz məlumatlar düzgün deyil. Zəhmət olmasa yenidən yoxlayın.')
  ).toBeVisible();
  await page.getByPlaceholder('Şifrənizi daxil edin').fill('CorrectPassword123');
  await page.locator('.account-auth-card form').getByRole('button', { name: 'Daxil Ol' }).click();
  await expect(page.getByRole('heading', { name: 'Giriş Testi' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Giriş Testi' })).toBeVisible();
});
