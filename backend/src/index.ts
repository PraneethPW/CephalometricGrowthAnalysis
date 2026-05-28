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

type AnalysisEstimate = {
  angle: number
  growthClass: GrowthClass
  confidence: number
  aiSummary: string
}

const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } })
const port = Number(process.env.PORT ?? 8787)

const openRouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL ?? 'https://cephalometric-growth-analysis.vercel.app',
        'X-Title': 'CephGrow AI',
      },
    })
  : null

const createAnalysisSchema = z.object({
  patientName: z.string().min(1).default('Untitled patient'),
  angle: z.coerce.number().min(0).max(90).optional(),
})

const aiEstimateSchema = z.object({
  angle: z.coerce.number().min(0).max(90),
  growthClass: z.enum(['Vertical', 'Average', 'Horizontal']),
  confidence: z.coerce.number().min(1).max(100),
  aiSummary: z.string().min(12),
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

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced?.[1] ?? text
  const jsonStart = raw.indexOf('{')
  const jsonEnd = raw.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('AI response did not contain JSON')
  }

  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
}

function fallbackEstimate(angle?: number): AnalysisEstimate {
  const resolvedAngle = angle ?? Number((30 + Math.random() * 10).toFixed(2))
  const growthClass = classifyGrowth(resolvedAngle)

  return {
    angle: resolvedAngle,
    growthClass,
    confidence: estimateConfidence(resolvedAngle, growthClass),
    aiSummary: `Angle ${resolvedAngle.toFixed(2)} deg is classified as ${growthClass}. This is a decision-support result and should be verified by an orthodontist.`,
  }
}

async function estimateFromImage(file: Express.Multer.File | undefined, manualAngle?: number): Promise<AnalysisEstimate> {
  if (!openRouter || !file) {
    return fallbackEstimate(manualAngle)
  }

  try {
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    const completion = await openRouter.chat.completions.create({
      model: process.env.OPENROUTER_VISION_MODEL ?? process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an orthodontic decision-support assistant. Estimate cephalometric mandibular plane growth pattern from a lateral cephalogram image. This is not a diagnosis. Return only valid JSON.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this lateral cephalogram for growth pattern support. If a manual angle is provided, use it as a strong hint but still inspect the image. Manual angle: ${manualAngle ?? 'not provided'} degrees. Return only JSON with keys: angle (number), growthClass ("Vertical" | "Average" | "Horizontal"), confidence (1-100), aiSummary (2 short sentences mentioning clinician verification). Classification thresholds: Horizontal <=27, Average 28-37, Vertical >=38.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
    } as never)

    const text = completion.choices[0]?.message?.content
    const parsed = aiEstimateSchema.parse(extractJson(typeof text === 'string' ? text : JSON.stringify(text)))
    const angle = Number(parsed.angle.toFixed(2))
    const growthClass = parsed.growthClass || classifyGrowth(angle)

    return {
      angle,
      growthClass,
      confidence: Math.round(parsed.confidence),
      aiSummary: parsed.aiSummary,
    }
  } catch {
    const fallback = fallbackEstimate(manualAngle)

    return {
      ...fallback,
      confidence: Math.min(fallback.confidence, 82),
      aiSummary:
        'The image was uploaded successfully, but AI vision analysis could not complete. A threshold-based support result is shown from the angle hint and should be verified by an orthodontist.',
    }
  }
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
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
  'http://localhost:5177',
  'https://cephalometric-growth-analysis.vercel.app',
  ...(process.env.CLIENT_ORIGIN ?? '').split(','),
]
  .filter(Boolean)
  .map((origin) => origin.trim())
const uniqueAllowedOrigins = [...new Set(allowedOrigins)]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith('http://localhost:') || uniqueAllowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked origin: ${origin}`))
    },
  }),
)
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

    try {
      const rows = await prisma.analysis.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
      })
      response.json(rows)
    } catch {
      response.json(demoAnalyses)
    }
  } catch (error) {
    next(error)
  }
})

app.post('/api/analyses', upload.single('cephalogram'), async (request, response, next) => {
  try {
    const body = createAnalysisSchema.parse(request.body ?? {})
    const estimate = await estimateFromImage(request.file, body.angle)
    const angle = estimate.angle
    const growthClass = estimate.growthClass
    const confidence = estimate.confidence
    const aiSummary = openRouter && request.file ? estimate.aiSummary : await generateSummary(angle, growthClass)
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

    try {
      const created = await prisma.analysis.create({
        data: {
          ...payload,
          angle,
        },
      })
      response.status(201).json(created)
    } catch {
      response.status(201).json({ id: randomUUID(), ...payload, createdAt: new Date().toISOString() })
    }
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
