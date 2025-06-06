#! /usr/bin/env node

import { StreetsService } from "./israelistreets/StreetsService"
import { PostgresService } from "./postgresService/postgres"
import { RabbitmqService } from "./rabbitService/rmq"

const main = async (city) => {
    console.log('Starting!')
    await PostgresService.init()
    const rabbitmq = await RabbitmqService.init()
    const streetInfo = await StreetsService.getStreetsInCity(city)
    await Promise.all(streetInfo.streets.map(async (street) => {
        await rabbitmq.publish( {streetId: street.streetId})
    }))
    console.log('Done!!')
    process.exit(0)
}
const requestedCity = process.argv[2]
main(requestedCity)