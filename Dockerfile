# PuppyTalk 프론트엔드 - 정적 파일을 nginx로 서빙
# 빌드 시 API 주소: docker build --build-arg API_BASE_URL=http://backend:8000/v1 -t puppytalk-fe .

FROM nginx:alpine

ARG API_BASE_URL=http://127.0.0.1:8000/v1

# 정적 파일 복사
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY img /usr/share/nginx/html/img
COPY js /usr/share/nginx/html/js

# 배포 시 API 주소 치환 (config.js)
RUN sed -i "s#http://127.0.0.1:8000/v1#${API_BASE_URL}#g" /usr/share/nginx/html/js/config.js

# nginx 설정 (heredoc으로 한 파일에 유지, 따옴표 EOF로 $uri가 그대로 기록됨)
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location ~* \.(js|css|json|png|jpg|jpeg|gif|ico|svg|woff2?)$ { expires 1d; add_header Cache-Control "public, immutable"; }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
