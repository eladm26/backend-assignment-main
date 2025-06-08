import { AxiosError, HttpStatusCode } from "axios";
import { Config } from "./config"
import { Street, StreetsService } from "./israelistreets/StreetsService"
import { PostgresService } from "./postgresService/postgres"
import { RabbitmqService } from "./rabbitService/rmq"

let streetDataBuffer = [];

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function insertBulk(pgService: PostgresService) {
    if (streetDataBuffer.length === 0) {
        return;
    }

    const bulkToInsert = [...streetDataBuffer];
    streetDataBuffer = [];

    const valuesPlaceholders = [];
    const allValues = [];
    let valueIndex = 1;
    for (const street of bulkToInsert) {
        valuesPlaceholders.push(
            `($${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++}, $${valueIndex++})`
        );

        allValues.push(...Object.values(street));
    }


    const query = `
        INSERT INTO ${Config.postgres.dbConfig.streetsTableName}
        VALUES ${valuesPlaceholders.join(', ')}
        ON CONFLICT (streed_id)
        DO UPDATE SET
            region_code = EXCLUDED.region_code,
            region_name = EXCLUDED.region_name,
            city_name = EXCLUDED.city_name,
            street_name = EXCLUDED.street_name,
            street_name_status = EXCLUDED.street_name_status,
            official_code = EXCLUDED.official_code;
    `;

    try {
        await pgService.query('BEGIN');
        await pgService.query(query, allValues);
        await pgService.query('COMMIT');
        console.log(`Successfully inserted/updated batch of ${bulkToInsert.length} streets.`);
    } catch (error) {
        await pgService.query('ROLLBACK');
        console.error('Error inserting batch:', error);
    }
}

export async function consume() {
    const rabbitmq = await RabbitmqService.init()
    const pgService = await PostgresService.init()

    await rabbitmq.subscribe(Config.rabbitMq.queueConfig.queue, async (message) => {
        const streetIds: number[] = JSON.parse(message.content.toString())
        try {
            console.log(`consuming ids: ${streetIds}`);

            const streets: Street[] = await StreetsService.getStreetInfoByIds(streetIds);
            console.log(`got ${streets.length} streets`);

            streets.map((street: Street) => {
            console.log(`${street.city_name}: ${street.street_name}`);
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

            streetDataBuffer.push(streetValues);
        })

            if (streetDataBuffer.length >= 100) {
                await insertBulk(pgService);
            }
        } catch(error) {
            if (error instanceof AxiosError) {
                if (error.status === HttpStatusCode.ServiceUnavailable) {
                    console.error("got rate limit error");
                    throw(error);
                }
            }
        }
        await sleep(5000);
    })
}
consume()