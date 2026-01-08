"use client";

import { Layout } from "antd";
import Sidemenu from "./menu/sidemenu";
import { usePathname } from "next/navigation"

const { Sider, Content, Header } = Layout;

export default function AntdLayout({ 
    children, 
    hasToken 
}: { 
    children: React.ReactNode, 
    hasToken: boolean 
    }) {
        console.log('hasToken:', hasToken)
    const pathname = usePathname();
    
    const isLoginPage = pathname === '/login';
    const showNavigation = hasToken && !isLoginPage; 
    return (
        <Layout style={{ minHeight: "100vh" }}>
        {showNavigation && (
            <Sider collapsible>
            <Sidemenu />
            </Sider>
        )}
        <Layout>
            {
                showNavigation && (
                    <Header style={{ background: '#fff', padding: 0 }}>
                    {/* 알람, 검색, 프로필 넣을곳 */}
                    </Header>
                )
            }
            <Content>
            {children}
            </Content>
        </Layout>
        </Layout>
    );
}