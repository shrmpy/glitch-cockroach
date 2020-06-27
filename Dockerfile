
FROM node:14.4-buster-slim
ENV PATH=$PATH:.:/root

# try to mimic glitch env
WORKDIR /root
COPY . .
RUN mkdir /root/.data ;\
    npm install 
RUN apt-get update 
RUN apt-get install -y wget



CMD ["npm", "start"]

