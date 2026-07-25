import { app } from './app.js'
import { connectDatabase } from './config/database.js'

const port = Number(process.env.PORT ?? 3000)

await connectDatabase()
app.listen(port, () => {
  console.info(`API listening on http://localhost:${port}`)
})
