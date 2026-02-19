'use client'

import { useEffect, useState } from 'react'

type DashboardSummary = {
  id: string
  name: string
  updatedAt: string
  background: string
}

export default function Review() {
  const [items, setItems] = useState<DashboardSummary[]>([])

  useEffect(() => {
    fetch('/api/canvas')
      .then((res) => res.json())
      .then((data) => setItems(data))
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <h2>저장된 대시보드</h2>
      <ul style={{ display: 'grid', gap: 12, padding: 0, listStyle: 'none' }}>
        {items.map((item) => (
          <li key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <div style={{ fontSize: 12 }}>ID: {item.id}</div>
            <div style={{ fontSize: 12 }}>수정시각: {new Date(item.updatedAt).toLocaleString()}</div>
            <div style={{ fontSize: 12 }}>배경색: {item.background}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
