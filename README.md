# 커스텀 대시보드 (PostgreSQL)

PPT처럼 캔버스 위에 도형/차트를 배치하고 저장/조회할 수 있는 대시보드 빌더입니다.

## 핵심 기능
- 도형(사각형/원형) 위젯 추가
- 차트 위젯 추가
- 캔버스 배경색 커스터마이징
- PostgreSQL에 대시보드 레이아웃(JSON) 저장/불러오기
- 저장된 대시보드 목록 조회(`/review`)

## 실행
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## 환경변수
`.env` 예시
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dashboard?schema=public"
JWT_SECRET="change-me"
```
