FROM golang:1.18rc1-alpine3.15 as backend-build

WORKDIR /usr/src/app
COPY backend .
RUN apk add git
RUN go build -o quizler

FROM node:14-alpine3.12 as frontend-build

WORKDIR /usr/src/app
COPY frontend/package.json package.json
RUN npm install
COPY frontend .
RUN npm run build

FROM golang:1.18rc1-alpine3.15 as run

WORKDIR /usr/src/app/dist

COPY --from=backend-build /usr/src/app/quizler ./quizler
COPY --from=frontend-build /usr/src/app/dist ./public

ENV ADDRESS="0.0.0.0"
ENV PORT=8080
EXPOSE ${PORT}

CMD ["./quizler"]