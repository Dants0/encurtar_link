import {createClient} from 'redis';

export const redis = createClient({
    url: 'redis://:redis@localhost:6379'
})

redis.connect()