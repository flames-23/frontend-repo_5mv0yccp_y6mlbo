import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useApi() {
  const base = API_BASE
  return {
    async get(path) {
      const res = await fetch(`${base}${path}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    async post(path, body) {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    async put(path, body) {
      const res = await fetch(`${base}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
  }
}

function Navbar({ user, onLogout }) {
  const location = useLocation()
  const links = [
    { to: '/', label: 'Home' },
    { to: '/domains', label: 'Domains' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/resume', label: 'Resume' },
  ]
  return (
    <nav className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl">Lernify Road</Link>
        <div className="flex items-center gap-4">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`text-sm font-medium hover:text-blue-600 ${location.pathname===l.to?'text-blue-600':'text-gray-700'}`}>{l.label}</Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="text-sm text-gray-700">{user.first_name}</Link>
              <button onClick={onLogout} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">Logout</button>
            </div>
          ) : (
            <Link to="/auth" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

function AuthPage({ setUser }) {
  const api = useApi()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', qualification: '', password: ''
  })
  const qualifications = [
    'B.Tech CSE','B.Tech IT','B.Sc IT','BCA','MCA','M.Sc CS','Diploma in CS/IT'
  ]
  const submit = async (e) => {
    e.preventDefault()
    if (mode==='register'){
      if (!/^[0-9]{10}$/.test(form.phone)) return alert('Enter valid 10-digit phone')
      if (!qualifications.includes(form.qualification)) return alert('Only IT-related qualifications allowed')
      const res = await api.post('/auth/register', {
        first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, qualification: form.qualification, password_hash: form.password
      })
      setUser(res.user)
    } else {
      const res = await api.post('/auth/login', { email: form.email, password: form.password })
      setUser(res.user)
    }
  }
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 mt-8">
      <div className="flex justify-center gap-4 mb-4">
        <button onClick={()=>setMode('login')} className={`px-3 py-1 rounded ${mode==='login'?'bg-blue-600 text-white':'bg-gray-100'}`}>Login</button>
        <button onClick={()=>setMode('register')} className={`px-3 py-1 rounded ${mode==='register'?'bg-blue-600 text-white':'bg-gray-100'}`}>Register</button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode==='register' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="First name" required value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})} />
              <input className="input" placeholder="Last name" required value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})} />
            </div>
            <input className="input" placeholder="Phone (10 digits)" required value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
            <select className="input" required value={form.qualification} onChange={e=>setForm({...form, qualification:e.target.value})}>
              <option value="">Select qualification</option>
              {qualifications.map(q=> <option key={q} value={q}>{q}</option>)}
            </select>
          </>
        )}
        <input type="email" className="input" placeholder="Email" required value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input type="password" className="input" placeholder="Password" required minLength={6} value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2">{mode==='login'?'Login':'Create account'}</button>
      </form>
    </div>
  )
}

function DomainsPage(){
  const api = useApi()
  const [domains, setDomains] = useState([])
  useEffect(()=>{ api.get('/roadmaps').then(r=>setDomains(r.domains)).catch(console.error) },[])
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Choose a domain</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map(d=> (
          <Link key={d} to={`/roadmap/${d}`} className="p-5 rounded-xl border bg-white hover:shadow transition">
            <div className="text-lg font-medium capitalize">{d.replace('-', ' ')}</div>
            <div className="text-sm text-gray-600">Click to view roadmap</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function RoadmapPage(){
  const api = useApi()
  const { pathname } = useLocation()
  const domain = pathname.split('/').pop()
  const [data, setData] = useState({steps: []})
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState([])
  const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem('lr_user')||'null'))

  useEffect(()=>{ api.get(`/roadmaps/${domain}`).then(r=> setData(r)).catch(console.error) },[domain])
  useEffect(()=>{ if (data.steps.length) setCurrentStep(data.steps[0].order) },[data])

  const submitAssessment = async () => {
    if (!user) return alert('Please login to submit assessment')
    const res = await api.post('/assessments/submit', { user_id: user.id, domain, step_order: currentStep, answers })
    alert(res.message+` (score ${res.result.score}/${res.result.total})`)
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4 capitalize">{domain.replace('-', ' ')} roadmap</h2>
      <div className="space-y-4">
        {data.steps.map(step => (
          <div key={step.order} className={`rounded-xl border bg-white p-5 ${currentStep===step.order? 'ring-2 ring-blue-500':''}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Step {step.order}</div>
                <div className="text-lg font-medium">{step.title}</div>
              </div>
              <button className="text-sm bg-gray-100 px-3 py-1 rounded" onClick={()=> setCurrentStep(step.order)}>Open</button>
            </div>
            {currentStep===step.order && (
              <div className="mt-3 space-y-3">
                <p className="text-gray-700">{step.description}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {step.videos.map((v, idx)=> (
                    <a key={idx} href={v} target="_blank" className="p-3 rounded bg-blue-50 hover:bg-blue-100 text-blue-700">YouTube: {v}</a>
                  ))}
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Assessment</h4>
                  {(step.questions||[]).map((q, qi)=> (
                    <div key={qi} className="mb-3">
                      <div className="text-sm font-medium">{q.q}</div>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi)=> (
                          <label key={oi} className={`border rounded p-2 cursor-pointer ${answers[qi]===oi? 'bg-blue-50 border-blue-400':''}`}>
                            <input type="radio" name={`q${qi}`} className="hidden" onChange={()=> setAnswers(a=>{const c=[...a]; c[qi]=oi; return c})} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={submitAssessment} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">Submit</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardPage(){
  const api = useApi()
  const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem('lr_user')||'null'))
  const [data, setData] = useState({assessments:[], progress:[]})
  useEffect(()=>{ if(user) api.get(`/dashboard/${user.id}`).then(setData).catch(console.error) },[user])
  if (!user) return <div className="max-w-3xl mx-auto p-6">Please login.</div>
  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-2">Progress</h3>
        <div className="space-y-2">
          {data.progress.map(p=> (
            <div key={p.id} className="text-sm">{p.domain}: steps completed {JSON.stringify(p.completed_steps || [])}</div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-2">Assessments</h3>
        <div className="space-y-2">
          {data.assessments.map(a=> (
            <div key={a.id} className="text-sm">{a.domain} - step {a.step_order}: {a.score}/{a.total} {a.passed? '✅':'❌'}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfilePage(){
  const api = useApi()
  const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem('lr_user')||'null'))
  const [profile, setProfile] = useState(null)
  const [change, setChange] = useState({old_password:'', new_password:''})

  useEffect(()=>{ if(user) api.get(`/profile/${user.id}`).then(r=> setProfile(r.user)) },[])

  const save = async () => {
    const r = await api.put(`/profile/${user.id}`, { first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone, qualification: profile.qualification, avatar_url: profile.avatar_url||null })
    alert('Saved')
    setProfile(r.user)
    localStorage.setItem('lr_user', JSON.stringify(r.user))
  }
  const changePwd = async () => {
    await api.post('/auth/change-password', { user_id: user.id, old_password: change.old_password, new_password: change.new_password })
    alert('Password changed')
    setChange({old_password:'', new_password:''})
  }
  if (!user) return <div className="max-w-3xl mx-auto p-6">Please login.</div>
  if (!profile) return <div className="max-w-3xl mx-auto p-6">Loading...</div>
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-3">Personal info</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="input" value={profile.first_name} onChange={e=> setProfile({...profile, first_name:e.target.value})} />
          <input className="input" value={profile.last_name} onChange={e=> setProfile({...profile, last_name:e.target.value})} />
          <input className="input" value={profile.phone} onChange={e=> setProfile({...profile, phone:e.target.value})} />
          <input className="input" value={profile.qualification} onChange={e=> setProfile({...profile, qualification:e.target.value})} />
        </div>
        <button onClick={save} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">Save</button>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-3">Change password</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input type="password" className="input" placeholder="Old password" value={change.old_password} onChange={e=> setChange(c=>({...c, old_password:e.target.value}))} />
          <input type="password" className="input" placeholder="New password" value={change.new_password} onChange={e=> setChange(c=>({...c, new_password:e.target.value}))} />
        </div>
        <button onClick={changePwd} className="mt-3 bg-gray-800 hover:bg-black text-white rounded px-4 py-2">Update password</button>
      </div>
    </div>
  )
}

function ResumePage(){
  const api = useApi()
  const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem('lr_user')||'null'))
  const [resume, setResume] = useState({ summary:'', skills:[], education:[], experience:[], projects:[], contact:{ email:'', phone:'', linkedin:'', github:'' } })
  const [loaded, setLoaded] = useState(false)
  useEffect(()=>{ if(user) api.get(`/resume/${user.id}`).then(r=>{ setResume(r.resume); setLoaded(true) }).catch(()=> setLoaded(true)) },[])
  if (!user) return <div className="max-w-3xl mx-auto p-6">Please login.</div>

  const add = (key, val) => setResume(r=> ({...r, [key]: [...(r[key]||[]), val]}))
  const removeAt = (key, i) => setResume(r=> ({...r, [key]: r[key].filter((_,idx)=> idx!==i)}))
  const save = async () => {
    const validPhone = /^[0-9]{10}$/.test(resume.contact.phone)
    if (!validPhone) return alert('Enter valid contact phone')
    const res = await api.post('/resume', { ...resume, user_id: user.id })
    setResume(res.resume)
    alert('Saved')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">Build your resume</h3>
        <textarea className="input h-28" placeholder="Professional summary" value={resume.summary} onChange={e=> setResume(r=>({...r, summary:e.target.value}))} />
        <div>
          <div className="font-medium mb-1">Skills</div>
          <div className="flex gap-2 mb-2 flex-wrap">{(resume.skills||[]).map((s,i)=> <span key={i} className="px-2 py-1 bg-blue-50 rounded">{s} <button onClick={()=> removeAt('skills', i)}>x</button></span>)}</div>
          <input className="input" placeholder="Add skill and press Enter" onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); const v=e.currentTarget.value.trim(); if(v){ add('skills', v); e.currentTarget.value='' }}}} />
        </div>
        <div>
          <div className="font-medium mb-1">Education</div>
          {(resume.education||[]).map((ed,i)=> (
            <div key={i} className="border rounded p-2 mb-2 flex justify-between">
              <div>
                <div className="text-sm font-medium">{ed.degree} - {ed.institution}</div>
                <div className="text-xs text-gray-600">{ed.year}</div>
              </div>
              <button onClick={()=> removeAt('education', i)}>Remove</button>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            <input className="input" placeholder="Degree" id="ed_degree" />
            <input className="input" placeholder="Institution" id="ed_inst" />
            <input className="input" placeholder="Year" id="ed_year" />
          </div>
          <button className="mt-2 bg-gray-100 rounded px-3 py-1" onClick={()=> {
            const d=document.getElementById('ed_degree').value.trim();
            const i=document.getElementById('ed_inst').value.trim();
            const y=document.getElementById('ed_year').value.trim();
            if(d && i && y) add('education', {degree:d, institution:i, year:y})
          }}>Add</button>
        </div>
        <div>
          <div className="font-medium mb-1">Experience</div>
          {(resume.experience||[]).map((ex,i)=> (
            <div key={i} className="border rounded p-2 mb-2 flex justify-between">
              <div>
                <div className="text-sm font-medium">{ex.role} - {ex.company}</div>
                <div className="text-xs text-gray-600">{ex.duration}</div>
              </div>
              <button onClick={()=> removeAt('experience', i)}>Remove</button>
            </div>
          ))}
          <div className="grid grid-cols-4 gap-2">
            <input className="input" placeholder="Role" id="ex_role" />
            <input className="input" placeholder="Company" id="ex_company" />
            <input className="input" placeholder="Duration" id="ex_duration" />
            <input className="input" placeholder="Details" id="ex_details" />
          </div>
          <button className="mt-2 bg-gray-100 rounded px-3 py-1" onClick={()=> {
            const r=document.getElementById('ex_role').value.trim();
            const c=document.getElementById('ex_company').value.trim();
            const d=document.getElementById('ex_duration').value.trim();
            const t=document.getElementById('ex_details').value.trim();
            if(r && c && d) add('experience', {role:r, company:c, duration:d, details:t})
          }}>Add</button>
        </div>
        <div>
          <div className="font-medium mb-1">Projects</div>
          {(resume.projects||[]).map((p,i)=> (
            <div key={i} className="border rounded p-2 mb-2 flex justify-between">
              <div>
                <div className="text-sm font-medium">{p.name} - {p.tech}</div>
                <div className="text-xs text-gray-600">{p.link}</div>
              </div>
              <button onClick={()=> removeAt('projects', i)}>Remove</button>
            </div>
          ))}
          <div className="grid grid-cols-4 gap-2">
            <input className="input" placeholder="Name" id="pr_name" />
            <input className="input" placeholder="Tech" id="pr_tech" />
            <input className="input" placeholder="Link" id="pr_link" />
            <input className="input" placeholder="Details" id="pr_details" />
          </div>
          <button className="mt-2 bg-gray-100 rounded px-3 py-1" onClick={()=> {
            const n=document.getElementById('pr_name').value.trim();
            const t=document.getElementById('pr_tech').value.trim();
            const l=document.getElementById('pr_link').value.trim();
            const d=document.getElementById('pr_details').value.trim();
            if(n && t) add('projects', {name:n, tech:t, link:l, details:d})
          }}>Add</button>
        </div>
        <div>
          <div className="font-medium mb-1">Contact</div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Email" value={resume.contact?.email||''} onChange={e=> setResume(r=> ({...r, contact:{...r.contact, email:e.target.value}}))} />
            <input className="input" placeholder="Phone" value={resume.contact?.phone||''} onChange={e=> setResume(r=> ({...r, contact:{...r.contact, phone:e.target.value}}))} />
            <input className="input" placeholder="LinkedIn" value={resume.contact?.linkedin||''} onChange={e=> setResume(r=> ({...r, contact:{...r.contact, linkedin:e.target.value}}))} />
            <input className="input" placeholder="GitHub" value={resume.contact?.github||''} onChange={e=> setResume(r=> ({...r, contact:{...r.contact, github:e.target.value}}))} />
          </div>
        </div>
        <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">Save Resume</button>
      </div>
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-3">Preview</h3>
        <div id="resume-preview" className="prose max-w-none">
          <h1 className="text-2xl font-bold">{resume.contact?.email}</h1>
          <p className="text-gray-700 whitespace-pre-wrap">{resume.summary}</p>
          <h2 className="text-xl font-semibold mt-4">Skills</h2>
          <ul className="list-disc ml-6">{(resume.skills||[]).map((s,i)=> <li key={i}>{s}</li>)}</ul>
          <h2 className="text-xl font-semibold mt-4">Education</h2>
          <ul className="list-disc ml-6">{(resume.education||[]).map((e,i)=> <li key={i}>{e.degree} - {e.institution} ({e.year})</li>)}</ul>
          <h2 className="text-xl font-semibold mt-4">Experience</h2>
          <ul className="list-disc ml-6">{(resume.experience||[]).map((e,i)=> <li key={i}>{e.role}, {e.company} - {e.duration}</li>)}</ul>
          <h2 className="text-xl font-semibold mt-4">Projects</h2>
          <ul className="list-disc ml-6">{(resume.projects||[]).map((p,i)=> <li key={i}><a className="text-blue-600" href={p.link} target="_blank">{p.name}</a> - {p.tech}</li>)}</ul>
        </div>
        <button className="mt-4 bg-gray-800 hover:bg-black text-white rounded px-4 py-2" onClick={()=> {
          const html = document.getElementById('resume-preview').innerHTML
          const w = window.open('', 'resume')
          w.document.write(`<html><head><title>Resume</title></head><body>${html}</body></html>`)
          w.document.close(); w.focus(); w.print();
        }}>Download as PDF</button>
      </div>
    </div>
  )
}

function Home(){
  return (
    <div className="min-h-[60vh] flex items-center justify-center flex-col text-center p-10">
      <h1 className="text-4xl font-extrabold tracking-tight">Welcome to Lernify Road</h1>
      <p className="text-gray-600 mt-3 max-w-2xl">Learn step-by-step with curated roadmaps, interactive assessments, progress tracking, and an integrated resume builder.</p>
      <Link to="/domains" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">Get Started</Link>
    </div>
  )
}

function Layout(){
  const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem('lr_user')||'null'))
  const navigate = useNavigate()
  const logout = () => { localStorage.removeItem('lr_user'); setUser(null); navigate('/') }
  return (
    <div>
      <Navbar user={user} onLogout={logout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage setUser={(u)=>{ setUser(u); localStorage.setItem('lr_user', JSON.stringify(u)); }} />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/roadmap/:domain" element={<RoadmapPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/resume" element={<ResumePage />} />
      </Routes>
    </div>
  )
}

function App(){
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App

// Tailwind input class
const style = document.createElement('style')
style.innerHTML = `.input{ @apply w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white }`
document.head.appendChild(style)
