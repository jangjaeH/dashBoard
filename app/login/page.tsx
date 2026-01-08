'use client';

import { Form, Input, Button } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import  Cookies  from 'js-cookie';
export default function LoginPage() {

    const router = useRouter();
    const onFinish = async (values: any) => {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(values),
        })

        if (res.ok) {
            const data = await res.json();
            Cookies.set('token', data.token);
            localStorage.setItem('token', data.token);
            // router.refresh();
            router.replace('home');

            setTimeout(() => {
                router.refresh();
            }, 100);
        } else {
            
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
        }}>
            <Form
                name="login_form"
                style={{ maxWidth: 300 }}
                onFinish={onFinish}
            >
                <Form.Item
                    name="usercode"
                    rules={[{ required: true, message: '아이디를 입력하세요!' }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="ID" />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: '비밀번호를 입력하세요!' }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                        Log in
                    </Button>
                </Form.Item>
            </Form> 
        </div>
    )
} 