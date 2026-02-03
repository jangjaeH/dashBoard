import { Layout } from "antd";
import { cookies } from "next/headers"; 
import { redirect } from "next/navigation";
import { Stage, Layer, React, Transformer, Group } from 'react-konva';
export default async function Home() {
    // 토큰 검사
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const { Content, Sider } = Layout;
    if(!token) {
        redirect('/login');
    }
    return (
        <Layout style={{height: '100vh'}}>
            <Content style={{  }}>

            </Content>
        </Layout>
    )
}