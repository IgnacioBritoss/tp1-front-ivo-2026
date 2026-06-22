import { test, expect } from '@playwright/test';

test.describe('Quiniela Britos — flujo principal sin login', () => {
  test('la pagina principal carga y muestra el titulo', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Quiniela Britos/);
    await expect(page.locator('h1')).toContainText('Quiniela Britos');
  });

  test('usuario no autenticado ve el boton de login con Google', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('link', { name: /Ingresar con Google/i });
    await expect(loginBtn).toBeVisible();
  });

  test('la tabla de jugadas se inicializa con 3 filas por defecto', async ({ page }) => {
    await page.goto('/');
    // El JS de cliente crea la tabla en DOMContentLoaded
    await expect(page.locator('#tabla tbody tr')).toHaveCount(3);
  });

  test('el boton Jugar ahora esta visible en la interfaz', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Jugar ahora/i })).toBeVisible();
  });

  test('el selector de cantidad de numeros esta presente y acepta input', async ({ page }) => {
    await page.goto('/');
    const inputCantidad = page.locator('#cantidad');
    await expect(inputCantidad).toBeVisible();
    await expect(inputCantidad).toHaveValue('3');
  });

  test('cambiar cantidad de sorteos actualiza el preview de la boleta', async ({ page }) => {
    await page.goto('/');
    const inputSorteos = page.locator('#cantidadSorteos');
    await expect(inputSorteos).toBeVisible();
    await inputSorteos.fill('5');
    // El preview debe reflejar 5 sorteos
    await expect(page.locator('#sorteosBoleta')).toHaveText('5');
  });
});
