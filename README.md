<<<<<<< HEAD
# university-life-manager
universitiy life manager application
=======
# University Life Manager

맞춤형 대학 생활 관리 앱 - 학업 일정, 졸업 요건, 수강 정보 등을 통합 지원합니다.

## 프로젝트 구조

```
university-life-manager/
├── src/
│   ├── components/          # 재사용 컴포넌트
│   │   ├── SummaryCard.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── PrimaryButton.tsx
│   │   └── InputRow.tsx
│   ├── screens/            # 화면 컴포넌트
│   │   ├── HomeScreen.tsx
│   │   ├── CafeteriaScreen.tsx
│   │   ├── DDayScreen.tsx
│   │   ├── MeetingScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/         # 네비게이션 설정
│   │   └── AppNavigator.tsx
│   ├── store/             # 상태 관리
│   │   ├── context.tsx
│   │   └── reducer.ts
│   ├── types/             # 타입 정의
│   │   └── index.ts
│   └── utils/             # 유틸 함수
│       └── index.ts
├── App.tsx                # 메인 앱 컴포넌트
├── package.json
├── tsconfig.json
├── app.json
└── README.md
```

## 기술 스택

- **Expo** (~49.0.0)
- **React Native** (0.72.6)
- **TypeScript** (^5.1.3)
- **React Navigation** (Bottom Tabs + Stack)
- **React Context + useReducer** (상태 관리)

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

또는

```bash
yarn install
```

### 2. 앱 실행

```bash
npm start
```

또는

```bash
expo start
```

실행 후:
- **i** 키를 눌러 iOS 시뮬레이터에서 실행
- **a** 키를 눌러 Android 에뮬레이터에서 실행
- Expo Go 앱을 사용하여 실제 기기에서 QR 코드 스캔

### 개별 플랫폼 실행

```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

## 주요 기능

### 1. Home (홈)
- 오늘 날짜 표시
- 오늘 할 일(과제/시험 D-day) 요약 카드
- 오늘 학식 요약 카드
- 추천 회의 시간 요약 카드

### 2. Cafeteria (학식)
- 주간(7일) 학식 메뉴 리스트
- 카카오톡 알림 설정 UI
- **TODO**: 학식 데이터 수집 로직 구현 필요

### 3. DDay (과제/시험 D-day)
- 과목명/유형/마감일 입력 폼
- 등록된 항목 리스트 (우선순위 표시)
- D-7/D-3/D-Day 표시 UI
- **TODO**: 날짜 계산/푸시/위젯 연동 로직 구현 필요

### 4. Meeting (회의 시간 조율)
- 팀원 추가 (이름, 가능 시간대)
- 각 팀원의 가능 시간대 입력 UI
- 겹치는 시간 추천 버튼
- 결과 표시 영역
- **TODO**: 겹치는 시간 계산 로직 구현 필요

### 5. Settings (설정)
- 알림 허용 토글
- 테마 토글 (UI만, 실제 적용은 TODO)
- 계정/버전 정보

## TODO 항목

이 프로젝트는 UI/네비게이션/상태 관리 구조만 구현되어 있으며, 다음 기능들은 TODO 주석으로 표시되어 있습니다:

1. **학식 데이터 수집** (CafeteriaScreen.tsx)
   - 대학 식당 웹사이트/API에서 데이터 크롤링
   - 주기적 데이터 업데이트

2. **카카오톡 알림 전송** (CafeteriaScreen.tsx)
   - 카카오톡 API 연동
   - 스케줄 알림 설정

3. **D-day 계산/알림** (DDayScreen.tsx, utils/index.ts)
   - 정확한 날짜 차이 계산
   - D-7, D-3, D-Day 푸시 알림
   - 홈 화면 위젯 연동

4. **겹치는 시간 계산** (MeetingScreen.tsx)
   - availability 문자열 파싱
   - 시간대 교집합 계산
   - 여러 시간 슬롯 추천

5. **테마 적용** (SettingsScreen.tsx, 선택 사항)
   - 다크 모드/라이트 모드 전환

## 개발 참고사항

- 모든 컴포넌트는 TypeScript로 작성되었습니다
- 상태 관리는 Context API + useReducer를 사용합니다
- 네비게이션은 React Navigation의 Bottom Tabs + Stack 구조입니다
- 각 화면은 Stack Navigator로 감싸져 있어 추후 상세 화면 추가가 용이합니다

## 라이선스

Private
>>>>>>> c4d398d (초기 커밋: 대학 생활 관리 앱 구현)
