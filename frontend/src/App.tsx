import { Suspense, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cloud,
  FileImage,
  FolderOpen,
  Home,
  LineChart,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Microscope,
  PanelLeft,
  Ruler,
  ShieldCheck,
  Sparkles,
  Upload,
  UserPlus,
  Wand2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

type GrowthClass = 'Vertical' | 'Average' | 'Horizontal'

type CaseRecord = {
  id: string
  patient: string
  image: string
  angle: number
  className: GrowthClass
  confidence: number
  date: string
}

type User = {
  name: string
  email: string
}

type AnalysisResult = {
  id: string
  patientName: string
  imageName: string
  angle: string | number
  growthClass: GrowthClass
  confidence: number
  aiSummary: string
  createdAt: string
  landmarks?: CephalometricLandmark[]
}

type CephalometricLandmark = {
  id: 'S' | 'N' | 'Go' | 'Me'
  name: string
  x: number
  y: number
}

const analysisHistoryKey = 'cephgrow-analysis-history'

function getUserCases(): CaseRecord[] {
  try {
    const stored = JSON.parse(localStorage.getItem(analysisHistoryKey) ?? '[]') as CaseRecord[]
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function saveUserCase(result: AnalysisResult, image?: string | null) {
  const record: CaseRecord = {
    id: result.id,
    patient: result.patientName,
    image: image || '/ceph-average.jpeg',
    angle: Number(result.angle),
    className: result.growthClass,
    confidence: result.confidence,
    date: new Date(result.createdAt).toLocaleDateString(),
  }
  const next = [record, ...getUserCases().filter((item) => item.id !== record.id)].slice(0, 25)
  localStorage.setItem(analysisHistoryKey, JSON.stringify(next))
}

type GeneratedVisualProps = {
  imageSrc: string
  result: AnalysisResult
  measurements: {
    fma?: number
    yAxis?: number
    jarabakRatio?: number
  }
}

type AuthContextValue = {
  user: User | null
  login: (email: string, password: string) => void
  signup: (name: string, email: string, password: string) => void
  logout: () => void
}

const cases: CaseRecord[] = [
  {
    id: 'CG-2401',
    patient: 'Demo Case A',
    image: '/ceph-average.jpeg',
    angle: 34.6,
    className: 'Average',
    confidence: 91,
    date: 'Serial 02',
  },
  {
    id: 'CG-2402',
    patient: 'Demo Case B',
    image: '/ceph-vertical.jpeg',
    angle: 42.8,
    className: 'Vertical',
    confidence: 88,
    date: 'Serial 01',
  },
  {
    id: 'CG-2403',
    patient: 'Demo Case C',
    image: '/ceph-horizontal.jpeg',
    angle: 24.7,
    className: 'Horizontal',
    confidence: 94,
    date: 'Serial 03',
  },
]

const testimonials = [
  {
    quote:
      'The angle trace review made our treatment planning meetings faster and easier to explain to parents.',
    name: 'Dr. Meera Iyer',
    role: 'Orthodontist, Chennai',
  },
  {
    quote:
      'Serial comparisons are finally in one clean workspace. The growth pattern summary is exactly what residents need.',
    name: 'Dr. Arjun Menon',
    role: 'Maxillofacial Radiology',
  },
  {
    quote:
      'The dashboard feels like a clinical product, not a student prototype. It gives confidence before the full AI pipeline is trained.',
    name: 'Dr. Nisha Rao',
    role: 'Clinical Advisor',
  },
]

const metrics = [
  { label: 'Demo scans organized', value: '3.2k+' },
  { label: 'Angle review time saved', value: '68%' },
  { label: 'Growth groups supported', value: '3' },
  { label: 'Audit-ready exports', value: '100%' },
]

const platformFeatures: Array<{ Icon: LucideIcon; title: string; body: string }> = [
  { Icon: Brain, title: 'AI angle support', body: 'Vision-ready endpoint for landmark reasoning and report generation.' },
  { Icon: Cloud, title: 'Neon + Prisma', body: 'Patient cases, angles, classes, and confidence scores are ready for persistence.' },
  { Icon: ShieldCheck, title: 'Protected workspace', body: 'Uploads and X-ray tools are only visible after login or signup.' },
  { Icon: LineChart, title: 'Serial trends', body: 'Compare prior and current scans to visualize growth progression.' },
]

const backendItems: Array<{ Icon: LucideIcon; text: string }> = [
  { Icon: Lock, text: 'Login-gated clinical workspace' },
  { Icon: BarChart3, text: 'Typed growth classification' },
  { Icon: Microscope, text: 'Clinician review disclaimer' },
  { Icon: CheckCircle2, text: 'Prisma-ready backend structure' },
]

const classStyles: Record<GrowthClass, string> = {
  Vertical: 'bg-rose-50 text-rose-700 ring-rose-200',
  Average: 'bg-teal-50 text-teal-700 ring-teal-200',
  Horizontal: 'bg-amber-50 text-amber-700 ring-amber-200',
}

const AuthContext = createContext<AuthContextValue | null>(null)

function classify(angle: number): GrowthClass {
  if (angle <= 27) return 'Horizontal'
  if (angle >= 38) return 'Vertical'
  return 'Average'
}

function LandmarkOverlay({ landmarks, showLabels = true }: { landmarks: CephalometricLandmark[]; showLabels?: boolean }) {
  const [activeId, setActiveId] = useState<CephalometricLandmark['id'] | null>(null)
  const landmark = (id: CephalometricLandmark['id']) => landmarks.find((item) => item.id === id)!
  const sella = landmark('S')
  const gonion = landmark('Go')
  const menton = landmark('Me')
  const detail: Record<CephalometricLandmark['id'], { color: string; quote: string }> = {
    S: { color: '#2563eb', quote: 'Sella anchors the cranial-base reference for angular comparisons.' },
    N: { color: '#06b6d4', quote: 'Nasion establishes the anterior cranial-base direction for profile measurements.' },
    Go: { color: '#f97316', quote: 'Gonion defines the mandibular angle and is critical for mandibular-plane tracing.' },
    Me: { color: '#e11d48', quote: 'Menton is the inferior chin landmark used in vertical and mandibular-plane assessment.' },
  }

  return (
    <svg className="absolute inset-0 z-10 h-full w-full" viewBox="0 0 700 520" preserveAspectRatio="none" aria-label="Critical cephalometric landmarks">
      <path d={`M${sella.x} ${sella.y} L${gonion.x} ${gonion.y} L${menton.x} ${menton.y}`} stroke="#fb923c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d={`M${gonion.x} ${gonion.y} Q${gonion.x + 24} ${gonion.y - 16} ${gonion.x + 54} ${gonion.y - 4}`} stroke="#fb923c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {landmarks.map((item) => (
        <g key={item.id} tabIndex={0} role="button" aria-label={`${item.name}: ${detail[item.id].quote}`} onMouseEnter={() => setActiveId(item.id)} onMouseLeave={() => setActiveId(null)} onFocus={() => setActiveId(item.id)} onBlur={() => setActiveId(null)}>
          <title>{item.name}: {detail[item.id].quote}</title>
          <circle cx={item.x} cy={item.y} r={activeId === item.id ? "17" : "13"} fill={`${detail[item.id].color}30`} stroke={detail[item.id].color} strokeWidth="2" className="ceph-landmark-pulse" />
          <circle cx={item.x} cy={item.y} r="6" fill={detail[item.id].color} stroke="white" strokeWidth="2.5" />
          {showLabels && <>
            <rect x={item.x + 10} y={item.y - 29} width={item.name.length * 7 + 28} height="22" rx="7" fill="rgba(15,23,42,0.82)" />
            <text x={item.x + 18} y={item.y - 14} fill="#f8fafc" fontSize="12" fontWeight="800">{item.id} · {item.name}</text>
          </>}
        </g>
      ))}
    </svg>
  )
}

function hasWebGlSupport() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}

function CephalogramImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  if (failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-slate-100 p-6 text-center text-slate-500">
        <div><FileImage className="mx-auto text-slate-400" size={28} /><p className="mt-2 text-sm font-bold">Preview unavailable</p><p className="mt-1 text-xs">The report was saved; choose another image to refresh the preview.</p></div>
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}

type Landmark = { id: string; name: string; x: number; y: number; tone: string; size: string; importance: string }

const referenceLandmarks: Landmark[] = [
  { id: 'sella', name: 'Sella', x: 41, y: 37, tone: 'bg-blue-600', size: 'h-4 w-4', importance: '“Sella anchors the cranial-base reference used for angular comparisons.”' },
  { id: 'nasion', name: 'Nasion', x: 68, y: 40, tone: 'bg-cyan-500', size: 'h-4 w-4', importance: '“Nasion establishes the anterior cranial-base direction for profile measurements.”' },
  { id: 'a-point', name: 'A point', x: 69, y: 57, tone: 'bg-orange-500', size: 'h-5 w-5', importance: '“A point helps describe the maxillary skeletal reference.”' },
  { id: 'b-point', name: 'B point', x: 68, y: 65, tone: 'bg-amber-500', size: 'h-5 w-5', importance: '“B point supports mandibular skeletal relationship assessment.”' },
  { id: 'gonion', name: 'Gonion', x: 50, y: 71, tone: 'bg-fuchsia-600', size: 'h-5 w-5', importance: '“Gonion defines the mandibular angle and contributes to mandibular-plane tracing.”' },
  { id: 'menton', name: 'Menton', x: 63, y: 79, tone: 'bg-red-500', size: 'h-5 w-5', importance: '“Menton is the inferior chin landmark used in vertical and mandibular-plane assessment.”' },
  { id: 'pogonion', name: 'Pogonion', x: 73, y: 70, tone: 'bg-violet-600', size: 'h-4 w-4', importance: '“Pogonion is the most anterior chin point for facial-profile assessment.”' },
]

export function ReferenceLandmarkOverlay({ visible }: { visible: boolean }) {
  const [active, setActive] = useState<Landmark | null>(null)
  if (!visible) return null

  return (
    <>
      {referenceLandmarks.map((landmark) => (
        <button
          key={landmark.id}
          type="button"
          aria-label={`${landmark.name}: ${landmark.importance}`}
          onMouseEnter={() => setActive(landmark)}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(landmark)}
          onBlur={() => setActive(null)}
          onClick={() => setActive(active?.id === landmark.id ? null : landmark)}
          className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${landmark.size} ${landmark.tone} border-2 border-white shadow-[0_0_0_3px_rgba(15,23,42,0.5)] transition hover:scale-125 focus:scale-125 focus:outline-none`}
          style={{ left: `${landmark.x}%`, top: `${landmark.y}%` }}
        />
      ))}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1 rounded-lg bg-slate-950/80 p-2 text-[10px] font-bold text-white backdrop-blur">
        <span className="mr-1 text-orange-200">Reference landmarks</span>
        {referenceLandmarks.map((landmark) => <span key={landmark.id} className={`h-2.5 w-2.5 rounded-full ${landmark.tone}`} />)}
      </div>
      {active && (
        <div className="absolute z-20 max-w-60 rounded-lg border border-orange-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-800 shadow-xl" style={{ left: `${Math.min(active.x + 3, 66)}%`, top: `${Math.max(active.y - 12, 7)}%` }}>
          <div className="font-black text-blue-700">{active.name}</div>
          {active.importance}
        </div>
      )}
    </>
  )
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cephgrow-user')
    return saved ? (JSON.parse(saved) as User) : null
  })

  const persistUser = (nextUser: User) => {
    localStorage.setItem('cephgrow-user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (email) => {
        persistUser({ name: email.split('@')[0] || 'Clinician', email })
      },
      signup: (name, email) => {
        persistUser({ name: name || 'Clinician', email })
      },
      logout: () => {
        localStorage.removeItem('cephgrow-user')
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function CranioFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[radial-gradient(circle_at_55%_35%,rgba(96,165,250,0.35),transparent_34%),linear-gradient(135deg,#0f2f78,#1d4ed8)]">
      <div className="absolute left-1/2 top-1/2 h-28 w-40 -translate-x-1/2 -translate-y-1/2 rotate-[-10deg] rounded-[55%_45%_45%_55%] border border-cyan-100/50 bg-cyan-50/20 shadow-[0_0_45px_rgba(103,232,249,0.24)]" />
      <div className="absolute left-[58%] top-[49%] h-16 w-24 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-[45%] border border-cyan-100/40 bg-white/10" />
      <div className="absolute left-[60%] top-[63%] h-4 w-28 rotate-[13deg] rounded-full bg-white/25" />
      <div className="absolute left-[38%] top-[32%] h-24 w-1 rotate-[-8deg] rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.75)]" />
      <div className="absolute left-[42%] top-[67%] h-1 w-36 rotate-[15deg] rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.75)]" />
      <div className="absolute left-[41%] top-[62%] h-10 w-10 rounded-full border-2 border-rose-400 border-r-transparent border-b-transparent" />
    </div>
  )
}

function CranioScene() {
  const [webgl, setWebgl] = useState(false)

  useEffect(() => {
    setWebgl(hasWebGlSupport())
  }, [])

  if (!webgl) {
    return <CranioFallback />
  }

  return (
    <Canvas className="h-full w-full" dpr={[1, 1.8]}>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} />
      <ambientLight intensity={1.2} />
      <pointLight position={[4, 5, 4]} intensity={2.8} color="#bff7ff" />
      <pointLight position={[-4, -2, 2]} intensity={1.4} color="#f8b76b" />
      <Suspense fallback={null}>
        <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.5}>
          <group rotation={[0.1, -0.52, 0.04]}>
            <mesh position={[0, 0.45, 0]}>
              <sphereGeometry args={[1.55, 48, 48]} />
              <meshStandardMaterial color="#d9f1f3" roughness={0.28} metalness={0.12} transparent opacity={0.28} />
            </mesh>
            <mesh position={[1.25, -0.12, 0]} scale={[1.1, 0.66, 0.72]}>
              <sphereGeometry args={[1, 48, 48]} />
              <meshStandardMaterial color="#ecfbff" roughness={0.36} transparent opacity={0.22} />
            </mesh>
            <mesh position={[1.65, -0.76, 0]} rotation={[0, 0, -0.11]} scale={[1.45, 0.22, 0.28]}>
              <boxGeometry args={[1.5, 1, 1]} />
              <meshStandardMaterial color="#f2f7f4" roughness={0.25} transparent opacity={0.34} />
            </mesh>
            <mesh position={[0.7, -1.15, 0.04]} rotation={[0, 0, -0.7]}>
              <cylinderGeometry args={[0.018, 0.018, 2.3, 16]} />
              <meshStandardMaterial color="#f65b72" emissive="#f65b72" emissiveIntensity={0.65} />
            </mesh>
            <mesh position={[1.35, -0.83, 0.08]} rotation={[0, 0, 1.34]}>
              <cylinderGeometry args={[0.018, 0.018, 2.3, 16]} />
              <meshStandardMaterial color="#f65b72" emissive="#f65b72" emissiveIntensity={0.65} />
            </mesh>
          </group>
        </Float>
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
    </Canvas>
  )
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-blue-700 to-orange-500 text-white shadow-lg shadow-blue-500/30">
        <Ruler size={20} />
      </span>
      <span>
        <span className="block text-base font-bold tracking-tight">CephGrow AI</span>
        <span className="block text-xs font-medium text-slate-500">Cephalometric intelligence</span>
      </span>
    </Link>
  )
}

function PublicNav() {
  const { user, logout } = useAuth()

  return (
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
      <Brand />
      <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
        <a href="/#platform">Platform</a>
        <a href="/#clinical">Clinical Flow</a>
        <a href="/#testimonials">Testimonials</a>
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link className="rounded-lg bg-[#17212b] px-4 py-2.5 text-sm font-bold text-white" to="/dashboard">
              Workspace
            </Link>
            <button className="hidden rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 sm:inline-flex" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="hidden rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 sm:inline-flex" to="/login">
              Login
            </Link>
            <Link className="rounded-lg bg-[#17212b] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10" to="/signup">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb] text-[#17212b]">
      <section className="relative min-h-[92vh] border-b border-slate-200 xray-grid">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(48,190,174,0.24),transparent_30%),radial-gradient(circle_at_15%_75%,rgba(246,91,114,0.14),transparent_28%)]" />
        <PublicNav />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-20 lg:pt-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-lg border border-teal-200 bg-white/70 px-3 py-2 text-sm font-bold text-teal-700">
              <Sparkles size={16} /> AI growth pattern prediction from serial cephalograms
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              Measure angles. Predict growth. Plan orthodontics with confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A clinical web app that organizes lateral cephalograms, supports mandibular plane angle review, and classifies growth patterns.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-3 font-bold text-white shadow-xl shadow-teal-600/20" to="/signup">
                Create Account <UserPlus size={18} />
              </Link>
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800" to="/login">
                Login to Workspace <ChevronRight size={18} />
              </Link>
            </div>
            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-slate-200 bg-white/75 p-4">
                  <div className="text-2xl font-black text-slate-950">{metric.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative min-h-[520px]">
            <div className="absolute inset-x-0 top-0 h-[410px] rounded-[32px] bg-[#17212b]" />
            <div className="absolute inset-x-4 top-6 h-[410px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 scanline">
              <CephalogramImage src={cases[0].image} alt="Cephalogram scan preview" className="h-full w-full object-cover opacity-80" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 700 480" preserveAspectRatio="none">
                <path d="M332 245 L342 372 L555 425" stroke="#ff4f69" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M342 372 Q365 356 394 368" stroke="#ff4f69" strokeWidth="4" fill="none" strokeLinecap="round" />
                <circle cx="342" cy="372" r="8" fill="#ff4f69" />
              </svg>
            </div>
            <div className="absolute bottom-2 left-0 right-0 mx-auto grid max-w-[92%] gap-4 rounded-2xl bg-white p-4 shadow-2xl shadow-slate-900/20 sm:grid-cols-[1fr_0.75fr]">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Protected Feature</p>
                <h2 className="mt-1 text-2xl font-black">Upload access after login</h2>
                <p className="mt-3 text-sm font-semibold text-slate-500">Create an account to enter the clinical workspace.</p>
              </div>
              <div className="h-44 rounded-xl bg-[#11212a]">
                <CranioScene />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Platform</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal text-slate-950">Public overview outside. Clinical tools inside.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The home page explains the product. Uploads, cases, reports, and X-ray analysis are separated into authenticated pages.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {platformFeatures.map(({ Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <Icon className="text-teal-600" size={24} />
                <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="clinical" className="border-y border-slate-200 bg-white px-5 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3 lg:px-8">
          {[
            ['01', 'Signup or login', 'Clinicians enter a protected workspace before accessing patient scan tools.'],
            ['02', 'Upload cephalogram', 'Submit JPG, PNG, or DICOM exports from the dedicated upload page.'],
            ['03', 'Review report', 'Inspect growth class, confidence, and angle trends in separate report pages.'],
          ].map(([step, title, body]) => (
            <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="text-sm font-black text-teal-700">{step}</div>
              <h3 className="mt-5 text-2xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#17212b] px-5 py-16 text-white lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-300">Backend Ready</p>
            <h2 className="mt-3 text-4xl font-black">Prisma + Neon + OpenRouter ready.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              The backend is structured for Prisma persistence and AI summaries, while the frontend now separates public and private app surfaces.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            {backendItems.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-4 border-b border-white/10 py-4 last:border-b-0">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-400/15 text-teal-200">
                  <Icon size={20} />
                </span>
                <span className="font-bold text-slate-100">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Testimonials</p>
        <h2 className="mt-3 text-4xl font-black text-slate-950">Designed for clinical trust.</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <blockquote className="text-lg font-semibold leading-8 text-slate-700">"{item.quote}"</blockquote>
              <figcaption className="mt-6">
                <div className="font-black text-slate-950">{item.name}</div>
                <div className="text-sm font-semibold text-slate-500">{item.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  )
}

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('doctor@cephgrow.ai')
  const [password, setPassword] = useState('cephgrow123')
  const isSignup = mode === 'signup'
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSignup) {
      auth.signup(name, email, password)
    } else {
      auth.login(email, password)
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#17212b] xray-grid">
      <PublicNav />
      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">{isSignup ? 'Create account' : 'Welcome back'}</p>
          <h1 className="mt-3 text-5xl font-black leading-tight text-slate-950">
            {isSignup ? 'Start reviewing cephalograms securely.' : 'Login to access X-ray upload tools.'}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            The upload workspace, case records, and growth reports are private app pages. Use the demo credentials already filled in or enter your own.
          </p>
        </div>
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#17212b] text-white">
              {isSignup ? <UserPlus size={20} /> : <Lock size={20} />}
            </span>
            <div>
              <h2 className="text-2xl font-black">{isSignup ? 'Signup' : 'Login'}</h2>
              <p className="text-sm font-semibold text-slate-500">Protected clinical workspace</p>
            </div>
          </div>
          {isSignup && (
            <label className="mb-4 block">
              <span className="text-sm font-bold text-slate-700">Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500" placeholder="Dr. Name" required />
            </label>
          )}
          <label className="mb-4 block">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500" type="email" required />
          </label>
          <label className="mb-6 block">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500" type="password" required minLength={6} />
          </label>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-3 font-black text-white shadow-xl shadow-teal-600/20">
            {isSignup ? 'Create account' : 'Login'} <ArrowRight size={18} />
          </button>
          <p className="mt-5 text-center text-sm font-semibold text-slate-500">
            {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link className="font-black text-teal-700" to={isSignup ? '/login' : '/signup'}>
              {isSignup ? 'Login' : 'Signup'}
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', Icon: Home },
    { to: '/upload', label: 'Upload', Icon: Upload },
    { to: '/cases', label: 'Cases', Icon: FolderOpen },
    { to: '/reports', label: 'Reports', Icon: BarChart3 },
  ]

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#102a63]">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-blue-100 bg-white p-5 lg:block">
        <Brand />
        <nav className="mt-8 space-y-2">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-black ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-slate-50 p-4">
          <div className="font-black text-slate-950">{user?.name}</div>
          <div className="truncate text-sm font-semibold text-slate-500">{user?.email}</div>
          <button onClick={logout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-bold text-slate-500">Clinical workspace</p>
              <h1 className="text-xl font-black text-slate-950">Cephalometric growth analysis</h1>
            </div>
            <Link className="rounded-lg bg-[#17212b] px-4 py-2.5 text-sm font-bold text-white" to="/">
              Public site
            </Link>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-4 py-2 text-sm font-black ${isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-50 text-slate-600'}`}>
                {label}
              </NavLink>
            ))}
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </div>
    </main>
  )
}

function DashboardPage() {
  const recentCases = [...getUserCases(), ...cases].slice(0, 5)
  const totals = [
    ['Total cases', '128'],
    ['Average grower', '54'],
    ['Horizontal grower', '39'],
    ['Vertical grower', '35'],
  ]

  return (
    <AppShell>
      <section className="grid gap-5 lg:grid-cols-4">
        {totals.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-sm font-bold text-slate-500">{label}</div>
            <div className="mt-2 text-4xl font-black text-slate-950">{value}</div>
          </div>
        ))}
      </section>
      <section className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-2xl font-black text-slate-950">Recent serial cases</h2>
          <div className="mt-5 grid gap-3">
            {recentCases.map((item) => (
              <CaseRow key={item.id} item={item} />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-2xl font-black text-slate-950">Next action</h2>
          <p className="mt-3 leading-7 text-slate-600">Upload a new cephalogram from the protected upload page and review the predicted growth group.</p>
          <Link className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 font-black text-white" to="/upload">
            Upload X-ray <Upload size={18} />
          </Link>
        </div>
      </section>
    </AppShell>
  )
}

function UploadPage() {
  const [selectedCase, setSelectedCase] = useState(cases[0])
  const [angle, setAngle] = useState(34)
  const [analysisMode, setAnalysisMode] = useState<'measurements' | 'image-assisted'>('measurements')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'female' | 'male' | 'unspecified'>('unspecified')
  const [fma, setFma] = useState('')
  const [yAxis, setYAxis] = useState('')
  const [jarabakRatio, setJarabakRatio] = useState('')
  const [clinicianNote, setClinicianNote] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [patientName, setPatientName] = useState('New patient')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const predictedClass = useMemo(() => classify(angle), [angle])
  const resultAngle = analysisResult ? Number(analysisResult.angle) : angle
  const resultClass = analysisResult?.growthClass ?? predictedClass
  const apiBaseUrl = window.location.hostname === 'localhost' ? '' : import.meta.env.VITE_API_URL || ''

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setAnalysisMode('image-assisted')
    setAnalysisResult(null)
    setError('')
  }

  const generateAnalysis = async () => {
    setIsGenerating(true)
    setError('')

    try {
      if (analysisMode === 'image-assisted' && !selectedFile) {
        throw new Error('Image-assisted mode requires a diagnostic-quality lateral cephalogram upload.')
      }
      const formData = new FormData()
      formData.append('patientName', patientName || 'New patient')
      formData.append('analysisMode', analysisMode)
      formData.append('angle', String(angle))
      if (age) formData.append('age', age)
      formData.append('sex', sex)
      if (fma) formData.append('fma', fma)
      if (yAxis) formData.append('yAxis', yAxis)
      if (jarabakRatio) formData.append('jarabakRatio', jarabakRatio)
      if (clinicianNote) formData.append('clinicianNote', clinicianNote)
      if (selectedFile) {
        formData.append('cephalogram', selectedFile)
      }

      const response = await fetch(`${apiBaseUrl}/api/analyses`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Analysis request failed')
      }

      const payload = (await response.json()) as AnalysisResult
      setAnalysisResult(payload)
      saveUserCase(payload, preview)
      setAngle(Math.round(Number(payload.angle)))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to generate analysis')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Clinical workspace</p>
          <h2 className="mt-1 text-4xl font-black text-slate-950">Upload. Measure. Review.</h2>
        </div>
        <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-200">User-input growth support</div>
      </div>
      <div className="grid items-start overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-blue-900/10 xl:grid-cols-[230px_minmax(0,1fr)_370px]">
        <aside className="border-b border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <PanelLeft size={18} /> Demo Cases
          </div>
          <div className="mt-4 space-y-3">
            {cases.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedCase(item)
                  setPreview(null)
                  setSelectedFile(null)
                  setAnalysisResult(null)
                  setError('')
                  setPatientName(item.patient)
                  setAngle(Math.round(item.angle))
                }}
                className={`w-full rounded-lg border p-3 text-left transition ${selectedCase.id === item.id ? 'border-orange-300 bg-white shadow-md shadow-orange-200/40' : 'border-blue-100 bg-white/70 hover:border-blue-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black">{item.patient}</span>
                  <span className="text-xs font-bold text-slate-500">{item.id}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`rounded-md px-2 py-1 text-xs font-black ring-1 ${classStyles[item.className]}`}>{item.className}</span>
                  <span className="text-sm font-black text-slate-700">{item.angle} deg</span>
                </div>
              </button>
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-white px-4 py-5 text-center transition hover:border-orange-400 hover:bg-orange-50">
            <Upload className="text-orange-500" size={24} />
            <span className="mt-2 text-sm font-black text-slate-950">Upload cephalogram</span>
            <span className="mt-1 text-xs font-semibold text-slate-500">{selectedFile ? selectedFile.name : 'JPG, PNG, DICOM export'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        </aside>

        <div className="min-w-0 self-start overflow-hidden bg-slate-100">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileImage size={17} /> Lateral cephalogram viewer
            </div>
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-orange-100">{analysisMode === 'image-assisted' ? 'Image cross-check active' : 'Measurement review mode'}</div>
          </div>
          <div className="relative h-[540px] scanline">
            <CephalogramImage src={preview ?? selectedCase.image} alt="Selected cephalogram" className="h-full w-full object-cover opacity-85" />
            {analysisResult?.landmarks && <LandmarkOverlay landmarks={analysisResult.landmarks} />}
            {(isGenerating || analysisResult?.landmarks) && (
              <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-teal-300/30 bg-slate-950/80 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                <div className="flex items-center gap-2 text-teal-200"><MapPin size={14} /> {isGenerating ? 'Locating image-specific landmarks…' : 'Image-specific landmarks highlighted'}</div>
                <div className="mt-1 text-slate-300">S Sella · N Nasion · Go Gonion · Me Menton</div>
              </div>
            )}
          </div>
        </div>

        <aside className="border-t border-blue-100 bg-white xl:border-l xl:border-t-0">
          <div className={`border-b border-blue-100 p-5 ${analysisResult ? 'bg-gradient-to-br from-orange-50 via-white to-blue-50' : 'bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-950">Live result</h3>
              {analysisResult ? <CheckCircle2 className="text-teal-600" size={20} /> : <Activity className="text-teal-600" size={20} />}
            </div>
            <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-lg shadow-blue-900/5">
              <div className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">Growth Class</div>
              <div className="mt-1 text-4xl font-black text-slate-950">{resultClass}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">Cephalometric angle: {resultAngle.toFixed(2)} deg</div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-orange-500" style={{ width: `${analysisResult?.confidence ?? 70}%` }} />
              </div>
              <div className="mt-2 text-xs font-bold text-slate-500">
                {analysisResult ? `${analysisResult.confidence}% confidence` : 'Generate analysis to get AI confidence'}
              </div>
            </div>
            {analysisResult && (
              <div className="mt-4 rounded-xl border border-orange-200 bg-white p-4 text-sm font-semibold leading-6 text-blue-950 shadow-md shadow-orange-200/30">
                {analysisResult.aiSummary}
              </div>
            )}
            {error && (
              <div className="mt-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800">
                <AlertCircle className="mt-0.5 shrink-0" size={17} /> {error}
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-950">Analysis inputs</h3>
              <Wand2 className="text-orange-500" size={20} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button type="button" onClick={() => setAnalysisMode('measurements')} className={`rounded-md px-3 py-2 text-xs font-black ${analysisMode === 'measurements' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>Measurements</button>
              <button type="button" onClick={() => setAnalysisMode('image-assisted')} className={`rounded-md px-3 py-2 text-xs font-black ${analysisMode === 'image-assisted' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600'}`}>Image assisted</button>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Measurements mode creates a report only from clinician-entered values. Image-assisted mode first rejects non-cephalogram, non-lateral, or low-quality images; it never replaces entered measurements.</p>
            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">Patient name</span>
              <input value={patientName} onChange={(event) => setPatientName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Patient name" />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs font-bold text-slate-700">Age (years)</span><input inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500" placeholder="Optional" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Sex</span><select value={sex} onChange={(event) => setSex(event.target.value as typeof sex)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500"><option value="unspecified">Unspecified</option><option value="female">Female</option><option value="male">Male</option></select></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">FMA (°)</span><input inputMode="decimal" value={fma} onChange={(event) => setFma(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500" placeholder="Optional" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">Y-axis (°)</span><input inputMode="decimal" value={yAxis} onChange={(event) => setYAxis(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500" placeholder="Optional" /></label>
            </div>
            <label className="mt-3 block"><span className="text-xs font-bold text-slate-700">Jarabak ratio (%)</span><input inputMode="decimal" value={jarabakRatio} onChange={(event) => setJarabakRatio(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500" placeholder="Optional" /></label>
            <p className="mt-5 text-sm font-bold text-slate-700">Manual angle hint</p>
            <input aria-label="Angle" type="range" min="15" max="50" value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="mt-6 w-full accent-orange-500" />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-black">{angle} deg</span>
              <span className={`rounded-lg px-3 py-1 text-sm font-black ring-1 ${classStyles[predictedClass]}`}>{predictedClass}</span>
            </div>
            <label className="mt-4 block"><span className="text-xs font-bold text-slate-700">Clinician context (optional)</span><textarea value={clinicianNote} onChange={(event) => setClinicianNote(event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-500" placeholder="Observations for the report" /></label>
            <button onClick={generateAnalysis} disabled={isGenerating} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 font-black text-white shadow-xl shadow-orange-500/25 transition hover:from-orange-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-70">
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
              {isGenerating ? 'Creating support report...' : 'Generate support report'}
            </button>
            <p className="mt-3 text-sm leading-6 text-slate-600">A report is generated only from entered measurements. Landmark highlights support review; verify them clinically. Any attachment must pass a diagnostic lateral-cephalogram check.</p>
          </div>
        </aside>
      </div>
      {analysisResult && (
        <GeneratedVisuals
          imageSrc={preview ?? selectedCase.image}
          result={analysisResult}
          measurements={{
            fma: fma ? Number(fma) : undefined,
            yAxis: yAxis ? Number(yAxis) : undefined,
            jarabakRatio: jarabakRatio ? Number(jarabakRatio) : undefined,
          }}
        />
      )}
    </AppShell>
  )
}

function measureGrowthClass(value: number, horizontalMax: number, verticalMin: number) {
  if (value <= horizontalMax) return 'Horizontal' as GrowthClass
  if (value >= verticalMin) return 'Vertical' as GrowthClass
  return 'Average' as GrowthClass
}

function MeasurementProfile({ angle, measurements }: { angle: number; measurements: GeneratedVisualProps['measurements'] }) {
  const metrics = [
    { label: 'Mandibular plane', value: angle, unit: '°', min: 15, max: 50, horizontal: 27, vertical: 38, className: classify(angle) },
    ...(measurements.fma === undefined ? [] : [{ label: 'FMA', value: measurements.fma, unit: '°', min: 10, max: 60, horizontal: 21, vertical: 28, className: measureGrowthClass(measurements.fma, 21, 28) }]),
    ...(measurements.yAxis === undefined ? [] : [{ label: 'Y-axis', value: measurements.yAxis, unit: '°', min: 45, max: 80, horizontal: 59, vertical: 66, className: measureGrowthClass(measurements.yAxis, 59, 66) }]),
    ...(measurements.jarabakRatio === undefined ? [] : [{ label: 'Jarabak ratio', value: measurements.jarabakRatio, unit: '%', min: 45, max: 85, horizontal: 65, vertical: 60, className: measureGrowthClass(100 - measurements.jarabakRatio, 35, 40) }]),
  ]
  const chartHeight = 68 + metrics.length * 58
  const x = (value: number, metric: (typeof metrics)[number]) => 146 + ((value - metric.min) / (metric.max - metric.min)) * 350

  return (
    <svg viewBox={`0 0 560 ${chartHeight}`} role="img" aria-label="Entered cephalometric measurements compared with growth-pattern reference bands" className="w-full">
      <title>Measurement profile</title>
      <desc>Each dot represents an entered value. Blue is the horizontal reference side, neutral is average, and orange is the vertical reference side.</desc>
      {metrics.map((metric, index) => {
        const y = 44 + index * 58
        const first = Math.min(metric.horizontal, metric.vertical)
        const second = Math.max(metric.horizontal, metric.vertical)
        return (
          <g key={metric.label}>
            <text x="8" y={y - 8} fill="#102a63" fontSize="13" fontWeight="700">{metric.label}</text>
            <text x="8" y={y + 12} fill="#64748b" fontSize="11">{metric.value.toFixed(1)}{metric.unit} · {metric.className}</text>
            <rect x="146" y={y - 16} width="350" height="16" rx="8" fill="#dbeafe" />
            <rect x={x(first, metric)} y={y - 16} width={x(second, metric) - x(first, metric)} height="16" fill="#e2e8f0" />
            <rect x={x(second, metric)} y={y - 16} width={496 - x(second, metric)} height="16" rx="8" fill="#ffedd5" />
            <line x1={x(first, metric)} y1={y - 22} x2={x(first, metric)} y2={y + 6} stroke="#64748b" strokeWidth="1" />
            <line x1={x(second, metric)} y1={y - 22} x2={x(second, metric)} y2={y + 6} stroke="#64748b" strokeWidth="1" />
            <circle cx={x(Math.max(metric.min, Math.min(metric.value, metric.max)), metric)} cy={y - 8} r="7" fill="#1d4ed8" stroke="white" strokeWidth="3" />
          </g>
        )
      })}
      <text x="146" y={chartHeight - 12} fill="#64748b" fontSize="11">Horizontal reference</text>
      <text x="360" y={chartHeight - 12} fill="#64748b" fontSize="11">Average</text>
      <text x="447" y={chartHeight - 12} fill="#64748b" fontSize="11">Vertical</text>
    </svg>
  )
}

function GeneratedVisuals({ imageSrc, result, measurements }: GeneratedVisualProps) {
  const angle = Number(result.angle)
  const className = result.growthClass
  const evidence = [
    { label: 'Mandibular plane', value: `${angle.toFixed(1)}°`, result: classify(angle) },
    ...(measurements.fma === undefined ? [] : [{ label: 'FMA', value: `${measurements.fma.toFixed(1)}°`, result: measureGrowthClass(measurements.fma, 21, 28) }]),
    ...(measurements.yAxis === undefined ? [] : [{ label: 'Y-axis', value: `${measurements.yAxis.toFixed(1)}°`, result: measureGrowthClass(measurements.yAxis, 59, 66) }]),
    ...(measurements.jarabakRatio === undefined ? [] : [{ label: 'Jarabak ratio', value: `${measurements.jarabakRatio.toFixed(1)}%`, result: measureGrowthClass(100 - measurements.jarabakRatio, 35, 40) }]),
  ]
  const aligned = evidence.filter((item) => item.result === className).length
  const reviewPrompts: Record<GrowthClass, string[]> = {
    Horizontal: ['Compare with serial lower-face-height measurements.', 'Confirm mandibular-plane landmarks before final interpretation.', 'Review dental compensation separately from skeletal pattern.'],
    Average: ['Compare with serial growth records if available.', 'Confirm mandibular-plane landmarks before final interpretation.', 'Review dental compensation separately from skeletal pattern.'],
    Vertical: ['Compare with serial lower-face-height measurements.', 'Confirm mandibular-plane landmarks before final interpretation.', 'Review dental compensation separately from skeletal pattern.'],
  }

  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Generated support report</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Results, input trace, and review prompts.</h2>
        </div>
        <span className={`w-fit rounded-lg px-3 py-2 text-sm font-black ring-1 ${classStyles[className]}`}>
          {className} Grower
        </span>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="relative h-72 bg-slate-950 scanline">
            <CephalogramImage src={imageSrc} alt="Generated annotated cephalogram" className="h-full w-full object-cover opacity-85 grayscale" />
            {result.landmarks && <LandmarkOverlay landmarks={result.landmarks} showLabels={false} />}
            <svg className="absolute inset-0 z-20 h-full w-full" viewBox="0 0 700 520" preserveAspectRatio="none">
              <rect x="28" y="28" width="178" height="58" rx="10" fill="rgba(15,23,42,0.72)" />
              <text x="46" y="62" fill="#ffffff" fontSize="24" fontWeight="800">{angle.toFixed(2)} deg</text>
            </svg>
          </div>
          <div className="p-4">
            <h3 className="font-black text-slate-950">Annotated Cephalogram</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Generated overlay showing the reviewed critical landmark points and mandibular plane reference.</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="relative h-72 overflow-hidden rounded-lg bg-[#17212b] xray-grid">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.22),transparent_38%)]" />
            <div className="absolute left-1/2 top-1/2 h-40 w-52 -translate-x-1/2 -translate-y-1/2 rounded-[48%] border border-cyan-100/35 bg-white/10" />
            <div className="absolute left-[34%] top-[24%] h-36 w-1 rotate-[-8deg] rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.75)]" />
            <div className="absolute left-[38%] top-[64%] h-1 w-44 rotate-[15deg] rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.75)]" />
            <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/10 p-4 text-white backdrop-blur">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Growth Pattern</div>
              <div className="mt-1 text-3xl font-black">{className}</div>
              <div className="mt-1 text-sm font-semibold text-slate-200">{result.confidence}% confidence</div>
            </div>
          </div>
          <h3 className="mt-4 font-black text-slate-950">Growth Pattern Graphic</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">A generated visual summary that can be shown in review discussions.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="h-72 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Report Snapshot</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{result.patientName}</div>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-black ring-1 ${classStyles[className]}`}>{className}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Angle</div>
                <div className="mt-2 text-3xl font-black text-slate-950">{angle.toFixed(1)}</div>
              </div>
              <div className="rounded-lg bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Confidence</div>
                <div className="mt-2 text-3xl font-black text-slate-950">{result.confidence}%</div>
              </div>
            </div>
            <p className="mt-5 line-clamp-4 text-sm font-semibold leading-6 text-slate-600">{result.aiSummary}</p>
          </div>
          <h3 className="mt-4 font-black text-slate-950">Clinical Report Card</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">A clean generated snapshot for case discussion and documentation.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-lg shadow-blue-900/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Input profile chart</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">Entered measures against reference bands</h3>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{evidence.length} entered measures</span>
          </div>
          <div className="mt-4"><MeasurementProfile angle={angle} measurements={measurements} /></div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Band positions are a visual aid for the supplied values; they are not an image-derived diagnosis.</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-blue-50 p-5 shadow-lg shadow-orange-100/50">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">AI-supported review</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Evidence alignment: {aligned}/{evidence.length}</h3>
          <div className="mt-4 space-y-2">
            {evidence.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-sm">
                <span className="font-bold text-slate-700">{item.label} <span className="font-normal text-slate-500">{item.value}</span></span>
                <span className={`rounded-md px-2 py-1 text-xs font-black ring-1 ${classStyles[item.result]}`}>{item.result}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-orange-200 pt-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Clinician review prompts</p>
            <ul className="mt-2 space-y-2 text-sm font-medium leading-5 text-slate-700">
              {reviewPrompts[className].map((prompt) => <li key={prompt} className="flex gap-2"><span className="text-orange-500">•</span>{prompt}</li>)}
            </ul>
          </div>
          <button type="button" onClick={() => window.print()} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/25">Print support report</button>
        </div>
      </div>
    </section>
  )
}

function CasesPage() {
  const allCases = [...getUserCases(), ...cases]
  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Cases</p>
          <h2 className="mt-2 text-4xl font-black text-slate-950">Patient growth records.</h2>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 font-black text-white" to="/upload">
          New Upload <Upload size={18} />
        </Link>
      </div>
      <div className="grid gap-4">
        {allCases.map((item) => (
          <CaseRow key={item.id} item={item} />
        ))}
      </div>
    </AppShell>
  )
}

function ReportsPage() {
  const allCases = [...getUserCases(), ...cases]
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Reports</p>
        <h2 className="mt-2 text-4xl font-black text-slate-950">Growth pattern summary.</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {allCases.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="h-44 overflow-hidden rounded-lg"><CephalogramImage src={item.image} alt={item.patient} className="h-full w-full object-cover grayscale" /></div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-950">{item.patient}</h3>
                <p className="text-sm font-semibold text-slate-500">{item.date}</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-black ring-1 ${classStyles[item.className]}`}>{item.className}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Angle {item.angle} deg with {item.confidence}% model confidence. Clinician verification required before diagnosis or treatment planning.
            </p>
          </div>
        ))}
      </div>
    </AppShell>
  )
}

function CaseRow({ item }: { item: CaseRecord }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="h-20 w-24 overflow-hidden rounded-lg"><CephalogramImage src={item.image} alt={item.patient} className="h-full w-full object-cover grayscale" /></div>
        <div>
          <div className="font-black text-slate-950">{item.patient}</div>
          <div className="text-sm font-semibold text-slate-500">{item.id} - {item.date}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-black text-slate-700">{item.angle} deg</span>
        <span className={`rounded-md px-2 py-1 text-xs font-black ring-1 ${classStyles[item.className]}`}>{item.className}</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
