"use client";

import { Layout } from "antd";
import Sidemenu from "./menu/sidemenu";

const { Sider, Content, Header } = Layout;

export default function AntdLayout({ 
    children, 
    hasToken 
}: { 
    children: React.ReactNode, 
    hasToken: boolean 
    }) {
        console.log('hasToken:', hasToken)
    return (
        <Layout style={{ minHeight: "100vh" }}>
        {hasToken && (
            <Sider collapsible>
            <Sidemenu />
            </Sider>
        )}
        <Layout>
            {
                hasToken && (
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