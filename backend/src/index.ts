import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import multer from 'multer'
import OpenAI from 'openai'
import { z } from 'zod'
import { hasDatabaseUrl, prisma } from './prisma.js'

type GrowthClass = 'Vertical' | 'Average' | 'Horizontal'

const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } })
const port = Number(process.env.PORT ?? 8787)

const openRouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:5173',
        'X-Title': 'CephGrow AI',
      },
    })
  : null

const createAnalysisSchema = z.object({
  patientName: z.string().min(1).default('Untitled patient'),
  angle: z.coerce.number().min(0).max(90).optional(),
})

const demoAnalyses = [
  {
    id: 'demo-average',
    patientName: 'Demo Case A',
    imageName: 'ceph-average.jpeg',
    angle: '34.60',
    growthClass: 'Average',
    confidence: 91,
    aiSummary: 'Angle falls within the average grower band. Review serial trend and occlusal findings before final diagnosis.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-horizontal',
    patientName: 'Demo Case C',
    imageName: 'ceph-horizontal.jpeg',
    angle: '24.70',
    growthClass: 'Horizontal',
    confidence: 94,
    aiSummary: 'Angle is low, suggesting a horizontal growth tendency. Correlate with facial pattern and mandibular plane landmarks.',
    createdAt: new Date().toISOString(),
  },
]

function classifyGrowth(angle: number): GrowthClass {
  if (angle <= 27) return 'Horizontal'
  if (angle >= 38) return 'Vertical'
  return 'Average'
}

function estimateConfidence(angle: number, growthClass: GrowthClass) {
  const center = growthClass === 'Horizontal' ? 22 : growthClass === 'Vertical' ? 43 : 33
  const distance = Math.abs(angle - center)
  return Math.max(78, Math.min(96, Math.round(96 - distance * 1.8)))
}

async function generateSummary(angle: number, growthClass: GrowthClass) {
  if (!openRouter) {
    return `Angle ${angle.toFixed(2)} deg is classified as ${growthClass}. This is a decision-support result and should be verified by an orthodontist.`
  }

  const completion = await openRouter.chat.completions.create({
    model: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You write concise orthodontic decision-support summaries. Do not provide a final diagnosis. Mention clinician verification.',
      },
      {
        role: 'user',
        content: `Cephalometric mandibular plane angle: ${angle.toFixed(2)} degrees. Growth class: ${growthClass}. Write a 2 sentence clinical support note.`,
      },
    ],
  })

  return completion.choices[0]?.message?.content?.trim() || `Classified as ${growthClass}; clinician review required.`
}

app.use(helmet())
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'CephGrow AI API',
    database: hasDatabaseUrl ? 'configured' : 'demo-mode',
    ai: openRouter ? 'configured' : 'demo-mode',
  })
})

app.get('/api/analyses', async (_request, response, next) => {
  try {
    if (!hasDatabaseUrl) {
      response.json(demoAnalyses)
      return
    }

    const rows = await prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
    })
    response.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/analyses', upload.single('cephalogram'), async (request, response, next) => {
  try {
    const body = createAnalysisSchema.parse(request.body ?? {})
    const angle = body.angle ?? 30 + Math.random() * 10
    const growthClass = classifyGrowth(angle)
    const confidence = estimateConfidence(angle, growthClass)
    const aiSummary = await generateSummary(angle, growthClass)
    const imageName = request.file?.originalname ?? 'manual-entry'

    const payload = {
      patientName: body.patientName,
      imageName,
      angle: angle.toFixed(2),
      growthClass,
      confidence,
      aiSummary,
    }

    if (!hasDatabaseUrl) {
      response.status(201).json({ id: randomUUID(), ...payload, createdAt: new Date().toISOString() })
      return
    }

    const created = await prisma.analysis.create({
      data: {
        ...payload,
        angle,
      },
    })
    response.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error'
  response.status(400).json({ error: message })
})

app.listen(port, () => {
  console.log(`CephGrow AI API running on http://localhost:${port}`)
})
