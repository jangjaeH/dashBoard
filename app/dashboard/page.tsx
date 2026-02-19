'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type ElementType = 'shape' | 'chart'
type ShapeKind = 'rect' | 'circle'

type DashboardElement = {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  label: string
  value: string
  shape?: ShapeKind
}

const chartData = [
  { name: 'A', value: 120 },
  { name: 'B', value: 80 },
  { name: 'C', value: 160 },
  { name: 'D', value: 60 },
]

export default function Dashboard() {
  const [name, setName] = useState('새 대시보드')
  const [background, setBackground] = useState('#f7f9fc')
  const [dashboardId, setDashboardId] = useState<string | null>(null)
  const [elements, setElements] = useState<DashboardElement[]>([])
  const [statusMessage, setStatusMessage] = useState('')

  const selected = useMemo(() => elements[0], [elements])

  const addShape = (shape: ShapeKind) => {
    setElements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'shape',
        shape,
        x: 40 + prev.length * 20,
        y: 40 + prev.length * 20,
        width: 180,
        height: 120,
        label: 'DB 필드명',
        value: '값 미연결',
      },
    ])
  }

  const addChart = () => {
    setElements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'chart',
        x: 80 + prev.length * 20,
        y: 80 + prev.length * 20,
        width: 320,
        height: 220,
        label: '차트 위젯',
        value: '',
      },
    ])
  }

  const saveDashboard = async () => {
    const payload = {
      id: dashboardId,
      name,
      background,
      width: 1200,
      height: 700,
      elements,
    }

    const method = dashboardId ? 'PUT' : 'POST'
    const res = await fetch('/api/canvas', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setStatusMessage('저장 실패')
      return
    }

    const data = await res.json()
    setDashboardId(data.id)
    setStatusMessage(`저장 완료: ${data.id}`)
  }

  const loadDashboard = async () => {
    if (!dashboardId) {
      setStatusMessage('불러올 ID가 없습니다.')
      return
    }

    const res = await fetch(`/api/canvas?id=${dashboardId}`)
    if (!res.ok) {
      setStatusMessage('불러오기 실패')
      return
    }

    const data = await res.json()
    setName(data.name)
    setBackground(data.background)
    setElements(data.elements)
    setStatusMessage('불러오기 완료')
  }

  return (
    <main style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '100vh' }}>
      <aside style={{ borderRight: '1px solid #e5e7eb', padding: 16, display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0 }}>PPT형 대시보드 빌더</h2>
        <label>
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          배경색
          <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} />
        </label>
        <button onClick={() => addShape('rect')}>사각형 추가</button>
        <button onClick={() => addShape('circle')}>원형 추가</button>
        <button onClick={addChart}>차트 추가</button>
        <button onClick={saveDashboard}>저장</button>
        <button onClick={loadDashboard}>현재 ID로 불러오기</button>
        <p style={{ fontSize: 12, color: '#4b5563' }}>{statusMessage}</p>
        <p style={{ fontSize: 12, color: '#4b5563', wordBreak: 'break-all' }}>ID: {dashboardId ?? '저장 후 생성'}</p>
        {selected && <p style={{ fontSize: 12 }}>첫 요소: {selected.label}</p>}
      </aside>

      <section style={{ padding: 24, overflow: 'auto' }}>
        <div
          style={{
            width: 1200,
            height: 700,
            background,
            border: '1px solid #d1d5db',
            borderRadius: 8,
            position: 'relative',
          }}
        >
          {elements.map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: el.shape === 'circle' ? '50%' : 8,
                padding: 8,
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              <strong style={{ fontSize: 12 }}>{el.label}</strong>
              {el.type === 'shape' ? (
                <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700 }}>{el.value}</div>
              ) : (
                <div style={{ width: '100%', height: '85%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
