
import axios, { Axios } from 'axios';
import { omit } from 'lodash';
import { cities, city, englishNameByCity } from './cities';

export interface Street extends Omit<ApiStreet, '_id'> {
    streetId: number
}

interface ApiStreet {
    _id: number
    region_code: number
    region_name: string
    city_code: number
    city_name: string
    street_code: number
    street_name: string
    street_name_status: string
    official_code: number
};

type CityResult = { city: city, streets: Pick<Street, 'streetId' | 'street_name'>[] };

class NoStreetsError extends Error {};
class InvalidCityNameError extends Error {};

export class StreetsService {
    private static _axios: Axios
    private static get axios() {
        if (!this._axios) {
            this._axios = axios.create({})
        }
        return this._axios
    }
    static async getStreetsInCity(city: city, limit: number = 100000, offset: number = 0): Promise<{ city: city, streets: Pick<Street, 'streetId' | 'street_name'>[] }> {
        const cityName = cities[city];
        if (!cityName) {
            console.log(`${city} is not a valid city`);
            throw new InvalidCityNameError(`${city} is not a valid city`)
        }

        const res = (await this.axios.post(
            'https://data.gov.il/api/3/action/datastore_search',
            {
                resource_id: `1b14e41c-85b3-4c21-bdce-9fe48185ffca`,
                filters: { city_name:  cityName},
                limit,
                offset,

            })).data;

        const results = res.result.records
        if (!results || !results.length) {
            console.log('No streets found for city: ' + city);
            return { city, streets: []}
        }
        const streets: Pick<Street, 'streetId' | 'street_name'>[] = results.map((street: ApiStreet) => {
            console.log(`${city}: ${street.street_name.trim()}`);
            return { streetId: street._id, street_name: street.street_name.trim() }
        })

        return { city, streets }
    }

    static async getStreetsForMultipleCities(
        cities: city[],
        handler: (streets: Pick<Street, "streetId" | "street_name">[]) => Promise<void>
    ) {
        const BATCH_SIZE = 100;

        const cityPromises = cities.map(async (cityName): Promise<void> =>  {
            let offset = 0;
            let hasMoreCities = true;

            try {
                while (hasMoreCities) {
                    console.log(`Fetching batch for ${cityName} (offset: ${offset}, limit: ${BATCH_SIZE})`);
                    const res = await this.getStreetsInCity(cityName, BATCH_SIZE, offset);

                    if (res.streets.length === 0) {
                        hasMoreCities = false;
                    } else {
                        await handler(res.streets);
                        offset += BATCH_SIZE;
                    }
                }

            } catch (error) {
                console.log('got error in getStreetsForMultipleCities');

            }
        })

        await Promise.all(cityPromises);
    }

    static async getStreetInfoById(id: number) {
        let res: any;
        res = (await this.axios.post(
            'https://data.gov.il/api/3/action/datastore_search',
            { resource_id: `1b14e41c-85b3-4c21-bdce-9fe48185ffca`,
                filters: { _id: id },
                limit: 1 })).data;

        const results = res.result.records
        if (!results || !results.length) {
            throw new Error('No street found for id: ' + id)
        }
        const dbStreet: ApiStreet = results[0]
        const cityName = englishNameByCity[dbStreet.city_name]
        const street: Street = { ...omit(dbStreet, '_id'), streetId: dbStreet._id, city_name: cityName, region_name: dbStreet.region_name.trim(), street_name: dbStreet.street_name.trim() }
        return street
    }

    static async getStreetInfoByIds(ids: number[]): Promise<Street[]> {
        let res: any;
        res = (await this.axios.post(
            'https://data.gov.il/api/3/action/datastore_search',
            { resource_id: `1b14e41c-85b3-4c21-bdce-9fe48185ffca`,
                filters: { _id: ids },
                limit: 1000 })).data;

        const results = res.result.records
        if (!results || !results.length) {
            throw new Error('No street found for ids: ' + ids)
        }
        const dbStreets: ApiStreet[] = results
        const streets = dbStreets.map(dbStreet => {
            const cityName = englishNameByCity[dbStreet.city_name]
            const street: Street = { ...omit(dbStreet, '_id'), streetId: dbStreet._id, city_name: cityName, region_name: dbStreet.region_name.trim(), street_name: dbStreet.street_name.trim() }
            return street
        })
        return streets;
    }
}
