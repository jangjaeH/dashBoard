import React  from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { MailOutlined, AppstoreOutlined, DashboardOutlined, ProjectOutlined, FileSearchOutlined, BarChartOutlined, ClusterOutlined, TeamOutlined, SettingOutlined, } from "@ant-design/icons";
import { NextResponse } from 'next/server';
import { useRouter } from 'next/navigation';


type MenuItem = Required<MenuProps>['items'][number];
const items: MenuItem[] = [
    {
      key: '/home', 
      label: 'Home',  
      icon: <MailOutlined />,
    },
    {
        key: '/review',
        label: 'Code Review',
        icon: <ClusterOutlined />,
    },
    {
        key: '/dashboard',
        label: 'Dash Board',
        icon: <DashboardOutlined />,
    },
    {
        key: '/data-management',
        label: '데이터 관리',
        icon: <BarChartOutlined />,
    },
    {
        key: '/setting',
        label: 'Setting',
        icon: <SettingOutlined />,
    }
];

export default function Sidemenu() {
    const router = useRouter();
    const onClick: MenuProps['onClick'] = (e) => {
        console.log('click ', e.key);
        router.replace(e.key);
    };

    return (
        <Menu
            onClick={onClick}
            style={{ height: "100vh" }}
            defaultSelectedKeys={['1']}    
            theme="dark"
            mode="inline"
            items={items}
        />
    );
};