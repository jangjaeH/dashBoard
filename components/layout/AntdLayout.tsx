'use client'

import { Button, Flex, Form, Input, Layout, Modal, Tooltip } from 'antd'
import Sidemenu from './menu/sidemenu'
import { usePathname, useRouter } from 'next/navigation'
import { IdcardOutlined, LoginOutlined } from '@ant-design/icons'
import { useState } from 'react'

const { Sider, Content, Header } = Layout

type ProfileInfo = {
  usercode: string
  username?: string
  use_yn?: string
}

type PasswordForm = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

export default function AntdLayout({
  children,
  hasToken,
}: {
  children: React.ReactNode
  hasToken: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [passwordForm] = Form.useForm<PasswordForm>()

  const isLoginPage = pathname === '/login'
  const showNavigation = hasToken && !isLoginPage

  const modalCommonProps = {
    centered: true,
    getContainer: () => document.body,
    zIndex: 2000,
    styles: {
      mask: {
        position: 'fixed' as const,
        inset: 0,
        width: '100vw',
        height: '100vh',
      },
      wrapper: {
        position: 'fixed' as const,
        inset: 0,
      },
    },
  }

  const onLogout = async () => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })

    if (res.ok) {
      router.replace('/login')
      setTimeout(() => router.refresh(), 100)
    }
  }

  const openProfile = async () => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'profile' }),
    })

    if (!res.ok) return

    const data = (await res.json()) as ProfileInfo
    setProfileInfo(data)
    setProfileOpen(true)
  }

  const onChangePassword = async (values: PasswordForm) => {
    if (values.newPassword !== values.newPasswordConfirm) {
      Modal.error({ title: '오류', content: '새 비밀번호 확인이 일치하지 않습니다.' })
      return
    }

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change-password',
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    })

    const data = (await res.json()) as { message?: string }

    if (!res.ok) {
      Modal.error({ title: '오류', content: data.message ?? '비밀번호 변경 실패' })
      return
    }

    Modal.success({ title: '완료', content: data.message ?? '비밀번호가 변경되었습니다.' })
    setPasswordModalOpen(false)
    passwordForm.resetFields()
  }

  const requestWithdraw = async () => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'withdraw' }),
    })

    const data = (await res.json()) as { message?: string }
    if (res.ok) {
      setWithdrawConfirmOpen(false)
      setProfileOpen(false)
      Modal.success({ title: '완료', content: data.message ?? '탈퇴 처리되었습니다.' })
      router.replace('/login')
      setTimeout(() => router.refresh(), 100)
      return
    }

    Modal.error({ title: '오류', content: data.message ?? '탈퇴 실패' })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {showNavigation && (
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={220} collapsedWidth={70}>
          <Sidemenu />
        </Sider>
      )}

      <Layout>
        {showNavigation && (
          <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Flex gap="small" align="center">
              <Tooltip title="profile">
                <Button icon={<IdcardOutlined />} style={{ margin: 10 }} onClick={openProfile} />
              </Tooltip>
              <Tooltip title="Logout">
                <Button icon={<LoginOutlined />} style={{ margin: 10 }} onClick={onLogout} />
              </Tooltip>
            </Flex>
          </Header>
        )}
        <Content style={{ minWidth: 0 }}>{children}</Content>
      </Layout>

      <Modal
        title="내 정보"
        open={profileOpen}
        onCancel={() => setProfileOpen(false)}
        footer={null}
        {...modalCommonProps}
      >
        <p style={{ marginBottom: 8 }}>아이디: {profileInfo?.usercode ?? '-'}</p>
        <p style={{ marginBottom: 16 }}>이름: {profileInfo?.username ?? '-'}</p>
        <Flex gap="small">
          <Button onClick={() => setPasswordModalOpen(true)}>비밀번호 변경</Button>
          <Button danger onClick={() => setWithdrawConfirmOpen(true)}>
            회원탈퇴
          </Button>
        </Flex>
      </Modal>

      <Modal
        title="비밀번호 변경"
        open={passwordModalOpen}
        onCancel={() => setPasswordModalOpen(false)}
        onOk={() => passwordForm.submit()}
        okText="변경"
        cancelText="취소"
        {...modalCommonProps}
      >
        <Form form={passwordForm} layout="vertical" onFinish={onChangePassword}>
          <Form.Item name="currentPassword" label="현재 비밀번호" rules={[{ required: true, message: '현재 비밀번호를 입력하세요.' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="새 비밀번호" rules={[{ required: true, message: '새 비밀번호를 입력하세요.' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPasswordConfirm" label="새 비밀번호 확인" rules={[{ required: true, message: '새 비밀번호 확인을 입력하세요.' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="회원탈퇴"
        open={withdrawConfirmOpen}
        onCancel={() => setWithdrawConfirmOpen(false)}
        onOk={requestWithdraw}
        okText="탈퇴"
        cancelText="취소"
        okButtonProps={{ danger: true }}
        {...modalCommonProps}
      >
        정말 탈퇴하시겠습니까?
      </Modal>
    </Layout>
  )
}
