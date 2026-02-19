'use client'

import { useState } from 'react'
import { Form, Input, Button, Modal } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import CustomAlert from '@/components/alert'

type LoginValues = {
  usercode: string
  password: string
}

type SignupValues = {
  newid_usercode: string
  newid_username: string
  newid_password: string
  newid_password_confirm: string
}

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [alertType, setAlertType] = useState<'success' | 'error'>('error')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [signupForm] = Form.useForm<SignupValues>()
  const router = useRouter()

  const onFinish = async (values: LoginValues) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, action: 'login' }),
    })

    if (!res.ok) {
      setAlertType('error')
      setMessage('아이디와 비밀번호를 확인하세요.')
      return
    }

    const data: { token: string } = await res.json()
    Cookies.set('token', data.token)
    localStorage.setItem('token', data.token)
    router.replace('/home')
    setTimeout(() => router.refresh(), 100)
  }

  const onSignupFinish = async (values: SignupValues) => {
    if (values.newid_password !== values.newid_password_confirm) {
      setAlertType('error')
      setMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, action: 'newid' }),
    })

    if (!res.ok) {
      setAlertType('error')
      setMessage('회원가입에 실패하였습니다. 다시 시도해주세요.')
      return
    }

    setAlertType('success')
    setMessage('회원가입이 완료되었습니다. 로그인 해주세요.')
    setIsModalOpen(false)
    signupForm.resetFields()
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CustomAlert message={message || ''} type={alertType} onClose={() => setMessage(null)} />

      <Form<LoginValues> name="login_form" style={{ maxWidth: 300 }} onFinish={onFinish}>
        <Form.Item name="usercode" rules={[{ required: true, message: '아이디를 입력하세요!' }]}>
          <Input prefix={<UserOutlined />} placeholder="ID" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '비밀번호를 입력하세요!' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Log in
          </Button>
        </Form.Item>
        <Button type="link" onClick={() => setIsModalOpen(true)}>
          회원가입
        </Button>
      </Form>

      <Modal
        title="회원가입"
        open={isModalOpen}
        onOk={() => signupForm.submit()}
        onCancel={() => setIsModalOpen(false)}
        okText="저장"
        cancelText="취소"
      >
        <Form<SignupValues> form={signupForm} name="newid_form" onFinish={onSignupFinish} layout="vertical">
          <Form.Item name="newid_usercode" label="아이디" rules={[{ required: true, message: '아이디는 필수입력 값 입니다.' }]}>
            <Input placeholder="ID" />
          </Form.Item>
          <Form.Item name="newid_username" label="이름" rules={[{ required: true, message: '이름은 필수입력 값 입니다.' }]}>
            <Input placeholder="이름" />
          </Form.Item>
          <Form.Item name="newid_password" label="비밀번호" rules={[{ required: true, message: '비밀번호는 필수입력 값 입니다.' }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item
            name="newid_password_confirm"
            label="비밀번호 확인"
            rules={[{ required: true, message: '비밀번호 확인은 필수입력 값 입니다.' }]}
          >
            <Input.Password placeholder="Password Confirm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
