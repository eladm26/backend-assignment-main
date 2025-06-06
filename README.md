# **Draftt-debug-session-interview**
### Description
- This repository contains a solution to the assignment detailed below
- This solution is a basic implementation using PostgreSQL and rabbitMQ
	- There is an existing mongoDB consumer implementation as well
- Feel free to change **anything you want** in the code - changing the implementations, implementing it with a different databases/queuing service of your choosing, and adding whichever enhancements you want
	- If you changed anything in the codebase - please share the changes with us before the debug session
- You should be comfortable with the codebase, running the code, debugging it and making changes
- To run the project:
	- Make sure docker, node, and typescript are installed
	- Run "docker compose up -d"
	- Run "npm install"
	- Run "tsc"
	- Run "npm run consume" - this will spin up the consumer process
	- Run "npm i -g" - to install the cli
	- Run "cityStreets X" - replacing X with the city of your choice
## Assignment definition:
Your assignment is to insert data about street names in israel to a database, using some kind of a queueing platform.\
The assignment is to be done in nodejs + Typescript. \
Inside of the repository you will find a StreetsService class which provides you the data from the api.\
The list of cities is provided inside of the cities.ts file.\
Feel free to make changes to the StreetsService class if you feel they are necessary.
 - If you want to take a look at the raw data - https://data.gov.il/dataset/israel-streets-synom/resource/1b14e41c-85b3-4c21-bdce-9fe48185ffca

To complete the assignment you will need to select a database, sql or no-sql (for example: postgres, mongo) and a queueing service (for example - rabbitmq, kafka), either from the provided dependencies, or one of your choice (commit it to your solution if you chose a different one).\
You will need to create two services:
 - Publishing service - A service that will get the data from the StreetsService and publish it to the queuing platform
 - A service that will consume the data from the queuing service and persisit it to the database

 Publishing service specification:
  - Will be activated by CLI, accepting a city name from the list of cities
  - Will query the StreetsService for all streets of that city
  - Will publish to the queueing platform the streets it needs to insert

Consuming service specification:
  - Will consume from the messaging queue
  - Will persist the streets data to the selected database

The persisted streets need to contain all data from the api
---
## Provided dependencies:
 Provided is a docker-compose file which contains all of the dependencies that you will need to complete the assignment.
 **You do not need to lift all of the services**, you can choose which you need as listed in the assignment specification.
 ### The docker-compose exposes the following services:
  - PostgreSQL
	- exposed on localhost port 5432
	- Adminer UI is exposed on localhost port 8089
		- Authentication:
			- System: PostgreSQL
			- Server: postgres
			- Username: postgres
			- Password: password
			- Database: postgres
  
  - mongoDB
  	- No-sql database, Version - 4.2
	- exposed on localhost port 27017
	- Can be connected to with studio 3t with no need for authentication - https://studio3t.com/download/

 - RabbitMQ
	- backend exposed on port 5672
	- management UI exposed on port 15672
		- Authentication:
			- Username: guest
			- Password: guest

 - Redpanda
	- Fully Kafka-api compatible data streaming platform
	- Kafka broker exposed on port 9092
	- UI exposed on port 8014 with no need for authentication

If you would like to a different service for a database/queueing system feel free to do so, as long as they adhere to the assignement specifications


---

If you have any questions about the assignment you can send them to shachar@draftt.io
Good luck!
