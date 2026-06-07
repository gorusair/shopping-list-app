const { chromium } = require('playwright');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, 'shopping-list.html');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

async function clearStorage(page) {
  await page.evaluate(() => localStorage.removeItem('shopping'));
  await page.reload();
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();
  await page.goto(FILE_URL);
  await clearStorage(page);

  // ──────────────────────────────────────────────
  console.log('\n📋 [1] 초기 상태 확인');
  // ──────────────────────────────────────────────
  const emptyMsg = await page.locator('#empty').isVisible();
  assert(emptyMsg, '빈 상태 메시지 표시');

  const itemCount = await page.locator('.item').count();
  assert(itemCount === 0, '아이템 0개');

  // ──────────────────────────────────────────────
  console.log('\n➕ [2] 아이템 추가 테스트');
  // ──────────────────────────────────────────────

  // 버튼으로 추가
  await page.fill('#itemInput', '사과');
  await page.click('button:has-text("추가")');
  let count = await page.locator('.item').count();
  assert(count === 1, '버튼으로 아이템 추가');

  // Enter 키로 추가
  await page.fill('#itemInput', '바나나');
  await page.press('#itemInput', 'Enter');
  count = await page.locator('.item').count();
  assert(count === 2, 'Enter 키로 아이템 추가');

  // 빈 입력 무시
  await page.fill('#itemInput', '   ');
  await page.click('button:has-text("추가")');
  count = await page.locator('.item').count();
  assert(count === 2, '빈 입력은 추가되지 않음');

  // 입력창 비워지는지
  const inputVal = await page.inputValue('#itemInput');
  assert(inputVal.trim() === '', '추가 후 입력창 초기화');

  // 세 번째 아이템 추가
  await page.fill('#itemInput', '우유');
  await page.press('#itemInput', 'Enter');
  count = await page.locator('.item').count();
  assert(count === 3, '세 번째 아이템 추가');

  // ──────────────────────────────────────────────
  console.log('\n✔️  [3] 체크(완료) 기능 테스트');
  // ──────────────────────────────────────────────

  // 첫 번째 항목 체크
  await page.locator('.item').first().locator('.checkbox').click();
  const isChecked = await page.locator('.item').first().locator('.checkbox').getAttribute('class');
  assert(isChecked.includes('checked'), '체크박스 체크됨');

  const isDone = await page.locator('.item').first().locator('.item-text').getAttribute('class');
  assert(isDone.includes('done'), '텍스트에 취소선 스타일 적용');

  // 통계 표시 확인
  const statsText = await page.locator('#stats').innerText();
  assert(statsText.includes('1개 완료'), '통계: 1개 완료 표시');

  // "완료된 항목 삭제" 버튼 노출
  const clearDoneVisible = await page.locator('#clearDoneBtn').isVisible();
  assert(clearDoneVisible, '"완료된 항목 삭제" 버튼 표시');

  // 다시 클릭하면 체크 해제
  await page.locator('.item').first().locator('.checkbox').click();
  const isUnchecked = await page.locator('.item').first().locator('.checkbox').getAttribute('class');
  assert(!isUnchecked.includes('checked'), '체크박스 해제됨');

  // ──────────────────────────────────────────────
  console.log('\n🗑️  [4] 아이템 삭제 테스트');
  // ──────────────────────────────────────────────

  // 첫 번째 항목의 이름 확인 후 삭제
  const firstText = await page.locator('.item').first().locator('.item-text').innerText();
  await page.locator('.item').first().locator('.delete-btn').click();
  count = await page.locator('.item').count();
  assert(count === 2, `"${firstText}" 삭제 후 2개 남음`);

  // 또 삭제
  await page.locator('.item').first().locator('.delete-btn').click();
  count = await page.locator('.item').count();
  assert(count === 1, '두 번째 삭제 후 1개 남음');

  // 마지막 항목 삭제 → 빈 상태 복귀
  await page.locator('.item').first().locator('.delete-btn').click();
  count = await page.locator('.item').count();
  assert(count === 0, '마지막 아이템 삭제');
  const emptyAgain = await page.locator('#empty').isVisible();
  assert(emptyAgain, '빈 상태 메시지 재표시');

  // ──────────────────────────────────────────────
  console.log('\n🧹 [5] "완료 항목 일괄 삭제" 테스트');
  // ──────────────────────────────────────────────

  await page.fill('#itemInput', '딸기'); await page.press('#itemInput', 'Enter');
  await page.fill('#itemInput', '포도'); await page.press('#itemInput', 'Enter');
  await page.fill('#itemInput', '망고'); await page.press('#itemInput', 'Enter');

  // 두 개 체크
  const items = page.locator('.item');
  await items.nth(0).locator('.checkbox').click();
  await items.nth(1).locator('.checkbox').click();

  count = await page.locator('.item').count();
  assert(count === 3, '일괄 삭제 전 3개');

  await page.locator('#clearDoneBtn').click();
  count = await page.locator('.item').count();
  assert(count === 1, '완료 2개 삭제 → 1개 남음');

  const clearDoneHidden = await page.locator('#clearDoneBtn').isVisible();
  assert(!clearDoneHidden, '완료 항목 없으면 버튼 숨김');

  // ──────────────────────────────────────────────
  console.log('\n💾 [6] localStorage 유지 테스트');
  // ──────────────────────────────────────────────

  await page.fill('#itemInput', '지속 아이템'); await page.press('#itemInput', 'Enter');
  count = await page.locator('.item').count();
  const beforeReload = count;

  await page.reload();
  count = await page.locator('.item').count();
  assert(count === beforeReload, `새로고침 후에도 ${beforeReload}개 유지`);

  // ──────────────────────────────────────────────
  console.log('\n' + '─'.repeat(40));
  console.log(`결과: ${passed}개 통과 / ${failed}개 실패`);
  if (failed === 0) {
    console.log('모든 테스트 통과! ');
  } else {
    console.log('일부 테스트 실패. 위 로그를 확인하세요.');
  }
  console.log('─'.repeat(40) + '\n');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();