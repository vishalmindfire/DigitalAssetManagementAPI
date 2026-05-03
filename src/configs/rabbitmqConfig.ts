import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

export const EXCHANGE = 'dam.events';
export const QUEUE = 'dam.file.uploaded';

export async function createRabbitMQChannel(): Promise<{ channel: amqplib.Channel; connection: amqplib.ChannelModel }> {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, 'file.uploaded');

  return { channel, connection };
}
