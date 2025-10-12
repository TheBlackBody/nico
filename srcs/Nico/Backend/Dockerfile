FROM python:3.10-slim

RUN apt-get update && apt-get install -y netcat-openbsd

RUN apt-get install -y \
    vim \
    curl 
#    --no-install-recommends \
#    && npm install -g truffle \
#    && npm cache clean --force 

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN pip install --upgrade pip
RUN pip install -r ./tools/requirement.txt

EXPOSE 8000

ENTRYPOINT ["sh", "tools/setup.sh"]