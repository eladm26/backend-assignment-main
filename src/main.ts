#! /usr/bin/env node

import type { city } from "./israelistreets/cities"
import { Street, StreetsService } from "./israelistreets/StreetsService"
import { PostgresService } from "./postgresService/postgres"
import { RabbitmqService } from "./rabbitService/rmq"

const main = async (cities: city[]) => {
    await PostgresService.init();
    const rabbitmq = await RabbitmqService.init();

    const streetsHandler = async (streets: Street[]) => {
        const streetIds = streets.map(street => street.streetId)
        await rabbitmq.publish(streetIds);
        console.log(`published ${streetIds}`);
    }

    await StreetsService.getStreetsForMultipleCities(
        cities,
        streetsHandler
    )
    console.log('Done!!!!!')
    process.exit(0)
}
const requestedCities = process.argv.slice(2)
main(requestedCities as city[])