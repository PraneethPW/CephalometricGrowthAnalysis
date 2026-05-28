import { Suspense, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { motion } from 'framer-motion'
import {
  Activity,
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
  Lock,
  LogOut,
  Microscope,
  PanelLeft,
  Ruler,
  ShieldCheck,
  Sparkles,
  Upload,
  UserPlus,
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
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[radial-gradient(circle_at_55%_35%,rgba(103,232,249,0.28),transparent_34%),linear-gradient(135deg,#10222b,#17212b)]">
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
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#17212b] text-white">
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
              <img src={cases[0].image} alt="Cephalogram scan preview" className="h-full w-full object-cover opacity-80" />
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
    <main className="min-h-screen bg-[#f6f8fb] text-[#17212b]">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-slate-200 bg-white p-5 lg:block">
        <Brand />
        <nav className="mt-8 space-y-2">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-black ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
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
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
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
            {cases.map((item) => (
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
  const [preview, setPreview] = useState<string | null>(null)
  const predictedClass = useMemo(() => classify(angle), [angle])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Protected Upload</p>
        <h2 className="mt-2 text-4xl font-black text-slate-950">Upload and analyze cephalograms.</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-[280px_1fr_340px]">
        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
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
                  setAngle(Math.round(item.angle))
                }}
                className={`w-full rounded-lg border p-3 text-left transition ${selectedCase.id === item.id ? 'border-teal-300 bg-white shadow-sm' : 'border-slate-200 bg-white/60'}`}
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
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
            <Upload className="text-teal-600" size={24} />
            <span className="mt-2 text-sm font-black text-slate-950">Upload cephalogram</span>
            <span className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG, DICOM export</span>
            <input type="file" className="hidden" accept="image/*" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        </aside>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileImage size={17} /> Lateral cephalogram viewer
            </div>
            <div className="text-xs font-bold text-teal-200">Mandibular plane overlay active</div>
          </div>
          <div className="relative h-[520px] scanline">
            <img src={preview ?? selectedCase.image} alt="Selected cephalogram" className="h-full w-full object-cover opacity-85" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 700 520" preserveAspectRatio="none">
              <path d="M315 230 L330 370 L560 442" stroke="#ff4f69" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M330 370 L405 370" stroke="#ff4f69" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
              <path d="M330 370 Q354 356 382 367" stroke="#ff4f69" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="330" cy="370" r="7" fill="#ff4f69" />
            </svg>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-950">Prediction</h3>
              <Activity className="text-teal-600" size={20} />
            </div>
            <div className="mt-5 rounded-lg bg-white p-4">
              <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Growth Class</div>
              <div className="mt-2 text-3xl font-black text-slate-950">{predictedClass}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">Cephalometric angle: {angle} deg</div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-950">Manual Angle Simulator</h3>
              <Ruler className="text-teal-600" size={20} />
            </div>
            <input aria-label="Angle" type="range" min="15" max="50" value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="mt-6 w-full accent-teal-600" />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-black">{angle} deg</span>
              <span className={`rounded-lg px-3 py-1 text-sm font-black ring-1 ${classStyles[predictedClass]}`}>{predictedClass}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Threshold demo: Horizontal at 27 deg or less, Average from 28-37 deg, Vertical at 38 deg and above.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

function CasesPage() {
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
        {cases.map((item) => (
          <CaseRow key={item.id} item={item} />
        ))}
      </div>
    </AppShell>
  )
}

function ReportsPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Reports</p>
        <h2 className="mt-2 text-4xl font-black text-slate-950">Growth pattern summary.</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {cases.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <img src={item.image} alt={item.patient} className="h-44 w-full rounded-lg object-cover grayscale" />
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
        <img src={item.image} alt={item.patient} className="h-20 w-24 rounded-lg object-cover grayscale" />
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
