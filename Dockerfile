# 使用 Docker 构建，避免 Railway Railpack 无法识别 monorepo 结构
# 构建前端 → 复制 dist → 运行 Express

FROM node:20-alpine AS frontend-build
WORKDIR /app/web/frontend
COPY web/frontend/package.json web/frontend/package-lock.json ./
RUN npm ci
COPY web/frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app/web/server
ENV NODE_ENV=production
COPY web/server/package.json web/server/package-lock.json ./
RUN npm ci --omit=dev
COPY web/server/ ./
COPY --from=frontend-build /app/web/frontend/dist ../frontend/dist
EXPOSE 8080
CMD ["node", "index.js"]
