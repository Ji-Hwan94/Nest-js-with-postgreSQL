# Board Frontend

NestJS Board App과 연동되는 React 프론트엔드 애플리케이션입니다.

## 기능

- 사용자 인증 (회원가입/로그인)
- JWT 토큰 기반 인증
- 게시글 CRUD 기능
- 게시글 상태 변경 (공개/비공개)
- 반응형 디자인

## 사용 기술

- React 18 with TypeScript
- React Router DOM
- Axios (API 통신)
- Context API (상태 관리)

## 설치 및 실행

```bash
npm install
npm start
```

## 백엔드 연동

백엔드 서버가 `http://localhost:3000`에서 실행되고 있어야 합니다.

## 주요 페이지

- `/login` - 로그인
- `/signup` - 회원가입  
- `/boards` - 게시글 목록
- `/boards/create` - 새 글 작성
- `/boards/:id` - 게시글 상세보기

## API 엔드포인트

- `POST /auth/signup` - 회원가입
- `POST /auth/signin` - 로그인
- `GET /boards` - 게시글 목록
- `GET /boards/:id` - 게시글 상세
- `POST /boards` - 게시글 작성
- `PATCH /boards/:id/status` - 게시글 상태 변경
- `DELETE /boards/:id` - 게시글 삭제

---

# Create React App 기본 정보

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
