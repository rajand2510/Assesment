import cron from 'node-cron'
import { connectDatabase } from '../config/database.js'
import { processDailyRoi } from '../services/roiService.js'

await connectDatabase()

cron.schedule(
  '0 0 * * *',
  async () => {
    try {
      const result = await processDailyRoi()
      console.info('Daily ROI job completed', result)
    } catch (error) {
      console.error('Daily ROI job failed', error)
    }
  },
  { timezone: 'UTC', noOverlap: true },
)

console.info('Local ROI scheduler started (00:00 UTC)')
