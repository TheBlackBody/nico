FROM nginx

WORKDIR /etc/nginx

RUN apt-get update && apt-get install -y certbot openssl

COPY ./conf/nginx.conf /etc/nginx/nginx.conf
COPY ./tools/config.sh /etc/nginx/config.sh

RUN mkdir /etc/nginx/ssl

RUN mkdir -p /var/cache/nginx/client_temp && \
    chmod -R 755 /var/cache/nginx

RUN chmod +x /etc/nginx/config.sh

EXPOSE 443

CMD ["sh", "config.sh"]