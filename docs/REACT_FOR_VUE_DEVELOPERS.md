# Vue 개발자를 위한 React 학습 가이드

## 1. 이 문서의 목표와 사용법

Vue와 TypeScript로 개발해 온 개발자가 DevFlowOps를 만들면서 React를 익히기 위한 문서다. AI가 구현을 도와주는 상황을 전제로 하며, 생성된 코드를 읽고 변경 이유와 동작을 직접 판단하는 능력을 목표로 한다.

Vue 예제는 Vue 3 Composition API와 `<script setup>`에 익숙하다고 가정한다. Options API를 사용해 왔다면 `data`는 상태, `computed`는 파생 값, `methods`는 이벤트 처리라는 역할부터 연결하면 된다. TypeScript, HTTP, CSS, 모노레포와 CI/CD 경험은 그대로 활용할 수 있다.

학습은 다음 순서로 진행한다. 모든 React API를 먼저 외울 필요는 없다.

1. 현재 Finance 코드를 읽고 상태 변경부터 화면 갱신까지 설명한다.
2. 한 번에 하나의 작은 변경을 AI와 함께 구현한다.
3. 실행 전에 결과를 예상하고 실제 동작과 비교한다.
4. 변경된 줄을 직접 설명하고 비슷한 변경을 스스로 해 본다.

실제 파일 설명과 별도 학습 예제를 구분해 읽는다. 연습 완료 여부는 구현 여부와 별개다. React 구현이 추가되거나 패턴이 바뀌면 관련 파일, Vue와의 비교, 상태 흐름과 선택 이유를 이 문서에 함께 반영한다. DevFlowOps의 목표는 프론트엔드 개발·검증·배포·품질 검증 흐름을 자동화하는 플랫폼이며, Finance는 이를 검증하는 첫 앱이다.

## 2. 현재 저장소에서 시작할 위치

실제 코드 설명의 기준일은 2026-11-13이다. 초기 샘플 화면에서 API 기반 CRUD, custom Hook, 다국어와 브라우저 E2E로 확장된 흐름을 반영했다. 앱별 구현 상태는 [개발 진행 현황](DEVELOPMENT_STATUS.md), 실행 결과는 [검증 기록](DEVELOPMENT_GUIDE.md#6-현재-검증-상태)을 따른다.

| 파일 | 읽으면서 확인할 내용 |
|---|---|
| [`finance-web/src/main.tsx`](../apps/finance-web/src/main.tsx) | `createRoot`, `StrictMode`, 앱과 전역 CSS 연결 |
| [`finance-web/src/app/App.tsx`](../apps/finance-web/src/app/App.tsx) | 거래 상태 소유, 월별 파생 합계와 샘플 영역의 구분 |
| [`finance-web/src/app/App.css`](../apps/finance-web/src/app/App.css) | JSX의 `className`과 스타일 연결 |
| [`platform-web/src/app/App.tsx`](../apps/platform-web/src/app/App.tsx) | 앱 선택 state, 파생 값과 미연결 상태 표시 |
| [`useTransactions.ts`](../apps/finance-web/src/features/transactions/useTransactions.ts) | custom Hook, 비동기 조회, cleanup과 중복 요청 방지 |
| [`TransactionsPanel.tsx`](../apps/finance-web/src/features/transactions/TransactionsPanel.tsx) | 필터·폼·삭제 확인 상태와 콜백 props |
| [`TransactionForm.tsx`](../apps/finance-web/src/features/transactions/TransactionForm.tsx) | 제어 입력, 검증과 실패 시 입력 보존 |
| [`api.ts`](../apps/finance-web/src/features/transactions/api.ts) | React와 분리된 HTTP 처리와 오류 키 |
| [`Finance i18n`](../apps/finance-web/src/i18n/index.ts) | 초기화, 언어 저장과 문서 lang 동기화 |
| [`LanguageSwitcher.tsx`](../apps/finance-web/src/i18n/LanguageSwitcher.tsx) | 외부 언어 상태를 읽는 Hook과 선택 이벤트 |
| [`applications.ts`](../apps/platform-web/src/app/applications.ts) | Vite의 파일 탐색과 React 렌더링의 경계 |
| [`transactions.spec.ts`](../apps/finance-web/e2e/transactions.spec.ts) | 사용자 행동으로 상태 흐름과 실패 복구를 검증하는 E2E |
| [`eslint.config.mjs`](../eslint.config.mjs) | Hook 규칙과 React Refresh 관련 설정 |

두 프론트엔드의 `package.json`은 React와 React DOM을 `^19.0.0`으로 선언한다. 정확히 설치되는 버전은 lockfile과 설치 상태로 확인한다. 현재는 Vite 기반 클라이언트 앱이며, Next.js나 서버 컴포넌트를 전제로 학습하지 않는다.

현재 거래 목록은 API에서 가져오며 종류 필터는 브라우저에서 계산한다. 화면의 해시 링크 이동은 라우터 도입과 구분한다. 예제의 기능 유무를 현재 구현 상태로 해석하지 않는다.

## 3. Vue 개념을 React에 연결하기

이 표는 역할을 연결하기 위한 출발점이다. 실행 방식까지 일대일로 대응하지는 않는다.

| Vue에서 익숙한 개념 | React에서 먼저 볼 것 | 주의할 차이 |
|---|---|---|
| SFC의 template와 script | 함수 컴포넌트와 JSX | 함수가 다시 호출되며 화면에 필요한 값을 계산한다 |
| `ref`, `reactive` | `useState` | 값을 직접 바꾸는 대신 setter로 다음 상태를 요청한다 |
| `computed` | 렌더 중 계산, 필요 시 `useMemo` | 일반 계산부터 시작하고 캐시는 필요할 때 검토한다 |
| `watch`, `watchEffect` | 이벤트 처리, 렌더 중 계산, `useEffect` | 목적에 따라 나누며 모두 Effect로 옮기지 않는다 |
| `defineProps` | props 매개변수와 TypeScript 타입 | props를 읽고 변경 요청은 콜백으로 전달한다 |
| `defineEmits` | `onChange` 같은 콜백 prop | 부모가 전달한 함수를 자식이 호출한다 |
| `v-model` | `value`와 `onChange` | 입력값과 상태 변경을 명시적으로 연결한다 |
| `v-if`, `v-for` | 조건식, `map` | JavaScript 표현식으로 JSX를 구성한다 |
| slot | `children`, JSX를 받는 prop | 이름 있는 영역은 prop으로 나눌 수 있다 |
| template ref | `useRef` | DOM 참조나 렌더에 쓰지 않는 값을 보관한다 |
| composable | custom Hook | Hook 호출 규칙을 지켜 로직을 재사용한다 |
| provide/inject | Context | 공유 범위와 갱신 영향을 먼저 판단한다 |
| scoped style | 일반 CSS 또는 별도로 구성한 CSS Modules | 현재 앱의 일반 CSS import는 자동으로 범위가 제한되지 않는다 |

props와 JSX 전달의 기본 원리는 [React 공식 props 문서](https://react.dev/learn/passing-props-to-a-component)를 참고한다. 계산과 Effect의 구분은 [Effect가 필요하지 않은 경우](https://react.dev/learn/you-might-not-need-an-effect)에 설명되어 있다.

## 4. 가장 먼저 바꿔야 할 생각: 렌더와 상태

Vue에서는 반응형 값을 읽는 코드의 의존성 추적에 익숙하다. React 함수 컴포넌트에서는 현재 props와 state로 JSX를 계산한다고 생각하면 이해하기 쉽다. 렌더는 컴포넌트 함수를 호출해 결과를 계산하는 과정이며, 매번 DOM 전체를 다시 만드는 의미는 아니다.

Finance의 핵심 흐름은 다음과 같다. 아래 코드는 `TransactionsPanel`의 일부를 줄여 표현했다. `data`는 부모가 전달한 거래 Hook의 반환값이다.

```tsx
const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
const visible = data.transactions.filter(
  (transaction) => filter === 'all' || transaction.type === filter,
)

// TransactionsPanel이 반환하는 JSX의 일부
<button type="button" onClick={() => setFilter('expense')}>
  {t('transactions.types.expense')}
</button>
```

1. 첫 렌더에서 `filter`는 `all`이다.
2. 클릭 핸들러가 `setFilter('expense')`을 호출한다.
3. React가 다음 렌더에서 `TransactionsPanel`을 다시 호출하고 새 `filter`를 제공한다.
4. `visible`를 다시 계산하고 그 결과에 맞게 화면을 갱신한다.

`visible`는 원본과 필터로 계산할 수 있으므로 별도 state로 저장할 필요가 없다. Vue에서 `computed`를 쓸 법한 자리지만, 이 작은 계산에는 일반 표현식으로 충분하다. [React의 파생 값 설명](https://react.dev/learn/you-might-not-need-an-effect)을 참고한다.

거래 원본 state는 `App`에서 호출한 `useTransactions`가 관리한다. `App`은 그 거래로 현재 월의 합계와 카테고리 분포를 계산하고 같은 `data`를 `TransactionsPanel`에 전달한다. 자식의 종류 필터는 부모 합계의 계산 조건에 포함되지 않는다. 자산·예산·목표의 샘플 배열은 `App` 함수 안에서 구성하며 API 거래와 구분한다.

### setter 호출 후에도 현재 함수가 가진 값은 그대로다

```tsx
function handleClick() {
  setFilter('expense')
  console.log(filter)
}
```

첫 화면에서 실행하면 로그는 `all`이다. 이 핸들러는 자신이 만들어진 렌더의 상태를 읽는다. setter는 현재 변수에 새 값을 대입하지 않는다. 비동기 콜백도 자신이 만들어진 렌더의 값을 기억할 수 있다. 이것이 오래된 값을 읽는 문제를 이해하는 출발점이다. [상태의 스냅샷](https://react.dev/learn/state-as-a-snapshot)을 참고한다.

이전 상태에 의존하는 변경에는 함수형 업데이트를 사용한다.

```tsx
// count와 setCount를 useState로 선언한 컴포넌트의 핸들러
function incrementTwice() {
  setCount((previous) => previous + 1)
  setCount((previous) => previous + 1)
}
```

위 코드는 2를 더한다. 같은 핸들러에서 `setCount(count + 1)`을 두 번 호출하면 둘 다 같은 렌더의 `count`로 다음 값을 계산한다. AI 코드에서 이전 배열이나 숫자를 사용하는 setter를 만나면 이 차이를 확인한다. [공식 상태 업데이트 설명](https://react.dev/learn/state-as-a-snapshot)과 연결해서 읽는다.

## 5. JSX, props, 입력을 작은 예제로 익히기

### JSX는 JavaScript 표현식으로 화면을 구성한다

`class` 대신 `className`, label의 `for` 대신 `htmlFor`를 사용한다. 값은 `{expression}`으로 넣고, 이벤트는 `onClick={handleClick}` 또는 `onClick={() => handleClick()}`으로 전달한다. `onClick={handleClick()}`은 렌더 중 함수를 실행하므로 의도한 클릭 처리인지 확인해야 한다.

목록은 `items.map(...)`으로 만들며 현재 Finance처럼 데이터의 안정적인 ID를 `key`로 사용한다. 필터·삭제·정렬되는 목록에서 배열 인덱스를 key로 사용하면 항목과 상태가 잘못 연결될 수 있다. key와 컴포넌트 타입·위치는 상태 유지에 영향을 준다. [상태 보존과 초기화](https://react.dev/learn/preserving-and-resetting-state)를 참고한다.

### 자식의 변경 요청은 콜백으로 전달한다

다음 `FilterButton`은 별도 학습 예제다. 실제 앱은 `TransactionsPanel`과 `TransactionForm`으로 책임을 나누며, 필터 버튼은 패널 내부에 있다.

```tsx
import { useState } from 'react'

type TransactionFilter = 'all' | 'expense' | 'income'

type FilterButtonProps = {
  value: TransactionFilter
  selected: boolean
  onSelect: (value: TransactionFilter) => void
}

function FilterButton({ value, selected, onSelect }: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
    >
      {value}
    </button>
  )
}

export default function FilterExample() {
  const [filter, setFilter] = useState<TransactionFilter>('all')

  return (
    <FilterButton
      value="expense"
      selected={filter === 'expense'}
      onSelect={setFilter}
    />
  )
}
```

부모가 상태를 소유하고 자식은 표시와 변경 요청을 담당한다. Vue의 prop과 emit 역할을 이 흐름에 연결할 수 있다. 여기서 `onSelect`는 우리가 정한 prop 이름이고, `<button>`의 `onClick`은 DOM 이벤트를 연결하는 prop이다. [props로 함수 전달하기](https://react.dev/learn/passing-props-to-a-component)를 참고한다.

### v-model에 대응하는 제어 입력

```tsx
import { useState } from 'react'

export default function SearchExample() {
  const [query, setQuery] = useState('')

  return (
    <label>
      내역 검색
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </label>
  )
}
```

상태가 입력값의 기준이다. `value`만 전달하고 변경을 반영하지 않으면 입력이 기대대로 동작하지 않는다. 초기 문자열은 `''`로 두고, 숫자 입력도 DOM에서 읽는 `value`는 문자열이므로 변환과 빈 값 처리를 따로 생각한다. 체크박스는 `checked`와 `event.target.checked`를 연결한다. [React input 문서](https://react.dev/reference/react-dom/components/input)를 참고한다.

## 6. 객체와 배열은 새 값으로 교체하기

Vue의 반응형 객체를 직접 수정하던 습관을 그대로 적용하기 쉬운 부분이다. React state의 배열과 객체는 기존 값을 수정하지 않고 새 값을 만들어 setter에 전달한다.

아래는 불변 업데이트를 익히는 별도 예제다. 실제 `useTransactions`도 추가에는 새 배열, 수정에는 `map`, 삭제에는 `filter`를 사용하며 서버 성공 응답을 받은 뒤 반영한다.

```tsx
// 추가
setTransactions((previous) => [...previous, newTransaction])

// 수정: 배열과 변경 대상 객체를 각각 새로 만든다.
setTransactions((previous) =>
  previous.map((transaction) =>
    transaction.id === editingId
      ? { ...transaction, amount: nextAmount }
      : transaction,
  ),
)

// 삭제
setTransactions((previous) =>
  previous.filter((transaction) => transaction.id !== deletingId),
)
```

`transactions.push(...)`나 `transaction.amount = ...`로 기존 state를 수정하지 않는다. `[...previous]`는 얕은 복사이므로 내부 객체까지 복사한 것은 아니다. 정렬도 기존 배열에 `sort()`를 바로 호출하지 않고 복사 후 정렬한다. [배열 상태 업데이트](https://react.dev/learn/updating-arrays-in-state)를 참고한다.

## 7. watch를 Effect로 바로 번역하지 않기

AI가 `useEffect`를 제안하면 먼저 코드의 목적을 분류한다.

| 목적 | 우선 둘 위치 | Finance 학습 예 |
|---|---|---|
| 현재 데이터로 화면 값 계산 | 렌더 중 계산 | 필터링된 거래, 표시 합계 |
| 특정 사용자 행동 처리 | 이벤트 핸들러 | 등록 버튼 클릭, 폼 제출 |
| 외부 시스템과 상태 동기화 | `useEffect` 검토 | 브라우저 이벤트 구독, 외부 위젯 연결 |

필터 변경을 감시해 별도 목록 state를 갱신하는 Effect는 중복 상태를 만든다. 저장 버튼을 눌러야 하는 요청도 이벤트 핸들러에서 의도를 표현하는 편이 명확하다. [Effect가 필요하지 않은 경우](https://react.dev/learn/you-might-not-need-an-effect)를 참고한다.

Effect를 읽을 때는 다음을 확인한다.

- 어떤 외부 시스템과 동기화하는가?
- Effect 안에서 읽는 props·state와 컴포넌트 내부 값이 의존성에 반영되어 있는가?
- 의존성이 바뀌거나 컴포넌트가 제거될 때 이전 구독·타이머를 정리하는가?
- 요청을 사용한다면 오래된 응답이 최신 화면을 덮지 않도록 취소나 무시 처리가 있는가?

의존성 배열은 실행 빈도를 취향대로 조절하는 옵션이 아니다. 경고를 없애기 위해 의존성을 지우기 전에 구조를 검토한다. cleanup은 언마운트 때뿐 아니라 의존성 변경으로 다음 setup이 실행되기 전에도 필요할 수 있다. [Effect 동기화 설명](https://react.dev/learn/synchronizing-with-effects)을 참고한다.

현재 `main.tsx`는 `StrictMode`를 사용한다. 개발 중 일부 렌더 로직을 추가 호출하고 Effect의 setup과 cleanup을 추가 수행해 문제를 드러낼 수 있다. 로그가 반복된다는 이유만으로 StrictMode를 제거하기보다 렌더의 부수 효과와 정리 누락을 먼저 확인한다. 이벤트 핸들러를 두 번 클릭한 것으로 해석하지 않는다. [개발 중 Effect 재실행 설명](https://react.dev/learn/synchronizing-with-effects)을 참고한다.

## 8. Hook과 컴포넌트 분리 기준

`useState`, `useEffect`, `useRef`, `useMemo` 같은 일반 Hook은 함수 컴포넌트나 custom Hook의 최상위에서 호출한다. 조건문·반복문·이벤트 핸들러 내부나 조건부 조기 반환 뒤에서 호출하지 않는다. [Hook 규칙](https://react.dev/reference/rules/rules-of-hooks)을 참고한다.

custom Hook은 Vue composable처럼 상태 관련 로직을 재사용하는 수단이다. 같은 Hook을 두 컴포넌트에서 호출했다고 상태가 자동으로 공유되지는 않는다. 공유가 필요하면 공통 부모로 상태를 올리는 방식부터 검토한다. 상태 보존은 [컴포넌트 트리의 위치](https://react.dev/learn/preserving-and-resetting-state)와 함께 이해한다.

Finance는 `App`에서 거래 Hook을 호출하고 `TransactionsPanel`에 결과를 전달하며, 패널은 `TransactionForm`에 초기 거래와 저장·취소 콜백을 전달한다. Vue의 composable과 부모·자식 prop·emit 흐름을 이 구조와 연결해 읽는다. 분리한 컴포넌트는 부모 함수 바깥에 선언해 렌더마다 새 컴포넌트 타입이 만들어지는 일을 피한다. [컴포넌트 정의와 상태 초기화](https://react.dev/learn/preserving-and-resetting-state)를 참고한다.

`useMemo`는 계산 결과 캐시, `useCallback`은 함수 참조 캐시에 쓰인다. 모든 계산과 함수에 먼저 붙이기보다 실제 비용과 소비하는 쪽의 요구를 확인한다. 특히 작은 필터링을 `computed`와 비슷하게 보이도록 만들기 위해 추가할 필요는 없다. [useMemo의 용도와 제한](https://react.dev/reference/react/useMemo)을 참고한다.

## 9. AI와 함께 공부하는 작업 루틴

한 작업에서 배우는 개념을 하나나 둘로 제한한다. 구현 요청 전에 현재 동작을 설명하게 하고, 구현 후에는 결과를 예측하는 문제로 이해도를 확인한다.

### 읽기 요청

```text
나는 Vue 개발자이고 React를 배우는 중이야.
AGENTS.md와 docs/REACT_FOR_VUE_DEVELOPERS.md를 읽어 줘.
apps/finance-web/src/features/transactions/TransactionsPanel.tsx의 종류 필터를 기준으로
상태, 파생 값, 이벤트, JSX를 파일 위치와 함께 설명해 줘.
Vue Composition API와 역할을 연결하되 실행 방식의 차이를 알려 줘.
파일 수정이나 명령 실행 없이 설명하고, 내가 답할 질문을 3개 내 줘.
```

### 작은 구현 요청

```text
Finance의 최근 내역에 이름 검색을 추가해 줘.
먼저 현재 필터와 검색 상태가 어떻게 결합되는지 설명해 줘.
이미 조회한 거래 목록에 검색을 적용하고 새 의존성은 추가하지 마.
파생 목록을 별도 state로 저장하지 말고 접근 가능한 입력을 사용해 줘.
현재 월 합계가 최근 내역 검색 결과의 합계로 바뀌면 안 돼.
변경 후 핵심 줄의 이유와 브라우저에서 확인할 동작을 알려 줘.
테스트나 빌드 명령은 실행하지 마.
```

### 리뷰와 복습 요청

```text
방금 변경한 diff를 React 학습 관점에서 리뷰해 줘.
중복 state, 불필요한 Effect, 직접 수정한 객체나 배열,
오래된 상태를 읽는 콜백, 불안정한 key, Hook 규칙 위반을 확인해 줘.
발견한 문제만 코드 위치와 근거로 설명하고 임의로 수정하지 마.
그다음 입력 변경 후 어떤 값이 다시 계산되는지 내가 설명하도록 질문해 줘.
```

AI 설명을 읽은 다음에는 코드를 가리고 상태의 소유자, 갱신 계기, 계산되는 값, 화면 결과를 직접 말해 본다. 예상과 실행 결과가 다르면 재현 순서·기대 결과·실제 결과를 기록하고 관련 공식 문서를 확인한다. AI가 제시한 실행 성공과 실제 실행 로그도 구분한다.

## 10. 프로젝트에 맞춘 연습 순서

아래는 현재 코드를 읽는 복습과 아직 없는 기능을 추가하는 연습이다. 기능 구현이 끝났더라도 직접 이해하고 연습했는지는 별도로 판단한다.

| 순서 | 읽기 또는 작은 과제 | 익힐 개념 | 스스로 설명할 완료 기준 |
|---|---|---|---|
| 1 | 현재 종류 필터와 빈 결과 분기 읽기 | state, 파생 값, 조건부 렌더링 | 조회 실패·전체 빈 목록·필터 결과 없음을 구분한다 |
| 2 | 기존 거래 목록에 이름 검색 추가 연습 | 제어 입력, 조건 조합 | 검색과 종류 필터가 월별 합계를 바꾸지 않는 이유를 설명한다 |
| 3 | 폼·패널·Hook의 저장 흐름 읽기 | props, 비동기 콜백, 상태 소유 | 저장 실패 시 폼이 유지되는 이유를 설명한다 |
| 4 | Hook의 추가·수정·삭제 읽기 | 불변 업데이트, 함수형 setter | 서버 응답과 현재 배열을 합치는 과정을 설명한다 |
| 5 | 초기 조회와 재조회 읽기 | Effect, 의존성, cleanup | reloadKey와 AbortController의 역할을 구분한다 |
| 6 | 언어 전환과 오류 표시 읽기 | 외부 상태, 번역 키, 제어 입력 | 입력값을 보존하면서 안내 언어가 바뀌는 이유를 설명한다 |
| 7 | 포털 앱 선택과 자동 발견 읽기 | ID state, 파생 값, Vite 경계 | 앱 선택이 테스트 실행이나 서버 조회를 의미하지 않는 이유를 설명한다 |
| 8 | 기존 Playwright 시나리오 읽기 | 접근성 역할, 사용자 행동, 실패 복구 | 검사할 동작과 React 내부 구현을 구분한다 |

API와 Playwright E2E는 현재 존재한다. Vitest 단위·API 테스트와 CI 연결은 별도 후속 범위다. 실행 명령은 실제 package.json과 개발 가이드를 따르며, 학습 문서 갱신만으로 테스트·빌드를 실행하지 않는다.

## 11. 직접 판단할 수 있어야 하는 질문

- 이 값은 원본 state인가, props인가, 계산으로 얻는 값인가?
- 이 상태를 누가 소유해야 여러 화면이 같은 값을 보는가?
- setter 이후 현재 핸들러와 다음 렌더가 읽는 값은 각각 무엇인가?
- 배열이나 객체의 어떤 부분을 새로 만들어야 하는가?
- 이 Effect가 연결하는 외부 시스템과 cleanup은 무엇인가?
- 항목을 삭제하거나 정렬해도 key가 같은 대상을 가리키는가?
- AI가 추가한 Hook이나 패키지가 지금 기능에 필요한가?
- 실패·빈 결과·미연결 상태를 성공처럼 표시하고 있지는 않은가?

처음에는 4장의 필터 흐름과 5장의 제어 입력을 이해한 뒤, 이름 검색 연습으로 연결하면 된다. 실행 환경과 실제 제공 명령은 [개발 가이드](DEVELOPMENT_GUIDE.md)를 따른다. 이 문서는 실제 구현을 학습 관점으로 설명하며 애플리케이션 코드와 기능을 변경하지 않는다.

## 12. 현재 구현으로 따라가는 React 학습

### 거래 데이터의 소유자와 화면 상태 구분

다음 표는 구현 목록이 아니라 값을 어디에 두었는지 읽는 기준이다. Vue에서도 공통 부모가 composable을 한 번 호출하고 자식에 값을 전달하는 구조와 비교할 수 있다.

| 위치 | 소유하거나 계산하는 값 | 그렇게 나눈 이유 |
|---|---|---|
| `App`의 `useTransactions()` | 거래 목록, 조회·변경 상태와 API 동작 | 합계와 내역 패널이 같은 원본을 사용한다 |
| `App` 렌더 | 현재 월 거래, 수입·지출 합계, 카테고리 분포 | 거래 원본에서 구할 수 있는 파생 값이다 |
| `TransactionsPanel` | 종류 필터, 폼 열기, 수정·삭제 대상, 결과 안내 | 내역 영역의 사용자 상호작용이다 |
| `TransactionForm` | 종류·금액·날짜·내역·카테고리 입력과 오류 | 저장 전 편집 중인 값을 서버 데이터와 분리한다 |

`TransactionsPanel`의 `data` 타입은 `ReturnType<typeof useTransactions>`다. 반환값의 타입을 참조하는 표현이며 패널에서 Hook을 다시 호출하는 코드가 아니다. 여기서 Hook을 한 번 더 호출하면 별도의 거래 state와 조회 Effect가 생긴다.

### 조회는 Effect, 저장은 이벤트에서 시작한다

`useTransactions`의 조회 Effect는 `[reloadKey]`에 의존한다. 처음 연결할 때 목록을 요청하고, 재조회 핸들러가 `setReloadKey((value) => value + 1)`을 호출하면 다시 요청한다. 필터를 변경하는 것만으로 재조회하지 않는다.

Effect는 실행마다 `AbortController`를 만들고 cleanup에서 `abort()`한다. 응답을 처리하는 콜백에서도 취소 여부를 확인한다. 이전 조회가 정리된 뒤 늦게 끝나더라도 그 응답으로 화면 상태를 갱신하지 않도록 한 구조다. Vue의 마운트 시 조회와 감시 정리를 떠올릴 수 있지만, React에서는 Effect 의존성과 각 실행의 cleanup을 함께 읽어야 한다. 개발 `StrictMode`의 추가 setup·cleanup에도 이 경계를 확인한다.

등록·수정·삭제는 사용자 행동에서 시작하므로 Effect가 아니라 이벤트 경로에서 실행한다. 저장 흐름은 다음과 같다.

1. 폼의 `onSubmit`이 기본 제출을 막고 입력을 검증한다.
2. 폼이 `onSave(input)`을 호출하고 패널의 `save`가 Hook의 `create` 또는 `update`를 기다린다.
3. Hook은 API 성공 후 반환된 거래로 배열을 갱신한다. 등록은 새 배열, 수정은 `map`, 삭제는 `filter`를 사용하고 복사한 배열을 날짜·ID 순서로 정렬한다.
4. 성공한 경우에만 패널이 성공 안내를 설정하고 폼을 닫는다.
5. 실패하면 폼이 오류를 표시하고 입력 state를 유지한다. 삭제 실패 시에도 목록과 삭제 대상이 남아 재시도할 수 있다.

서버 응답 전에 성공으로 표시하는 낙관적 업데이트는 사용하지 않는다. `setTransactions((current) => ...)`는 요청을 시작한 시점에 캡처한 배열 대신 업데이트를 처리할 때의 배열을 받는다. 저장 성공 후 전체 목록을 다시 조회하는 방식과도 구분해서 읽는다.

`api.ts`에는 React Hook이 없다. HTTP 요청·응답과 오류 코드 처리는 이 파일이 맡고, `useTransactions`는 그 결과를 React 상태에 연결한다. TypeScript의 `payload as T`는 응답을 실행 시점에 검증하는 코드가 아니며 목록 배열 여부 검사와 타입 단언도 구분한다.

### useRef와 useState를 함께 쓰는 이유

`useTransactions`의 `mutationLock`은 `useRef(false)`, 화면의 저장·삭제 중 표시는 `isMutating` state다. `mutationLock.current`는 같은 처리 흐름에서 즉시 바꿔 다음 요청을 막고, `setIsMutating(true)`는 다음 렌더에서 입력과 버튼 상태를 바꾸도록 요청한다. 요청이 성공하거나 실패하면 `finally`에서 둘 다 해제한다.

ref 변경은 그 자체로 렌더를 요청하지 않는다. Vue의 반응형 `ref`와 이름이 비슷해도 같은 방식으로 동작하지 않는다. 이 잠금은 해당 Hook 인스턴스에서의 중복 요청 방지이며 서버의 동시성 제어나 다른 브라우저 요청까지 막는 기능은 아니다.

### 제어 입력, 초기 props와 key

`TransactionForm`의 금액은 입력 중에는 문자열 state다. 빈 입력을 유지할 수 있어야 하므로 타이핑마다 숫자로 강제 변환하지 않고 제출 시 정수·양수·안전한 정수 범위를 검사한 뒤 API 숫자로 바꾼다. Vue의 `v-model`로 처리하던 연결은 각각의 `value`와 `onChange`에 드러나 있다.

`useState(transaction?.description ?? '')`의 초기값은 해당 컴포넌트 인스턴스를 처음 만들 때 사용한다. props가 바뀔 때마다 입력 state를 자동으로 덮어쓰지는 않는다. 패널은 아래처럼 폼의 대상 ID를 key로 전달한다.

```tsx
<TransactionForm
  key={editing?.id ?? 'new'}
  transaction={editing}
  isPending={data.isMutating}
  onSave={save}
  onCancel={() => { setFormOpen(false); setEditing(null) }}
/>
```

실제 코드에서는 `formOpen`일 때만 이 폼을 렌더한다. 폼을 닫으면 제거되고 다시 열면 새 state로 시작한다. key가 다른 대상으로 바뀌는 경우에도 새 인스턴스로 초기화한다. 같은 폼이 유지되는 저장 실패에서는 입력값이 보존된다. props를 감시하는 Effect로 입력값을 계속 덮어쓰는 방식과 비교해 보면 상태 보존 기준을 이해할 수 있다.

### 번역 문자열 대신 의미와 데이터를 보관한다

두 앱은 `main.tsx`에서 `./i18n`을 먼저 import하고 `useTranslation()`으로 번역 함수와 언어 상태를 읽는다. `LanguageSwitcher`는 `i18n.resolvedLanguage`를 select의 값으로 쓰고 변경 이벤트에서 `changeLanguage`를 호출한다. 언어를 위한 별도의 컴포넌트 state를 중복으로 만들지 않았다. Vue의 `useI18n`을 사용할 때처럼 번역 함수와 현재 언어의 역할을 연결해서 읽을 수 있다.

```tsx
// TransactionsPanel의 상태 변경과 표시를 줄여 표현한 예제
setFeedback({ type: 'success', message: 'transactions.feedback.created' })
// JSX에서 표시할 때 현재 언어로 번역한다.
{feedback && <p role="status">{t(feedback.message)}</p>}
```

오류와 성공 안내는 번역이 끝난 문장 대신 키를 state에 저장한다. 따라서 언어를 바꿔 다시 렌더하면 이미 표시 중인 안내도 새 언어로 계산한다. 필터 역시 번역 라벨 대신 `all`, `income`, `expense`를 값으로 보관하므로 언어 전환 후에도 같은 조건을 유지한다.

JSON은 `transactions.errors.connection`처럼 최대 3단계 중첩의 의미 기반 영문 키를 사용한다. `t`의 보간과 복수형으로 이름·개수를 넣고 날짜·금액은 `format.ts`의 Intl 기반 함수에 현재 언어를 전달한다. 저장된 사용자 내역·카테고리와 API 날짜·금액은 화면 언어가 바뀌어도 변경하지 않는다.

언어 저장과 문서 `lang` 변경은 컴포넌트의 Effect가 아니라 i18next 초기화 모듈의 `languageChanged` 이벤트에서 처리한다. 포털은 문서 제목도 변경한다. localStorage 키가 같아도 origin이 다른 두 개발 앱의 저장값은 별개다. 일반 React state, 라이브러리가 관리하는 상태, 브라우저 저장소를 구분해서 읽는다.

### 포털의 선택 상태와 Vite 파일 탐색

포털의 `App`은 선택한 앱 객체 전체 대신 `selectedAppId`만 state에 보관한다. `selectedApp`은 `applications.find(...)`로 렌더 중 계산한다. Vue의 선택 ID와 `computed`로 상세 객체를 찾는 구조와 비교할 수 있다. 선택 후 제목과 안내가 달라져도 실제 결과 조회나 테스트 요청이 수행되는 것은 아니다.

`applications.ts`의 `import.meta.glob`은 React API가 아니라 Vite 기능이다. package.json을 모듈로 가져와 이름이 있는 앱만 목록으로 변환하고 워크스페이스 이름을 ID와 목록 key로 사용한다. 개발 중 파일 변경 감시는 Vite 설정이 맡고, 배포된 번들의 목록은 빌드 시점 기준이다. 브라우저가 서버 디스크를 계속 탐색하는 구조로 이해하지 않는다.

### E2E에서 React 동작을 읽는 방법

`transactions.spec.ts`는 setter나 Hook을 직접 호출하지 않고 역할·라벨로 버튼과 입력을 찾아 사용자 행동을 재현한다. 등록 후 목록·합계를 확인하고 새로고침 후에도 내역이 유지되는지 확인하는 것은 React state의 화면 갱신과 서버 저장을 함께 검증하는 흐름이다.

실패 복구 시나리오는 브라우저 요청을 가로채 저장·조회·삭제 실패를 만들고, 입력·목록 보존과 재시도 결과를 확인한다. 종류 필터가 월별 합계를 바꾸지 않는 시나리오는 부모 원본과 자식 필터의 책임 분리를 검증한다. 언어 선택은 재접속 후 값과 문서 lang까지 확인한다.

Playwright 설정은 전용 서버와 실행별 임시 DB를 사용한다. 소스에 검증 시나리오가 있는 것과 현재 환경에서 실행해 통과한 것은 별개이며 결과는 개발 가이드의 날짜별 기록을 따른다. 이 문서 갱신에서는 테스트를 재실행하지 않는다.
