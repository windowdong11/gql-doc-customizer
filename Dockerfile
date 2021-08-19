# 가져올 이미지
FROM node:14

# 작업 폴더를 만들고 npm 설치
RUN mkdir /app
WORKDIR /app
# 환경변수
ENV PATH /app/node_modules/.bin:$PATH
# 작업환경
COPY package.json /app/package.json
# 명령어 실행
RUN npm install --silent
RUN npm install react-scripts -g --silent
RUN npm install serve

# 소스를 작업폴더로 복사하고 앱 실행
COPY . /app
RUN npm run build

# 실행 명령어
CMD ["serve", "-l", "3000", "-s", "build"]