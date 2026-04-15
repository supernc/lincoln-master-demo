import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Avatar, Space, Tag, Tooltip, Popover, message } from 'antd';
import { CloseOutlined, SendOutlined, SmileOutlined, PaperClipOutlined, UserOutlined, FileImageOutlined, IdcardOutlined, ShoppingOutlined, PhoneOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { ChatMessage } from '../types';
import { brandColors } from '../theme';

interface Props {
  customerName: string;
  messages: ChatMessage[];
  onClose: () => void;
  onQuickArchive?: () => void;
  leadId?: string;
}

const materialCards = [
  { title: '林肯冒险家 2025款', subtitle: '2.0T 尊雅版 起售价24.58万', type: 'car' },
  { title: '限时优惠活动', subtitle: '综合优惠最高3万元+36期0利率', type: 'promo' },
  { title: '林肯之道体验', subtitle: '专属到店礼遇·精品茶歇·一对一服务', type: 'service' },
  { title: '试驾邀约', subtitle: '预约试驾体验，感受林肯豪华驾乘', type: 'test' },
];

const WechatChat: React.FC<Props> = ({ customerName, messages, onClose, onQuickArchive }) => {
  const [chatList, setChatList] = useState<ChatMessage[]>(messages);
  const [inputValue, setInputValue] = useState('');
  const [showMaterial, setShowMaterial] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatList]);

  const addMessage = (msg: ChatMessage) => {
    setChatList(prev => [...prev, msg]);
    setTimeout(() => {
      const replies = ['好的，我了解了', '谢谢，我考虑一下', '可以的，到时见', '价格方面还能再优惠吗？', '这个配置不错，我周末过来看看', '我的手机号是13812345678'];
      setChatList(prev => [...prev, {
        id: (Date.now() + 1).toString(), sender: 'customer',
        content: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), type: 'text',
      }]);
    }, 1200);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    addMessage({ id: Date.now().toString(), sender: 'advisor', content: inputValue, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), type: 'text' });
    setInputValue('');
  };

  const sendCard = (card: typeof materialCards[0]) => {
    addMessage({ id: Date.now().toString(), sender: 'advisor', content: '', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), type: 'card', cardData: { title: card.title, subtitle: card.subtitle } });
    setShowMaterial(false);
    message.success('素材已发送');
  };

  const sendNameCard = () => {
    addMessage({ id: Date.now().toString(), sender: 'advisor', content: '', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), type: 'card', cardData: { title: '张伟 | 首席销售顾问', subtitle: '林肯中心（上海浦东店）\n📞 138-1234-5678' } });
    message.success('名片已发送');
  };

  const highlightText = (text: string) => {
    const phoneRegex = /(\d{11})/g;
    const carRegex = /(林肯冒险家|林肯航海家|林肯飞行家|林肯领航员)/g;
    let result = text;
    result = result.replace(phoneRegex, '<span style="color:#1890ff;text-decoration:underline;cursor:pointer">$1</span>');
    result = result.replace(carRegex, '<span style="color:#c9a96e;font-weight:500">$1</span>');
    return result;
  };

  const hasPhoneInChat = chatList.some(m => m.sender === 'customer' && /\d{11}/.test(m.content));

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />
          <span>企微沟通 - {customerName}</span>
        </div>
      }
      extra={<Space><CloseOutlined onClick={onClose} style={{ cursor: 'pointer' }} /></Space>}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: 560 } }}
      style={{ borderColor: '#e8e8e8' }}
    >
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', background: '#f0efe8' }}>
        {chatList.map((msg, idx) => {
          const showTime = idx === 0 || chatList[idx - 1].time !== msg.time;
          return (
            <div key={msg.id}>
              {showTime && <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 11, color: '#999' }}>{msg.time}</div>}
              <div style={{ display: 'flex', flexDirection: msg.sender === 'advisor' ? 'row-reverse' : 'row', marginBottom: 12, gap: 8 }}>
                <Avatar size={36} icon={<UserOutlined />} style={{ background: msg.sender === 'advisor' ? brandColors.gold : '#87ceeb', flexShrink: 0 }} />
                {msg.type === 'card' && msg.cardData ? (
                  <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 6, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.08)', border: '1px solid #e8e8e8' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: brandColors.navy }}>{msg.cardData.title}</div>
                    <div style={{ fontSize: 12, color: '#666', whiteSpace: 'pre-line' }}>{msg.cardData.subtitle}</div>
                    <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8, paddingTop: 6, fontSize: 11, color: brandColors.gold }}>
                      {msg.cardData.title.includes('顾问') ? '📇 个人名片' : '🏷️ 营销素材'}
                    </div>
                  </div>
                ) : msg.type === 'image' ? (
                  <div style={{ maxWidth: '60%', padding: 4, borderRadius: 6, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                    <div style={{ width: 200, height: 120, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      <FileImageOutlined style={{ fontSize: 32 }} />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '70%', padding: '8px 12px', borderRadius: 6,
                    background: msg.sender === 'advisor' ? '#a0e75a' : '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)', fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word',
                  }} dangerouslySetInnerHTML={{ __html: highlightText(msg.content) }} />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {hasPhoneInChat && onQuickArchive && (
        <div style={{ padding: '6px 12px', background: '#f6ffed', borderTop: '1px solid #b7eb8f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#52c41a' }}>💡 检测到客户手机号，可快速建档</span>
          <Button size="small" type="primary" icon={<PlusCircleOutlined />} onClick={onQuickArchive} style={{ background: '#52c41a', borderColor: '#52c41a' }}>快速建档</Button>
        </div>
      )}

      <div style={{ borderTop: '1px solid #e8e8e8', padding: '8px 12px', background: '#f5f5f5' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <SmileOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} />
          <Popover open={showMaterial} onOpenChange={setShowMaterial} trigger="click" placement="topLeft"
            content={
              <div style={{ width: 280 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>📦 素材库</div>
                {materialCards.map((card, i) => (
                  <div key={i} onClick={() => sendCard(card)} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 6, marginBottom: 4, border: '1px solid #f0f0f0', ':hover': { background: '#f6f0e4' } }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{card.subtitle}</div>
                  </div>
                ))}
              </div>
            }>
            <Tooltip title="素材库"><ShoppingOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} /></Tooltip>
          </Popover>
          <Tooltip title="发送图片"><FileImageOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} onClick={() => {
            addMessage({ id: Date.now().toString(), sender: 'advisor', content: '', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), type: 'image', imageUrl: '/mock/car.jpg' });
          }} /></Tooltip>
          <Tooltip title="发送名片"><IdcardOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} onClick={sendNameCard} /></Tooltip>
          <PaperClipOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input.TextArea value={inputValue} onChange={e => setInputValue(e.target.value)}
            onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="输入消息..." autoSize={{ minRows: 2, maxRows: 4 }} style={{ borderRadius: 4 }} />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} style={{ alignSelf: 'flex-end', background: brandColors.gold, borderColor: brandColors.gold }}>发送</Button>
        </div>
      </div>
    </Card>
  );
};

export default WechatChat;
