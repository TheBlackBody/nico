include srcs/.env

all: up

up:
	@cd srcs && docker-compose up 

upb:
	@cd srcs && docker-compose up --build 

upbd:
	@cd srcs && docker-compose up --build -d 


fclean :
	@cd srcs/
	@docker-compose stop || true
	@docker rm $$(docker ps -qa) || true
	@docker rmi -f $$(docker images -qa) || true
	@docker volume rm $$(docker volume ls -q) || true
	@docker network rm $$(docker network ls -q) || true

re: fclean up

reb: fclean upb

red: fclean upbd

online: 
	@docker run --net=host -it -e NGROK_AUTHTOKEN=$(NGROK_AUTHTOKEN) ngrok/ngrok:latest http --domain=stirred-crab-needlessly.ngrok-free.app https://localhost:$(NGROK_PORT)

db: 
	@docker exec -it srcs-postgres-1 psql -U $(DB_USER) -d $(DB_NAME)
