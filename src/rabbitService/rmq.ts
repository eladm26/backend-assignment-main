import * as amqplib from 'amqplib'
import { Config } from '../config'


export class RabbitmqService {
    constructor(
        private _rmq: amqplib.ChannelModel,
        private _channel: amqplib.ConfirmChannel
    ){}
    static async init(): Promise<RabbitmqService> {
        try {
            const _rmq = await amqplib.connect(Config.rabbitMq.connection)
            const _channel = (await _rmq.createConfirmChannel())
            await _channel.assertQueue(Config.rabbitMq.queueConfig.queue)
            await _channel.assertExchange(Config.rabbitMq.queueConfig.exchange, 'topic')
            await _channel.bindQueue(Config.rabbitMq.queueConfig.queue, Config.rabbitMq.queueConfig.exchange, '#')
            _channel.prefetch(Config.rabbitMq.prefetchCount)
            return new RabbitmqService(_rmq, _channel)
        }
        catch (error) {
            console.error(`Failed connecting to RMQ: ${error}`)
            throw error
        }
    }

    async publish(message: any, options?: { routingKey?: string, exchange?: string }) {
        const routingKey = options?.routingKey || '#'
        const exchange = options?.exchange || Config.rabbitMq.queueConfig.exchange
        await new Promise((res, rej) => {
            this._channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), { contentType: 'application/json' }, (err, _) => {
                if (err){
                    rej(err)
                }else{
                    res('Message published')
                }
            })
        })
    }

    async subscribe(queueName: string, callback: (message: any) => Promise<void>) {
        const queue = queueName || Config.rabbitMq.queueConfig.queue
        await this._channel.consume(queueName, async (message) => {
            if (!message){
                throw new Error('Recieved null message')
            }
            try {
                await callback(message)
                this._channel.ack(message)
            } catch (error) {
                this._channel.nack(message, false, true)
            }
        })
    }

     public nack(message: amqplib.ConsumeMessage, allUpTo: boolean = false, requeue: boolean = true): void {
        this._channel.nack(message, allUpTo, requeue);
        if (requeue) {
            console.log(`Message nacked and re-queued: ${message.fields.deliveryTag}`);
        } else {
            console.log(`Message nacked (discarded/dead-lettered): ${message.fields.deliveryTag}`);
        }
    }
}
