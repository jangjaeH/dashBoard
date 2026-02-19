'use client'

import { FormEvent, useEffect, useState } from 'react'

type Binding = {
  id: string
  code: string
  topic: string
  description?: string | null
  updatedAt: string
}

type EditForm = {
  id: string
  code: string
  topic: string
  description: string
}

export default function DataManagementPage() {
  const [code, setCode] = useState('')
  const [topic, setTopic] = useState('factory/line1/metric')
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState<Binding[]>([])
  const [status, setStatus] = useState('')
  const [editForm, setEditForm] = useState<EditForm | null>(null)

  const loadRows = async () => {
    const res = await fetch('/api/data-management')
    const data = await res.json()
    setRows(data)
  }

  useEffect(() => {
    fetch('/api/data-management')
      .then((res) => res.json())
      .then((data) => setRows(data))
  }, [])

  const createBinding = async (event: FormEvent) => {
    event.preventDefault()

    const res = await fetch('/api/data-management', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, topic, description }),
    })

    if (!res.ok) {
      setStatus('추가 실패 (중복 코드 또는 잘못된 값)')
      return
    }

    setCode('')
    setDescription('')
    setStatus('데이터 매핑이 추가되었습니다.')
    loadRows()
  }

  const deleteBinding = async (id: string) => {
    const res = await fetch(`/api/data-management?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setStatus('삭제 실패')
      return
    }

    setStatus('삭제 완료')
    loadRows()
  }

  const openEditModal = (row: Binding) => {
    setEditForm({
      id: row.id,
      code: row.code,
      topic: row.topic,
      description: row.description ?? '',
    })
  }

  const saveEdit = async () => {
    if (!editForm) {
      return
    }

    const res = await fetch('/api/data-management', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })

    if (!res.ok) {
      setStatus('수정 실패')
      return
    }

    setEditForm(null)
    setStatus('수정 완료')
    loadRows()
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>데이터 관리</h2>
      <form onSubmit={createBinding} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', border: '1px solid #dbe1f5', borderRadius: 12, padding: 12 }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="코드" required style={{ height: 34, padding: '0 10px', minWidth: 140 }} />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="MQTT topic" required style={{ height: 34, padding: '0 10px', minWidth: 260 }} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명" style={{ height: 34, padding: '0 10px', minWidth: 220 }} />
        <button type="submit" style={{ height: 34, padding: '0 14px' }}>
          추가
        </button>
      </form>

      <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>{status}</p>

      <section style={{ border: '1px solid #dbe1f5', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e2e8f0' }}>코드</th>
              <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e2e8f0' }}>토픽</th>
              <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e2e8f0' }}>설명</th>
              <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e2e8f0' }}>수정일</th>
              <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e2e8f0' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onDoubleClick={() => openEditModal(row)} style={{ borderBottom: '1px solid #eef2ff', cursor: 'pointer' }}>
                <td style={{ padding: 10 }}>{row.code}</td>
                <td style={{ padding: 10 }}>{row.topic}</td>
                <td style={{ padding: 10 }}>{row.description || '-'}</td>
                <td style={{ padding: 10 }}>{new Date(row.updatedAt).toLocaleString()}</td>
                <td style={{ padding: 10 }}>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteBinding(row.id)
                    }}
                    style={{ height: 28, padding: '0 10px' }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: '#64748b' }}>
                  등록된 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {editForm && (
        <div
          onClick={() => setEditForm(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.35)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ background: '#fff', borderRadius: 12, padding: 16, width: 460, display: 'grid', gap: 8 }}
          >
            <h3 style={{ margin: 0 }}>데이터 수정</h3>
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              코드
              <input
                value={editForm.code}
                onChange={(event) => setEditForm((prev) => (prev ? { ...prev, code: event.target.value } : prev))}
                style={{ height: 34, padding: '0 10px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              토픽
              <input
                value={editForm.topic}
                onChange={(event) => setEditForm((prev) => (prev ? { ...prev, topic: event.target.value } : prev))}
                style={{ height: 34, padding: '0 10px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              설명
              <input
                value={editForm.description}
                onChange={(event) => setEditForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
                style={{ height: 34, padding: '0 10px' }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button onClick={() => setEditForm(null)} style={{ height: 32, padding: '0 12px' }}>
                취소
              </button>
              <button onClick={saveEdit} style={{ height: 32, padding: '0 12px' }}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
