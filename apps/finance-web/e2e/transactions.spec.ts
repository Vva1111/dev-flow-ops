import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const panel = (page: Page) => page.getByRole('region', { name: '수입·지출 내역' })

async function fillEntry(page: Page, description: string, amount: string) {
  const form = page.getByRole('form', { name: '수입·지출 등록' })
  await form.getByLabel('금액').fill(amount)
  await form.getByLabel('내역', { exact: true }).fill(description)
  await form.getByLabel('카테고리').fill('확인용')
  return form
}

test.beforeEach(async ({ request }) => {
  // 재사용을 금지한 E2E 전용 서버의 임시 DB만 초기화한다.
  const response = await request.get('/api/transactions')
  expect(response.ok()).toBeTruthy()
  const { data } = await response.json() as { data: { id: number }[] }
  for (const transaction of data) {
    const deleted = await request.delete(`/api/transactions/${transaction.id}`)
    expect(deleted.status()).toBe(204)
  }
})

test('등록·새로고침·수정·삭제와 월별 합계를 연결한다', async ({ page }) => {
  await page.goto('/')
  await expect(panel(page).getByText('등록된 내역이 없습니다. 첫 수입이나 지출을 기록해 보세요.')).toBeVisible()
  await panel(page).getByRole('button', { name: '내역 등록', exact: true }).click()
  const form = await fillEntry(page, '브라우저 지출', '12000')
  await form.getByRole('button', { name: '등록', exact: true }).click()
  const row = panel(page).getByRole('row').filter({ hasText: '브라우저 지출' })
  await expect(row).toContainText('12,000원')
  const expenseCard = page.locator('.summary-card').filter({ hasText: '이번 달 지출' })
  await expect(expenseCard.locator('.metric-amount')).toHaveText('12,000원')
  await page.reload()
  await expect(row).toContainText('12,000원')

  await row.getByRole('button', { name: '브라우저 지출 수정' }).click()
  const editForm = page.getByRole('form', { name: '수입·지출 수정' })
  await editForm.getByLabel('금액').fill('15000')
  await editForm.getByRole('button', { name: '수정 저장' }).click()
  await expect(row).toContainText('15,000원')
  await expect(expenseCard.locator('.metric-amount')).toHaveText('15,000원')

  await row.getByRole('button', { name: '브라우저 지출 삭제' }).click()
  await panel(page).getByRole('button', { name: '취소', exact: true }).click()
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: '브라우저 지출 삭제' }).click()
  await page.route('**/api/transactions/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } })
    } else await route.continue()
  })
  await panel(page).getByRole('button', { name: '삭제 확인' }).click()
  await expect(panel(page).getByText('요청을 처리하지 못했습니다. 다시 시도해 주세요.')).toBeVisible()
  await expect(row).toBeVisible()
  await page.unroute('**/api/transactions/*')
  await panel(page).getByRole('button', { name: '삭제 확인' }).click()
  await expect(row).toHaveCount(0)
  await expect(expenseCard.locator('.metric-amount')).toHaveText('0원')
  await page.reload()
  await expect(panel(page).getByText('등록된 내역이 없습니다. 첫 수입이나 지출을 기록해 보세요.')).toBeVisible()
})

test('수입·지출 필터는 월별 합계를 바꾸지 않는다', async ({ page }) => {
  await page.goto('/')
  await panel(page).getByRole('button', { name: '내역 등록', exact: true }).click()
  const form = await fillEntry(page, '브라우저 수입', '50000')
  await form.getByLabel('종류').selectOption('income')
  await form.getByRole('button', { name: '등록', exact: true }).click()
  await expect(panel(page).getByRole('row').filter({ hasText: '브라우저 수입' })).toBeVisible()
  await panel(page).getByRole('button', { name: '지출', exact: true }).click()
  await expect(panel(page).getByText('선택한 종류의 내역이 없습니다.')).toBeVisible()
  const incomeCard = page.locator('.summary-card').filter({ hasText: '이번 달 수입' })
  await expect(incomeCard.locator('.metric-amount')).toHaveText('50,000원')
  await panel(page).getByRole('button', { name: '수입', exact: true }).click()
  await expect(panel(page).getByRole('row').filter({ hasText: '브라우저 수입' })).toBeVisible()
})

test('잘못된 입력과 저장 실패 후 입력 보존·재시도를 확인한다', async ({ page }) => {
  await page.goto('/')
  await panel(page).getByRole('button', { name: '내역 등록', exact: true }).click()
  const form = await fillEntry(page, '입력 확인', '0')
  await form.getByRole('button', { name: '등록', exact: true }).click()
  expect(await form.getByLabel('금액').evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true)
  await form.getByLabel('금액').fill('12000')
  await form.getByLabel('내역', { exact: true }).fill('   ')
  await form.getByRole('button', { name: '등록', exact: true }).click()
  await expect(form.getByRole('alert')).toHaveText('내역을 입력해 주세요.')
  await form.getByLabel('내역', { exact: true }).fill('재시도 내역')
  await page.route('**/api/transactions', async (route) => {
    if (route.request().method() === 'POST') await route.abort('failed')
    else await route.continue()
  })
  await form.getByRole('button', { name: '등록', exact: true }).click()
  await expect(form.getByRole('alert')).toHaveText('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  await expect(form.getByLabel('내역', { exact: true })).toHaveValue('재시도 내역')
  await expect(form.getByLabel('금액')).toHaveValue('12000')
  await page.unroute('**/api/transactions')
  await form.getByRole('button', { name: '등록', exact: true }).click()
  await expect(panel(page).getByRole('row').filter({ hasText: '재시도 내역' })).toBeVisible()
})

test('조회 실패를 표시하고 새로고침으로 복구한다', async ({ page }) => {
  await page.route('**/api/transactions', (route) => route.abort('failed'))
  await page.goto('/')
  await expect(panel(page).getByRole('alert')).toContainText('서버에 연결하지 못했습니다.')
  await expect(panel(page).getByRole('button', { name: '내역 등록', exact: true })).toBeDisabled()
  await page.unroute('**/api/transactions')
  await panel(page).getByRole('button', { name: '새로고침', exact: true }).click()
  await expect(panel(page).getByText('등록된 내역이 없습니다. 첫 수입이나 지출을 기록해 보세요.')).toBeVisible()
  await expect(panel(page).getByRole('button', { name: '내역 등록', exact: true })).toBeEnabled()
})

test('언어 선택을 새로고침 후에도 유지하고 화면 넘침을 확인한다', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(panel(page).getByRole('button', { name: '내역 등록', exact: true })).toBeEnabled()
  await page.getByRole('combobox', { name: '언어', exact: true }).selectOption('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'Income & expense entries' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Language', exact: true })).toHaveValue('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflowing).toBe(false)
  await testInfo.attach('Finance 영어 화면', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
})
