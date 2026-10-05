import { expect, test } from '@playwright/test';

test('compares boundaries and inspects a timed three-boat response', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('link', { name: 'Research prototype: compare luffing analyses' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Does Situation need the moving scene?',
  );
  await expect(page.getByTestId('assessment-status')).toHaveText(
    'A model response is available',
  );
  await expect(
    page.getByText('These are hull-clearance experiments', { exact: false }),
  ).toBeVisible();
  const encounter = page.getByRole('combobox', {
    name: 'Encounter',
    exact: true,
  });
  await encounter.selectOption('three-close');
  await expect(page.getByTestId('assessment-status')).toHaveText(
    'No certified response in the tested set',
  );
  await expect(
    page.getByTestId('pair-evidence').getByRole('listitem'),
  ).toHaveCount(3);
  await encounter.selectOption('three-open');
  await expect(page.getByTestId('assessment-status')).toHaveText(
    'A model response is available',
  );
  await expect(page.getByTestId('boundary-agreement')).toHaveText(
    'Both interfaces agree.',
  );
  const diagram = page.getByTestId('luff-diagram');
  await expect(diagram).toHaveAttribute('data-wind-from', '0');
  await expect(page.getByTestId('experiment-boat-L')).toHaveAttribute(
    'data-heading',
    '300',
  );
  await expect(page.getByTestId('experiment-boat-L')).toHaveAttribute(
    'data-x',
    '5',
  );
  await expect(page.getByTestId('experiment-boat-L')).toHaveAttribute(
    'data-y',
    '1.4',
  );
  await expect(diagram.locator('[data-tack="starboard"]')).toHaveCount(3);
  for (const footprint of await diagram
    .getByTestId('evaluated-footprint')
    .all()) {
    await expect(footprint).toHaveAttribute('height', '1');
    await expect(footprint).toHaveAttribute('width', '0.4');
  }
  await expect(diagram).toHaveScreenshot('three-boat-response.png', {
    maxDiffPixelRatio: 0.015,
  });
  const time = page.getByRole('slider');
  await time.focus();
  await time.press('End');
  await expect(page.getByTestId('time-value')).toHaveText('5.00 s');
  for (const boat of ['L', 'M', 'W']) {
    expect(
      Number(
        await page
          .getByTestId(`experiment-boat-${boat}`)
          .getAttribute('data-heading'),
      ),
    ).toBeCloseTo(345);
  }
  await page
    .getByRole('combobox', { name: 'Response combination', exact: true })
    .selectOption({ index: 0 });
  await expect(page.getByTestId('pair-evidence')).toContainText(
    'Model hulls intersect',
  );
  await encounter.selectOption('two-abrupt');
  await expect(page.getByTestId('time-value')).toHaveText('0.00 s');
  await expect(page.getByTestId('experiment-boat-W')).toHaveCount(0);
  await expect(page.getByTestId('assessment-status')).toHaveText(
    'No certified response in the tested set',
  );
  expect(errors).toEqual([]);
});

test('keeps controls reachable on narrow portrait and landscape screens', async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/experiments/luffing');
    await page
      .getByRole('combobox', { name: 'Encounter', exact: true })
      .selectOption('three-open');
    for (const control of [
      page.getByRole('combobox', { name: 'Encounter', exact: true }),
      page.getByRole('combobox', { name: 'Response combination', exact: true }),
      page.getByRole('slider'),
    ]) {
      await control.scrollIntoViewIfNeeded();
      const box = await control.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);
  }
});
