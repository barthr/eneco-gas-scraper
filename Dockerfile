FROM ubuntu

# update 
RUN apt update && apt upgrade -y
RUN apt install curl -y
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash
RUN apt install nodejs -y
RUN node -v
RUN npm -v

RUN mkdir /app
WORKDIR /app
COPY ./ /app/

RUN npm install
RUN npx playwright install-deps chromium

CMD [ "node", "index.js"]