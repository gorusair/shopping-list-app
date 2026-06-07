# 쇼핑 리스트 앱

localStorage 기반의 심플한 쇼핑 리스트 웹 앱입니다.

## 기능

- 아이템 추가 (버튼 클릭 또는 Enter 키)
- 체크박스로 완료 표시 / 해제
- 아이템 개별 삭제
- 완료된 항목 일괄 삭제
- 통계 표시 (전체 / 완료 개수)
- localStorage로 새로고침 후에도 데이터 유지

## 사용법

`shopping-list.html` 파일을 브라우저에서 열면 바로 사용할 수 있습니다.

## 테스트 실행

```bash
npm install
node test-shopping.js
```

Playwright를 사용한 E2E 테스트가 실행됩니다.
