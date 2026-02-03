'use client';
import { useState } from 'react';
import { Form, Input, Button, Modal } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Cookies  from 'js-cookie';
import CustomAlert from '@/components/alert';
export default function LoginPage() {

    const [message, setMessage] = useState<string | null>(null);
    const [ismodalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const showModal = () => {
        setIsModalOpen(true);
    }

    const showModalClose = () => {
        
        setIsModalOpen(false);
    }


    const onFinish = async (values: any) => {
        const params = { ...values, action: 'login' };

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params),
        });

        if (res.ok) {
            const data = await res.json();
            Cookies.set('token', data.token);
            localStorage.setItem('token', data.token);
            router.replace('/home');

            setTimeout(() => {
                router.refresh();
            }, 100);
        } else {
            setMessage('아이디와 비밀번호를 확인하세요.');
        }
    };

    const onNewidFinish = async (values: any) => {
        console.log('values', values)
        const params = {...values, action: 'newid'};
        if(values.newid_password !== values.newid_password_confirm) {
            setMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            return;
        }

        const res = await fetch('/api/newid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params),
        });

        if(res.ok) {
            setMessage('회원가입이 완료되었습니다. 로그인 해주세요.');
        } else {
            setMessage('회원가입에 실패하였습니다. 다시 시도해주세요.');
        }
    }


    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
        }}>
            <CustomAlert
                message={message || ''}
                type="error"
                onClose={() => setMessage(null)}
            />
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
                <Button type="link" onClick={showModal}>회원가입</Button>
            </Form> 
            <Modal title="Login Info" open={ismodalOpen} onOk={onNewidFinish} onCancel={showModalClose}>
                <Form
                    name="newid_form"
                    onFinish={onNewidFinish}
                >
                    <Form.Item
                        name="newid_usercode"
                        rules={[{ required: true, message: '아이디는 필수입력 값 입니다.' }]}
                    >
                        <Input placeholder="ID" />
                    </Form.Item>
                    <Form.Item
                        name="newid_username"
                        rules={[{ required: true, message: '이름은 필수입력 값 입니다.' }]}
                    >
                        <Input placeholder="이름" />
                    </Form.Item>
                    <Form.Item
                        name="newid_password"
                        rules={[{ required: true, message: '비밀번호는 필수입력 값 입니다.' }]}
                    >
                        <Input placeholder="PassWord" />
                    </Form.Item>
                    <Form.Item
                        name="newid_password_confirm"
                        rules={[{ required: true, message: '비밀번호 확인은 필수입력 값 입니다.' }]}
                    >
                        <Input placeholder="PassWord Confirm" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
} 