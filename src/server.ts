import fastify from "fastify";
import {z} from 'zod'
import { sql } from "./connections/postgres";
import postgres from "postgres";
import { redis } from "./connections/redis";

const app = fastify()

app.listen({ port: 3001 })
  .then((address) => console.log(`server listening on ${address}`))
  .catch(err => {
    console.log('Error starting server:', err)
    process.exit(1)
  })

app.get("/:code", async(req, reply)=>{
    
    const getSchemaLink = z.object({
        code: z.string().min(3)
    })

    const {code} = getSchemaLink.parse(req.params)

    const result = await sql`
        select id, original_url from shortLinks where shortLinks.code = ${code}
    `
    
    const link = result[0]

    await redis.zIncrBy('metrics', 1, String(link.id))

    return reply.redirect(301, link.original_url)
})


app.get("/api/metrics", async(req, reply)=>{
    const result = await redis.zRangeByScoreWithScores("metrics", 0, 50)

    const metrics = result.sort((a,b)=> b.score - a.score).map(item=>{
        return {
            shortLinkId: Number(item.value),
            clicks: item.score
        }
    })

    return metrics
})

app.post('/api/links', async (req, reply) => {
    


    const createSchemaZod = z.object({
        code: z.string().min(3),
        url: z.string().url(),

    });
    
    const {code, url} = createSchemaZod.parse(req.body);

    try{

        const result = await sql`
        insert into shortLinks (code, original_url) values (${code}, ${url}) returning id
    `

    const link = result[0]

    return reply.status(201).send({
        shortLinkId: link.id,
    })
    
    }catch(err){
        if(err instanceof postgres.PostgresError){
            if(err.code === '23505'){
                return reply.status(400).send({
                    message: "Duplicated code"
                })
            }
        }
    }

   return reply.status(500).send({
    message: "Server internal error"
   })

})

app.get("/api/links", async (req, reply) => {
    const result = await sql`
        select * from shortLinks order by created_at desc
    `

    reply.status(200).send({
        data: result
    })

})