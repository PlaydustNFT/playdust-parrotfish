FROM node:16-bullseye-slim

WORKDIR /shared

COPY shared/package*.json ./
RUN npm install
COPY shared .

WORKDIR /app
COPY api .
WORKDIR /app/api
RUN npm install
RUN npm run build
COPY api/entrypoint.sh /
RUN chmod +x /entrypoint.sh
WORKDIR /app
RUN echo 'export $(strings /proc/1/environ | grep AWS_CONTAINER_CREDENTIALS_RELATIVE_URI)' >> /root/.profile
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
RUN file="$(ls -l /app/dist/*)" && echo $file

