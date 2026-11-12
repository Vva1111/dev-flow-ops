# Vue 개발자를 위한 React 학습 가이드

## 1. 이 문서의 목표와 사용법

Vue와 TypeScript로 개발해 온 개발자가 DevFlowOps를 만들면서 React를 익히기 위한 문서다. AI가 구현을 도와주는 상황을 전제로 하며, 생성된 코드를 읽고 변경 이유와 동작을 직접 판단하는 능력을 목표로 한다.

Vue 예제는 Vue 3 Composition API와 `<script setup>`에 익숙하다고 가정한다. Options API를 사용해 왔다면 `data`는 상태, `computed`는 파생 값, `methods`는 이벤트 처리라는 역할부터 연결하면 된다. TypeScript, HTTP, CSS, 모노레포와 CI/CD 경험은 그대로 활용할 수 있다.

학습은 다음 순서로 진행한다. 모든 React API를 먼저 외울 필요는 없다.

1. 현재 Finance 코드를 읽고 상태 변경부터 화면 갱신까지 설명한다.
2. 한 번에 하나의 작은 변경을 AI와 함께 구현한다.
3. 실행 전에 결과를 예상하고 실제 동작과 비교한다.
4. 변경된 줄을 직접 설명하고 비슷한 변경을 스스로 해 본다.

이 문서의 연습과 예제는 학습 제안이며 앱에 구현된 기능을 뜻하지 않는다. DevFlowOps의 목표는 프론트엔드 개발·검증·배포·품질 검증 흐름을 자동화하는 플랫폼이며, Finance는 이를 검증하는 첫 앱이다.

## 2. 현재 저장소에서 시작할 위치

학습 예제의 작성 기준일은 2026-11-04다. 예제는 당시 코드에 기반하며 최신 구현 전체를 설명하지 않는다. 아래 경로는 학습을 시작할 위치이며 현재 상태는 [개발 진행 현황](DEVELOPMENT_STATUS.md)을 따른다.

| 파일 | 읽으면서 확인할 내용 |
|---|---|
| [`finance-web/src/main.tsx`](../apps/finance-web/src/main.tsx) | `createRoot`, `StrictMode`, 앱과 전역 CSS 연결 |
| [`finance-web/src/app/App.tsx`](../apps/finance-web/src/app/App.tsx) | 샘플 배열, `useState`, 필터링, 이벤트, 목록 렌더링 |
| [`finance-web/src/app/App.css`](../apps/finance-web/src/app/App.css) | JSX의 `className`과 스타일 연결 |
| [`platform-web/src/app/App.tsx`](../apps/platform-web/src/app/App.tsx) | 상태 없이 데이터와 JSX로 구성한 포털 기본 화면 |
| [`eslint.config.mjs`](../eslint.config.mjs) | Hook 규칙과 React Refresh 관련 설정 |

두 프론트엔드의 `package.json`은 React와 React DOM을 `^19.0.0`으로 선언한다. 정확히 설치되는 버전은 lockfile과 설치 상태로 확인한다. 현재는 Vite 기반 클라이언트 앱이며, Next.js나 서버 컴포넌트를 전제로 학습하지 않는다.

예제에서 사용하는 목록 필터와 화면의 해시 링크 이동은 API 연동이나 라우터 도입과 구분해 학습한다. 예제의 기능 유무를 현재 구현 상태로 해석하지 않는다.

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

Finance의 핵심 흐름은 다음과 같다. 아래 코드는 현재 구현의 일부를 줄여 표현했다.

```tsx
const [filter, setFilter] = useState('전체')
const visibleTransactions = transactions.filter(
  (transaction) => filter === '전체' || transaction.type === filter,
)

// App이 반환하는 JSX의 일부
<button type="button" onClick={() => setFilter('지출')}>
  지출
</button>
```

1. 첫 렌더에서 `filter`는 `전체`다.
2. 클릭 핸들러가 `setFilter('지출')`을 호출한다.
3. React가 다음 렌더에서 `App`을 다시 호출하고 새 `filter`를 제공한다.
4. `visibleTransactions`를 다시 계산하고 그 결과에 맞게 화면을 갱신한다.

`visibleTransactions`는 원본과 필터로 계산할 수 있으므로 별도 state로 저장할 필요가 없다. Vue에서 `computed`를 쓸 법한 자리지만, 이 작은 계산에는 일반 표현식으로 충분하다. [React의 파생 값 설명](https://react.dev/learn/you-might-not-need-an-effect)을 참고한다.

반면 파일 최상위의 `transactions`, `categories`, `totalExpense` 등은 현재 정적인 샘플 데이터와 계산이다. 컴포넌트 렌더마다 다시 초기화되는 지역 변수와 구분한다. 나중에 거래를 state로 옮긴다면 그 거래에 의존하는 계산 위치도 함께 검토해야 한다.

### setter 호출 후에도 현재 함수가 가진 값은 그대로다

```tsx
function handleClick() {
  setFilter('지출')
  console.log(filter)
}
```

첫 화면에서 실행하면 로그는 `전체`다. 이 핸들러는 자신이 만들어진 렌더의 상태를 읽는다. setter는 현재 변수에 새 값을 대입하지 않는다. 비동기 콜백도 자신이 만들어진 렌더의 값을 기억할 수 있다. 이것이 오래된 값을 읽는 문제를 이해하는 출발점이다. [상태의 스냅샷](https://react.dev/learn/state-as-a-snapshot)을 참고한다.

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

다음 코드는 별도 학습 예제다. 현재 앱을 분리해 두었다는 의미는 아니다.

```tsx
import { useState } from 'react'

type TransactionFilter = '전체' | '지출' | '수입' | '이체'

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
  const [filter, setFilter] = useState<TransactionFilter>('전체')

  return (
    <FilterButton
      value="지출"
      selected={filter === '지출'}
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

아래는 거래 배열을 `useState`로 관리한다고 가정한 수정 패턴이며, 현재 샘플 상수에 그대로 적용하는 코드는 아니다.

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

Finance의 `App`은 현재 여러 영역을 한 파일에 표현한다. 학습할 때는 내역 필터나 표시 카드처럼 책임이 분명한 부분 하나를 분리해 props 흐름을 익히면 된다. 분리한 컴포넌트는 부모 함수 바깥에 선언해 렌더마다 새 컴포넌트 타입이 만들어지는 일을 피한다. [컴포넌트 정의와 상태 초기화](https://react.dev/learn/preserving-and-resetting-state)를 참고한다.

`useMemo`는 계산 결과 캐시, `useCallback`은 함수 참조 캐시에 쓰인다. 모든 계산과 함수에 먼저 붙이기보다 실제 비용과 소비하는 쪽의 요구를 확인한다. 특히 작은 필터링을 `computed`와 비슷하게 보이도록 만들기 위해 추가할 필요는 없다. [useMemo의 용도와 제한](https://react.dev/reference/react/useMemo)을 참고한다.

## 9. AI와 함께 공부하는 작업 루틴

한 작업에서 배우는 개념을 하나나 둘로 제한한다. 구현 요청 전에 현재 동작을 설명하게 하고, 구현 후에는 결과를 예측하는 문제로 이해도를 확인한다.

### 읽기 요청

```text
나는 Vue 개발자이고 React를 배우는 중이야.
AGENTS.md와 docs/REACT_FOR_VUE_DEVELOPERS.md를 읽어 줘.
apps/finance-web/src/app/App.tsx의 최근 내역 필터를 기준으로
상태, 파생 값, 이벤트, JSX를 파일 위치와 함께 설명해 줘.
Vue Composition API와 역할을 연결하되 실행 방식의 차이를 알려 줘.
파일 수정이나 명령 실행 없이 설명하고, 내가 답할 질문을 3개 내 줘.
```

### 작은 구현 요청

```text
Finance의 최근 내역에 이름 검색을 추가해 줘.
먼저 현재 필터와 검색 상태가 어떻게 결합되는지 설명해 줘.
로컬 샘플 데이터만 사용하고 새 의존성은 추가하지 마.
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

아래는 아직 수행하지 않은 연습이다. 등록·삭제는 로컬 샘플 state만 다루고 새로고침하면 초기화되는 단계로 시작한다.

| 순서 | 작은 과제 | 익힐 개념 | 스스로 설명할 완료 기준 |
|---|---|---|---|
| 1 | 현재 종류 필터 읽기 | JSX, 이벤트, state, 파생 값 | 지출 클릭 후 왜 목록이 달라지는지 설명한다 |
| 2 | 최근 내역 이름 검색 | 제어 입력, 조건 조합 | 검색과 종류 필터를 함께 적용하고 초기화한다 |
| 3 | 결과 없음 안내 | 조건부 렌더링 | 일치 항목이 없을 때 무엇을 보여 주는지 설명한다 |
| 4 | 필터 버튼 영역 분리 | props, 콜백, 상태 소유 | 부모와 자식의 데이터 흐름을 그린다 |
| 5 | 샘플 거래 추가·삭제 | 폼, 불변 업데이트, key | 기존 state를 수정하지 않는 이유를 설명한다 |
| 6 | API 조회 단계의 설계 검토 | 비동기 상태와 Effect 경계 | 로딩·성공·빈 결과·실패와 요청 경합을 구분한다 |
| 7 | 테스트 도입 단계에서 동작 검증 | 순수 계산과 사용자 시나리오 | 필터 조합과 입력·삭제 결과를 검증할 대상을 정한다 |

단계 6은 현재 존재하지 않는 API를 호출하는 지시가 아니다. 서버 API 계약을 정하는 구현 단계에서 진행한다. 단계 7도 테스트 도구가 도입될 때 수행하며, 현재 없는 `pnpm test`를 실행 가능하다고 가정하지 않는다.

## 11. 직접 판단할 수 있어야 하는 질문

- 이 값은 원본 state인가, props인가, 계산으로 얻는 값인가?
- 이 상태를 누가 소유해야 여러 화면이 같은 값을 보는가?
- setter 이후 현재 핸들러와 다음 렌더가 읽는 값은 각각 무엇인가?
- 배열이나 객체의 어떤 부분을 새로 만들어야 하는가?
- 이 Effect가 연결하는 외부 시스템과 cleanup은 무엇인가?
- 항목을 삭제하거나 정렬해도 key가 같은 대상을 가리키는가?
- AI가 추가한 Hook이나 패키지가 지금 기능에 필요한가?
- 실패·빈 결과·미연결 상태를 성공처럼 표시하고 있지는 않은가?

처음에는 4장의 필터 흐름과 5장의 제어 입력을 이해한 뒤, 이름 검색 연습으로 연결하면 된다. 실행 환경과 실제 제공 명령은 [개발 가이드](DEVELOPMENT_GUIDE.md)를 따른다. 이 문서는 학습 가이드만 추가하며 애플리케이션 코드와 기능을 변경하지 않는다.
