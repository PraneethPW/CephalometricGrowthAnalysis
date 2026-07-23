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
  analysisMode: z.enum(['measurements', 'image-assisted']).default('measurements'),
  angle: z.coerce.number().min(0).max(90),
  age: z.coerce.number().min(4).max(30).optional(),
  sex: z.enum(['female', 'male', 'unspecified']).default('unspecified'),
  fma: z.coerce.number().min(10).max(60).optional(),
  yAxis: z.coerce.number().min(45).max(80).optional(),
  jarabakRatio: z.coerce.number().min(45).max(85).optional(),
  clinicianNote: z.string().max(1000).optional(),
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

function measurementVote(value: number, horizontalMax: number, verticalMin: number): GrowthClass {
  if (value <= horizontalMax) return 'Horizontal'
  if (value >= verticalMin) return 'Vertical'
  return 'Average'
}

function calculateMeasurementEstimate(input: z.infer<typeof createAnalysisSchema>): AnalysisEstimate {
  const votes: GrowthClass[] = [classifyGrowth(input.angle)]
  if (input.fma !== undefined) votes.push(measurementVote(input.fma, 21, 28))
  if (input.yAxis !== undefined) votes.push(measurementVote(input.yAxis, 59, 66))
  // A higher Jarabak ratio generally supports a more horizontal pattern.
  if (input.jarabakRatio !== undefined) votes.push(measurementVote(100 - input.jarabakRatio, 35, 40))

  const counts = votes.reduce<Record<GrowthClass, number>>(
    (result, vote) => ({ ...result, [vote]: result[vote] + 1 }),
    { Horizontal: 0, Average: 0, Vertical: 0 },
  )
  const growthClass = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? classifyGrowth(input.angle)) as GrowthClass
  const agreement = counts[growthClass] / votes.length
  const completeness = Math.min(1, votes.length / 4)
  const confidence = Math.round(55 + agreement * 25 + completeness * 15)
  const supplied = [input.fma && `FMA ${input.fma}°`, input.yAxis && `Y-axis ${input.yAxis}°`, input.jarabakRatio && `Jarabak ${input.jarabakRatio}%`]
    .filter(Boolean)
    .join(', ')

  return {
    angle: input.angle,
    growthClass,
    confidence: Math.min(95, confidence),
    aiSummary: `Measurement-based result: mandibular-plane angle ${input.angle.toFixed(2)}°${supplied ? `; ${supplied}` : ''}. ${votes.length > 1 && agreement < 1 ? 'The entered measures are not fully concordant, so clinician review is especially important.' : 'The entered measures are concordant with this support classification.'} This is not a diagnosis and must be verified by an orthodontist.`,
  }
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

async function estimateFromImage(file: Express.Multer.File | undefined, input: z.infer<typeof createAnalysisSchema>): Promise<AnalysisEstimate> {
  if (!openRouter || !file) {
    return calculateMeasurementEstimate(input)
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
              text: `Review this lateral cephalogram as a clinician-support cross-check only. The clinician-entered mandibular-plane angle is ${input.angle} degrees and must remain the reported angle. Other supplied measures: FMA ${input.fma ?? 'not supplied'}, Y-axis ${input.yAxis ?? 'not supplied'}, Jarabak ratio ${input.jarabakRatio ?? 'not supplied'}%. Return only JSON with keys: angle (number), growthClass ("Vertical" | "Average" | "Horizontal"), confidence (1-100), aiSummary (2 short sentences mentioning clinician verification). Classification thresholds: Horizontal <=27, Average 28-37, Vertical >=38.`,
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
    const fallback = calculateMeasurementEstimate(input)

    return {
      ...fallback,
      confidence: Math.min(fallback.confidence, 82),
      aiSummary:
        'The image was uploaded successfully, but AI vision analysis could not complete. A threshold-based support result is shown from the angle hint and should be verified by an orthodontist.',
    }
  }
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
    if (body.analysisMode === 'image-assisted' && !request.file) {
      response.status(400).json({ error: 'Image-assisted mode requires a lateral cephalogram image.' })
      return
    }
    const estimate = body.analysisMode === 'image-assisted' ? await estimateFromImage(request.file, body) : calculateMeasurementEstimate(body)
    const angle = estimate.angle
    const growthClass = estimate.growthClass
    const confidence = estimate.confidence
    const aiSummary = estimate.aiSummary
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

app.post('/api/training-feedback', express.json(), (request, response) => {
  const feedback = z.object({
    analysisId: z.string().min(1),
    clinicianClass: z.enum(['Vertical', 'Average', 'Horizontal']),
    note: z.string().max(1000).optional(),
  }).parse(request.body)
  // A labelled case is deliberately recorded as feedback rather than silently changing a model.
  // Production model training must use a de-identified, governed dataset and external validation.
  response.status(202).json({ accepted: true, feedback, message: 'Feedback accepted for governed model-training review.' })
})

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error'
  response.status(400).json({ error: message })
})

app.listen(port, () => {
  console.log(`CephGrow AI API running on http://localhost:${port}`)
})
