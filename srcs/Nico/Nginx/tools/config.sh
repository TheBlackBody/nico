if [ ! -f /etc/nginx/ssl/private_key.pem ]; then
    openssl genpkey -algorithm RSA -out /etc/nginx/ssl/private_key.pem > /dev/null 2>&1
    echo "Private key generated."
fi

if [ ! -f /etc/nginx/ssl/cert.pem ]; then
    openssl req -new -x509 -key /etc/nginx/ssl/private_key.pem -out /etc/nginx/ssl/cert.pem -days 365 \
        -subj "/C=FR/ST=Nice/L=Nice/O=42Nice/OU=ProjetNico/CN=Projet.Nico.fr" > /dev/null 2>&1
    echo "TLS certificate generated."
fi

echo "Starting projet_nico webserver..."

nginx -g "daemon off;"