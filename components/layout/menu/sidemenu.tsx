'use client'

import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { BarChartOutlined, ClusterOutlined, DashboardOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons'
import { usePathname, useRouter } from 'next/navigation'

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
  { key: '/home', label: 'Home', icon: <MailOutlined /> },
  { key: '/review', label: 'Code Review', icon: <ClusterOutlined /> },
  { key: '/dashboard', label: 'Dash Board', icon: <DashboardOutlined /> },
  { key: '/data-management', label: '데이터 관리', icon: <BarChartOutlined /> },
  { key: '/setting', label: 'Setting', icon: <SettingOutlined /> },
]

export default function Sidemenu() {
  const router = useRouter()
  const pathname = usePathname()

  const onClick: MenuProps['onClick'] = (event) => {
    router.replace(event.key)
  }

  return <Menu onClick={onClick} selectedKeys={[pathname]} theme="dark" mode="inline" items={items} style={{ height: '100%' }} />
}
