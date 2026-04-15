import React from 'react';
import { Button, Form, Input, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { brandColors } from '../../theme';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const handleLogin = () => {
    message.success('登录成功');
    navigate('/leads/list');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: `linear-gradient(135deg, ${brandColors.navy} 0%, #2d2d4a 50%, ${brandColors.navy} 100%)` }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 56, fontWeight: 300, letterSpacing: 12, color: brandColors.gold, marginBottom: 16 }}>LINCOLN</div>
          <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: 8, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>林 肯 大 师</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: 4 }}>Customer Relationship Management</div>
          <div style={{ width: 60, height: 2, background: brandColors.gold, margin: '24px auto 0' }} />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 380, padding: 40, background: 'rgba(255,255,255,0.95)', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 8, color: brandColors.navy, fontSize: 22 }}>经销商管理平台</h2>
          <p style={{ textAlign: 'center', marginBottom: 32, color: '#999', fontSize: 13 }}>Lincoln Master Dealer Portal</p>
          <Form onFinish={handleLogin} size="large">
            <Form.Item name="username" initialValue="zhangwei">
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item name="password" initialValue="demo123">
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block style={{ height: 44, background: brandColors.gold, borderColor: brandColors.gold, fontWeight: 500, letterSpacing: 4 }}>
                登 录
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', color: '#ccc', fontSize: 12 }}>演示环境 · 任意账号密码均可登录</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
