# PuppyTalk 프론트엔드 - 정적 파일 nginx 서빙
# 비루트 사용자(nginx), 멀티스테이지, .dockerignore 사용, 시크릿/설정은 빌드·런타임 주입
# 빌드 예: docker build --build-arg API_BASE_URL=http://backend:8000/v1 -t puppytalk-fe .

# -----------------------------------------------------------------------------
# Stage 1: 정적 파일 준비 (config 치환만, alpine만 사용해 최소 패키지)
# -----------------------------------------------------------------------------
FROM alpine:3.20 AS preparer

ARG API_BASE_URL=http://127.0.0.1:8000/v1

WORKDIR /build

COPY index.html .
COPY css ./css
COPY img ./img
COPY js ./js

RUN sed -i "s#http://127.0.0.1:8000/v1#${API_BASE_URL}#g" js/config.js

# -----------------------------------------------------------------------------
# Stage 2: Runtime (비루트 nginx, 최소 베이스)
# -----------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# 시크릿/API 주소는 빌드 시 --build-arg 로만 주입, 이미지에 하드코딩하지 않음
COPY --from=preparer /build /usr/share/nginx/html

RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location ~* \.(js|css|json|png|jpg|jpeg|gif|ico|svg|woff2?)$ { expires 1d; add_header Cache-Control "public, immutable"; }
}
EOF

EXPOSE 8080

# nginxinc/nginx-unprivileged 는 이미 USER nginx (비루트)
CMD ["nginx", "-g", "daemon off;"]
