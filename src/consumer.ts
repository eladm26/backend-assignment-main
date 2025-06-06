    import { Config } from "./config"
    import { StreetsService } from "./israelistreets/StreetsService"
    import { PostgresService } from "./postgresService/postgres"
    import { RabbitmqService } from "./rabbitService/rmq"

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    export async function consume() {
        const rabbitmq = await RabbitmqService.init()
        const pgService = await PostgresService.init()
        await rabbitmq.subscribe(Config.rabbitMq.queueConfig.queue, async (message) => {
            const streetData = JSON.parse(message.content.toString())
            const street = await StreetsService.getStreetInfoById(streetData.streetId)
            console.log(`${street.city_name}: ${street.street_name}`);
            await sleep(5000);

            const streetValues = [
                street.streetId,
                street.region_code,
                street.region_name,
                street.city_code,
                street.city_name,
                street.street_code,
                street.street_name,
                street.street_name_status,
                street.official_code
            ]
            await pgService.query(
                `Insert into ${Config.postgres.dbConfig.streetsTableName}
                values($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (streed_id)
                DO UPDATE SET
                    streed_id = EXCLUDED.streed_id,
                    region_code = EXCLUDED.region_code,
                    region_name = EXCLUDED.region_name,
                    city_name = EXCLUDED.city_name,
                    street_name = EXCLUDED.street_name,
                    street_name_status = EXCLUDED.street_name_status,
                    official_code = EXCLUDED.official_code`, streetValues
                )
        })
    }
    consume()