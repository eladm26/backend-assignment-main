#! /usr/bin/env node

import type { city } from "./israelistreets/cities"
import { StreetsService } from "./israelistreets/StreetsService"
import { PostgresService } from "./postgresService/postgres"
import { RabbitmqService } from "./rabbitService/rmq"

const main = async (cities: city[]) => {
    await PostgresService.init()
    const rabbitmq = await RabbitmqService.init()
    const allCitiesStreetsData = await StreetsService.getStreetsForMultipleCities(cities)
    const allStreets = allCitiesStreetsData.flatMap(cityData => cityData.streets)
    await Promise.all(allStreets.map(async (street) => {
        await rabbitmq.publish( {streetId: street.streetId})
    }))
    console.log('Done!!!!!')
    process.exit(0)
}
const requestedCities = process.argv.slice(2)
main(requestedCities as city[])