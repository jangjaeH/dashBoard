'use client'

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type ElementType = 'shape' | 'chart'
type ShapeKind = 'rect' | 'circle' | 'triangle' | 'diamond' | 'line' | 'arrow'
type PaletteItem = 'rect' | 'circle' | 'triangle' | 'diamond' | 'chart' | 'line' | 'arrow'

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
  fontFamily: string
  fontSize: number
  textColor: string
  dataCode?: string
}

type DashboardTab = {
  localId: string
  id: string | null
  name: string
  background: string
  backgroundImage: string | null
  elements: DashboardElement[]
}

type MqttValue = {
  code: string
  value: string
}

const chartData = [
  { name: 'A', value: 120 },
  { name: 'B', value: 80 },
  { name: 'C', value: 160 },
  { name: 'D', value: 60 },
]

const toolItems: { key: PaletteItem; icon: string; title: string }[] = [
  { key: 'rect', icon: '▭', title: '사각형' },
  { key: 'circle', icon: '◯', title: '원형' },
  { key: 'triangle', icon: '△', title: '삼각형' },
  { key: 'diamond', icon: '◇', title: '마름모' },
  { key: 'line', icon: '╱', title: '선' },
  { key: 'arrow', icon: '→', title: '화살표' },
  { key: 'chart', icon: '▥', title: '차트' },
]

const fontOptions = ['Pretendard', 'Arial', 'Noto Sans KR', 'Verdana', 'Georgia']

const makeEmptyTab = (index: number): DashboardTab => ({
  localId: crypto.randomUUID(),
  id: null,
  name: `대시보드 ${index}`,
  background: '#ffffff',
  backgroundImage: null,
  elements: [],
})

const createElementFromPalette = (item: PaletteItem, x: number, y: number): DashboardElement => {
  const base = {
    id: crypto.randomUUID(),
    x,
    y,
    label: '텍스트',
    value: 'DB 값',
    fontFamily: 'Pretendard',
    fontSize: 22,
    textColor: '#111827',
    dataCode: '',
  }

  if (item === 'chart') {
    return {
      ...base,
      type: 'chart',
      width: 360,
      height: 240,
      label: '차트 위젯',
      value: '',
    }
  }

  if (item === 'line') {
    return {
      ...base,
      type: 'shape',
      shape: 'line',
      width: 180,
      height: 16,
      label: '선',
      value: '',
    }
  }

  if (item === 'arrow') {
    return {
      ...base,
      type: 'shape',
      shape: 'arrow',
      width: 180,
      height: 30,
      label: '화살표',
      value: '',
    }
  }

  return {
    ...base,
    type: 'shape',
    shape: item,
    width: item === 'circle' ? 140 : 210,
    height: 140,
    label:
      item === 'rect'
        ? '사각형 지표'
        : item === 'circle'
          ? '원형 지표'
          : item === 'triangle'
            ? '삼각형 지표'
            : '마름모 지표',
  }
}

export default function Dashboard() {
  const [dashboards, setDashboards] = useState<DashboardTab[]>([makeEmptyTab(1)])
  const [activeTabId, setActiveTabId] = useState<string>(dashboards[0].localId)
  const [statusMessage, setStatusMessage] = useState('상단 아이콘을 캔버스로 드래그해 배치하세요.')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mqttValueMap, setMqttValueMap] = useState<Record<string, string>>({})
  const canvasRef = useRef<HTMLDivElement>(null)

  const activeDashboard = useMemo(
    () => dashboards.find((dashboard) => dashboard.localId === activeTabId) ?? dashboards[0],
    [dashboards, activeTabId],
  )

  const selected = useMemo(
    () => activeDashboard?.elements.find((element) => element.id === selectedId) ?? null,
    [activeDashboard, selectedId],
  )

  useEffect(() => {
    const poll = async () => {
      const res = await fetch('/api/mqtt-values')
      if (!res.ok) return
      const rows: MqttValue[] = await res.json()
      const map = rows.reduce<Record<string, string>>((acc, row) => {
        acc[row.code] = row.value
        return acc
      }, {})
      setMqttValueMap(map)
    }

    poll()
    const timer = setInterval(poll, 2500)
    return () => clearInterval(timer)
  }, [])

  const updateActiveDashboard = (updater: (dashboard: DashboardTab) => DashboardTab) => {
    setDashboards((prev) => prev.map((dashboard) => (dashboard.localId === activeTabId ? updater(dashboard) : dashboard)))
  }

  const updateSelectedElement = (updater: (element: DashboardElement) => DashboardElement) => {
    if (!selectedId) return

    updateActiveDashboard((dashboard) => ({
      ...dashboard,
      elements: dashboard.elements.map((element) => (element.id === selectedId ? updater(element) : element)),
    }))
  }

  const addTab = () => {
    const next = makeEmptyTab(dashboards.length + 1)
    setDashboards((prev) => [...prev, next])
    setActiveTabId(next.localId)
    setSelectedId(null)
    setStatusMessage('새 대시보드 탭이 생성되었습니다.')
  }

  const onBackgroundImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      updateActiveDashboard((dashboard) => ({
        ...dashboard,
        backgroundImage: typeof reader.result === 'string' ? reader.result : null,
      }))
      setStatusMessage('배경 이미지가 적용되었습니다.')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const clearBackgroundImage = () => {
    updateActiveDashboard((dashboard) => ({ ...dashboard, backgroundImage: null }))
    setStatusMessage('배경 이미지를 제거했습니다.')
  }

  const saveDashboard = async () => {
    if (!activeDashboard) return

    const payload = {
      id: activeDashboard.id,
      name: activeDashboard.name,
      background: activeDashboard.background,
      backgroundImage: activeDashboard.backgroundImage,
      width: 1200,
      height: 700,
      elements: activeDashboard.elements,
    }

    const method = activeDashboard.id ? 'PUT' : 'POST'
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
    updateActiveDashboard((dashboard) => ({ ...dashboard, id: data.id }))
    setStatusMessage(`저장 완료: ${data.id}`)
  }

  const loadDashboard = async () => {
    if (!activeDashboard?.id) {
      setStatusMessage('현재 탭은 아직 저장된 ID가 없습니다.')
      return
    }

    const res = await fetch(`/api/canvas?id=${activeDashboard.id}`)
    if (!res.ok) {
      setStatusMessage('불러오기 실패')
      return
    }

    const data = await res.json()
    updateActiveDashboard((dashboard) => ({
      ...dashboard,
      name: data.name,
      background: data.background,
      backgroundImage: data.backgroundImage ?? null,
      elements: data.elements,
    }))
    setSelectedId(null)
    setStatusMessage('불러오기 완료')
  }

  const startPaletteDrag = (event: DragEvent<HTMLButtonElement>, item: PaletteItem) => {
    event.dataTransfer.setData('application/dashboard-item', item)
    event.dataTransfer.effectAllowed = 'copy'
  }

  const allowDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    const item = event.dataTransfer.getData('application/dashboard-item') as PaletteItem
    if (!item) return

    const bounds = canvasRef.current?.getBoundingClientRect()
    if (!bounds) return

    const x = Math.max(8, Math.min(event.clientX - bounds.left - 90, bounds.width - 380))
    const y = Math.max(8, Math.min(event.clientY - bounds.top - 60, bounds.height - 260))

    const nextElement = createElementFromPalette(item, x, y)

    updateActiveDashboard((dashboard) => ({
      ...dashboard,
      elements: [...dashboard.elements, nextElement],
    }))
    setSelectedId(nextElement.id)
    setStatusMessage('요소가 추가되었습니다.')
  }

  const moveElement = (event: DragEvent<HTMLDivElement>, id: string) => {
    const bounds = canvasRef.current?.getBoundingClientRect()
    if (!bounds) return

    const x = Math.max(0, Math.min(event.clientX - bounds.left - 40, bounds.width - 120))
    const y = Math.max(0, Math.min(event.clientY - bounds.top - 28, bounds.height - 80))

    updateActiveDashboard((dashboard) => ({
      ...dashboard,
      elements: dashboard.elements.map((element) => (element.id === id ? { ...element, x, y } : element)),
    }))
  }

  const resolveElementValue = (element: DashboardElement) => {
    if (!element.dataCode) return element.value
    return mqttValueMap[element.dataCode] ?? `${element.value} (대기)`
  }

  const shapeClipPath = (shape?: ShapeKind) => {
    if (shape === 'triangle') return 'polygon(50% 0, 100% 100%, 0 100%)'
    if (shape === 'diamond') return 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)'
    return undefined
  }

  const deleteSelectedElement = () => {
    if (!selectedId) return

    updateActiveDashboard((dashboard) => ({
      ...dashboard,
      elements: dashboard.elements.filter((element) => element.id !== selectedId),
    }))
    setSelectedId(null)
    setStatusMessage('선택 요소를 삭제했습니다.')
  }

  const duplicateSelectedElement = () => {
    if (!selected) return

    const duplicated: DashboardElement = {
      ...selected,
      id: crypto.randomUUID(),
      x: Math.min(selected.x + 24, 1100),
      y: Math.min(selected.y + 24, 620),
    }

    updateActiveDashboard((dashboard) => ({
      ...dashboard,
      elements: [...dashboard.elements, duplicated],
    }))
    setSelectedId(duplicated.id)
    setStatusMessage('선택 요소를 복제했습니다.')
  }

  const bringSelectedToFront = () => {
    if (!selectedId) return
    updateActiveDashboard((dashboard) => {
      const target = dashboard.elements.find((element) => element.id === selectedId)
      if (!target) return dashboard

      return {
        ...dashboard,
        elements: [...dashboard.elements.filter((element) => element.id !== selectedId), target],
      }
    })
  }

  const sendSelectedToBack = () => {
    if (!selectedId) return
    updateActiveDashboard((dashboard) => {
      const target = dashboard.elements.find((element) => element.id === selectedId)
      if (!target) return dashboard

      return {
        ...dashboard,
        elements: [target, ...dashboard.elements.filter((element) => element.id !== selectedId)],
      }
    })
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 45%, #e0f2fe 100%)',
        padding: 20,
        fontFamily: 'Pretendard, Noto Sans KR, Arial, sans-serif',
      }}
    >
      <section style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #dbe1f5', padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {dashboards.map((dashboard) => {
            const isActive = dashboard.localId === activeTabId
            return (
              <button
                key={dashboard.localId}
                onClick={() => {
                  setActiveTabId(dashboard.localId)
                  setSelectedId(null)
                }}
                style={{
                  border: isActive ? '1px solid #1d4ed8' : '1px solid #c7d2fe',
                  background: isActive ? '#dbeafe' : '#f8fafc',
                  color: '#1e293b',
                  borderRadius: 10,
                  height: 34,
                  padding: '0 12px',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {dashboard.name}
              </button>
            )
          })}
          <button
            onClick={addTab}
            style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #c7d2fe', background: '#eff6ff', color: '#1d4ed8', fontSize: 20, lineHeight: 1 }}
            title="대시보드 탭 추가"
          >
            +
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12 }}>
        <div style={{ background: '#ffffff', border: '1px solid #dbe1f5', borderRadius: 16, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {toolItems.map((item) => (
              <button
                key={item.key}
                draggable
                onDragStart={(event) => startPaletteDrag(event, item.key)}
                title={item.title}
                style={{ width: 30, height: 30, border: '1px solid #94a3b8', borderRadius: 8, background: '#f8fafc', color: '#0f172a', cursor: 'grab', fontSize: 14 }}
              >
                {item.icon}
              </button>
            ))}

            <div style={{ width: 1, height: 20, background: '#cbd5e1', margin: '0 2px' }} />

            <input
              value={activeDashboard.name}
              onChange={(event) => updateActiveDashboard((dashboard) => ({ ...dashboard, name: event.target.value || '제목 없음' }))}
              style={{ height: 30, border: '1px solid #94a3b8', borderRadius: 8, padding: '0 8px', width: 160, fontSize: 13 }}
            />
            <input
              type="color"
              value={activeDashboard.background}
              onChange={(event) => updateActiveDashboard((dashboard) => ({ ...dashboard, background: event.target.value }))}
              style={{ width: 34, height: 30, border: '1px solid #94a3b8', borderRadius: 8, padding: 0 }}
            />
            <label style={{ height: 30, border: '1px solid #94a3b8', borderRadius: 8, background: '#f8fafc', padding: '0 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              배경 이미지
              <input type="file" accept="image/*" onChange={onBackgroundImageUpload} style={{ display: 'none' }} />
            </label>
            <button onClick={clearBackgroundImage} style={{ height: 30, border: '1px solid #94a3b8', borderRadius: 8, background: '#f8fafc', padding: '0 10px', fontSize: 12 }}>
              이미지 제거
            </button>
            <button onClick={saveDashboard} style={{ height: 30, border: '1px solid #94a3b8', borderRadius: 8, background: '#eff6ff', padding: '0 10px', fontSize: 13 }}>
              저장
            </button>
            <button onClick={loadDashboard} style={{ height: 30, border: '1px solid #94a3b8', borderRadius: 8, background: '#f8fafc', padding: '0 10px', fontSize: 13 }}>
              불러오기
            </button>
          </div>

          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>{statusMessage}</p>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', wordBreak: 'break-all' }}>ID: {activeDashboard.id ?? '저장 후 생성'}</p>

          <div style={{ overflow: 'auto' }}>
            <div
              ref={canvasRef}
              onDragOver={allowDrop}
              onDrop={handleCanvasDrop}
              style={{
                width: 1200,
                height: 700,
                backgroundColor: activeDashboard.background,
                backgroundImage: activeDashboard.backgroundImage ? `url(${activeDashboard.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                position: 'relative',
              }}
            >
              {activeDashboard.elements.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: 14 }}>아이콘을 드래그해서 요소를 추가하세요.</div>
              )}

              {activeDashboard.elements.map((element) => (
                <div
                  key={element.id}
                  draggable
                  onDragEnd={(event) => moveElement(event, element.id)}
                  onClick={() => setSelectedId(element.id)}
                  style={{
                    position: 'absolute',
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    background: element.shape === 'line' || element.shape === 'arrow' ? 'transparent' : '#ffffff',
                    border: element.shape === 'line' || element.shape === 'arrow' ? 'none' : selectedId === element.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    borderRadius: element.shape === 'circle' ? '50%' : 10,
                    clipPath: shapeClipPath(element.shape),
                    padding: element.shape === 'line' || element.shape === 'arrow' ? 0 : element.shape === 'triangle' || element.shape === 'diamond' ? 20 : 10,
                    boxShadow: element.shape === 'line' || element.shape === 'arrow' ? 'none' : '0 8px 20px rgba(15, 23, 42, 0.08)',
                    overflow: 'hidden',
                    cursor: 'move',
                    display: element.shape === 'triangle' || element.shape === 'diamond' ? 'grid' : 'block',
                    alignContent: element.shape === 'triangle' || element.shape === 'diamond' ? 'center' : undefined,
                    textAlign: element.shape === 'triangle' || element.shape === 'diamond' ? 'center' : undefined,
                  }}
                >
                  {element.shape === 'line' && <div style={{ width: '100%', height: 2, background: element.textColor, marginTop: 6 }} />}
                  {element.shape === 'arrow' && (
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                      <div style={{ flex: 1, height: 2, background: element.textColor }} />
                      <div style={{ width: 0, height: 0, borderTop: `6px solid transparent`, borderBottom: `6px solid transparent`, borderLeft: `10px solid ${element.textColor}` }} />
                    </div>
                  )}

                  {element.shape !== 'line' && element.shape !== 'arrow' && (
                    <>
                      <strong style={{ fontSize: 12, color: '#334155' }}>{element.label}</strong>
                      {element.type === 'shape' ? (
                        <div style={{ marginTop: 8, fontFamily: element.fontFamily, fontSize: element.fontSize, color: element.textColor, fontWeight: 700 }}>{resolveElementValue(element)}</div>
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
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside style={{ background: '#ffffff', border: '1px solid #dbe1f5', borderRadius: 16, padding: 14, display: 'grid', gap: 10, alignContent: 'start' }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#1e293b' }}>데이터/텍스트 설정</h3>
          {selected ? (
            <>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, display: 'grid', gap: 6 }}>
                <strong style={{ fontSize: 12, color: '#334155' }}>요소 관리</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button onClick={duplicateSelectedElement} style={{ height: 30, fontSize: 12 }}>
                    복제
                  </button>
                  <button onClick={deleteSelectedElement} style={{ height: 30, fontSize: 12 }}>
                    삭제
                  </button>
                  <button onClick={bringSelectedToFront} style={{ height: 30, fontSize: 12 }}>
                    맨 앞으로
                  </button>
                  <button onClick={sendSelectedToBack} style={{ height: 30, fontSize: 12 }}>
                    맨 뒤로
                  </button>
                </div>
                <label style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 4 }}>
                  가로 크기
                  <input type="range" min={50} max={500} value={selected.width} onChange={(event) => updateSelectedElement((element) => ({ ...element, width: Number(event.target.value) }))} />
                  <span style={{ fontSize: 12 }}>{selected.width}px</span>
                </label>
                <label style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 4 }}>
                  세로 크기
                  <input type="range" min={10} max={500} value={selected.height} onChange={(event) => updateSelectedElement((element) => ({ ...element, height: Number(event.target.value) }))} />
                  <span style={{ fontSize: 12 }}>{selected.height}px</span>
                </label>
              </div>

              {selected.shape !== 'line' && selected.shape !== 'arrow' && (
                <>
              <label style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 4 }}>
                데이터 코드
                <input value={selected.dataCode ?? ''} onChange={(event) => updateSelectedElement((element) => ({ ...element, dataCode: event.target.value }))} style={{ height: 30, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 8px', fontSize: 13 }} placeholder="예: TEMP_001" />
              </label>
              <label style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 4 }}>
                라벨
                <input value={selected.label} onChange={(event) => updateSelectedElement((element) => ({ ...element, label: event.target.value }))} style={{ height: 30, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 8px', fontSize: 13 }} />
              </label>
              <label style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 4 }}>
                기본 값 텍스트
                <input value={selected.value} onChange={(event) => updateSelectedElement((element) => ({ ...element, value: event.target.value }))} style={{ height: 30, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 8px', fontSize: 13 }} />
              </label>
              <label style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 4 }}>
                폰트
                <select value={selected.fontFamily} onChange={(event) => updateSelectedElement((element) => ({ ...element, fontFamily: event.target.value }))} style={{ height: 30, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 8px', fontSize: 13 }}>
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 4 }}>
                글씨 크기
                <input type="range" min={12} max={48} value={selected.fontSize} onChange={(event) => updateSelectedElement((element) => ({ ...element, fontSize: Number(event.target.value) }))} />
                <span style={{ fontSize: 12 }}>{selected.fontSize}px</span>
              </label>
              <label style={{ fontSize: 12, color: '#475569', display: 'grid', gap: 4 }}>
                글자색
                <input type="color" value={selected.textColor} onChange={(event) => updateSelectedElement((element) => ({ ...element, textColor: event.target.value }))} style={{ width: 42, height: 30, border: '1px solid #cbd5e1', borderRadius: 8, padding: 0 }} />
              </label>
                </>
              )}
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>도형(사각형/원형/차트)을 선택하면 데이터 코드, 폰트, 크기, 글자색을 편집할 수 있습니다.</p>
          )}
        </aside>
      </section>
    </main>
  )
}
