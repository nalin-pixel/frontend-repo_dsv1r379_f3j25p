import { useEffect, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function App() {
  const [children, setChildren] = useState([])
  const [name, setName] = useState('')
  const [selectedChild, setSelectedChild] = useState('')
  const [status, setStatus] = useState('')
  const [coords, setCoords] = useState(null)
  const [note, setNote] = useState('')
  const [link, setLink] = useState('')
  const [latest, setLatest] = useState([])

  useEffect(() => {
    fetchChildren()
    fetchLatest()
  }, [])

  const fetchChildren = async () => {
    try {
      const res = await fetch(`${BACKEND}/child`)
      const data = await res.json()
      setChildren(data)
      if (data.length > 0) setSelectedChild(data[0].id)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchLatest = async () => {
    try {
      const res = await fetch(`${BACKEND}/checkin/latest`)
      const data = await res.json()
      setLatest(data)
    } catch (e) {
      console.error(e)
    }
  }

  const createChild = async (e) => {
    e.preventDefault()
    setStatus('Creating...')
    try {
      const res = await fetch(`${BACKEND}/child`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await res.json()
      setStatus('Created')
      setName('')
      await fetchChildren()
    } catch (e) {
      setStatus('Failed')
    }
  }

  const getLocation = () => {
    if (!selectedChild) {
      setStatus('Select a profile first')
      return
    }
    if (!('geolocation' in navigator)) {
      setStatus('Geolocation not supported')
      return
    }
    setStatus('Getting location...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setCoords({ lat: latitude, lng: longitude, accuracy })
        setStatus(`Location ready: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
      },
      (err) => setStatus(`Location error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const sendCheckin = async () => {
    if (!coords) { setStatus('Get location first'); return }
    setStatus('Sending...')
    try {
      const res = await fetch(`${BACKEND}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: selectedChild,
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          note,
          link
        })
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('Shared successfully')
      setNote('')
      setLink('')
      setCoords(null)
      fetchLatest()
    } catch (e) {
      setStatus('Failed to share')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="bg-white/80 backdrop-blur p-4 rounded-xl shadow">
          <h1 className="text-2xl font-bold">Consent-based Check-in</h1>
          <p className="text-gray-600 text-sm">Child can choose to share location and a link. No hidden tracking.</p>
        </header>

        <section className="bg-white p-4 rounded-xl shadow space-y-3">
          <h2 className="font-semibold">Create Child Profile</h2>
          <form onSubmit={createChild} className="flex gap-2">
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Child name" className="flex-1 border rounded px-3 py-2"/>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
          </form>
        </section>

        <section className="bg-white p-4 rounded-xl shadow space-y-3">
          <h2 className="font-semibold">Share a Check-in</h2>
          <div className="flex flex-col gap-2">
            <select value={selectedChild} onChange={(e)=>setSelectedChild(e.target.value)} className="border rounded px-3 py-2">
              <option value="">Select profile</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2 flex-wrap">
              <button onClick={getLocation} className="px-4 py-2 bg-emerald-600 text-white rounded">Get Location</button>
              <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Optional note" className="flex-1 border rounded px-3 py-2"/>
              <input value={link} onChange={(e)=>setLink(e.target.value)} placeholder="Optional link (e.g., YouTube)" className="flex-1 border rounded px-3 py-2"/>
              <button onClick={sendCheckin} className="px-4 py-2 bg-indigo-600 text-white rounded">Share</button>
            </div>
            {coords && (
              <p className="text-sm text-gray-600">Ready: lat {coords.lat.toFixed(5)}, lng {coords.lng.toFixed(5)} ±{Math.round(coords.accuracy)}m</p>
            )}
            {status && <p className="text-sm text-gray-700">{status}</p>}
          </div>
        </section>

        <section className="bg-white p-4 rounded-xl shadow space-y-3">
          <h2 className="font-semibold">Latest Check-ins</h2>
          <div className="space-y-2">
            {latest.map(item => (
              <div key={item.id} className="border rounded p-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{item.child_id}</span>
                  <span>{new Date(item.created_at).toLocaleString?.() || ''}</span>
                </div>
                <p className="font-mono text-sm">{item.lat.toFixed(5)}, {item.lng.toFixed(5)} ±{Math.round(item.accuracy || 0)}m</p>
                {item.note && <p className="text-sm">Note: {item.note}</p>}
                {item.link && <a className="text-blue-600 text-sm underline" href={item.link} target="_blank">Link</a>}
              </div>
            ))}
            {latest.length === 0 && <p className="text-sm text-gray-500">No check-ins yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
