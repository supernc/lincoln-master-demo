import React, { useState, useEffect, useRef } from 'react';
import { RobotOutlined, BulbOutlined, StarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Tag, Space, Progress } from 'antd';
import { brandColors } from '../theme';

interface Props {
  trigger: boolean;
  content: string;
  onComplete?: (text: string) => void;
  showActions?: boolean;
  showScore?: boolean;
}

const nextStepSuggestions = [
  '安排本周末到店试驾体验，提前预留试驾车辆',
  '发送个性化金融分期方案对比表',
  '安排客户参加周末新车品鉴会活动',
  '推送当前限时优惠政策详情',
  '邀请客户关注林肯公众号获取更多信息',
];

const AIAssistant: React.FC<Props> = ({ trigger, content, onComplete, showActions = false, showScore = false }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const indexRef = useRef(0);
  const qualityScore = Math.floor(Math.random() * 15) + 82;

  useEffect(() => {
    if (!trigger) return;
    setDisplayText('');
    setIsTyping(true);
    setShowExtras(false);
    indexRef.current = 0;

    const timer = setInterval(() => {
      indexRef.current += 2;
      if (indexRef.current <= content.length) {
        setDisplayText(content.slice(0, indexRef.current));
      } else {
        setDisplayText(content);
        clearInterval(timer);
        setIsTyping(false);
        setShowExtras(true);
        onComplete?.(content);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [trigger, content]);

  if (!displayText && !isTyping) return null;

  return (
    <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #f6f0e4, #faf7f0)', borderRadius: 8, border: '1px solid #e8d5b0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <RobotOutlined style={{ color: brandColors.gold, fontSize: 16 }} />
        <span style={{ color: brandColors.gold, fontWeight: 600, fontSize: 13 }}>AI 智能跟进摘要</span>
        {isTyping && <span style={{ color: brandColors.gold, fontSize: 12, animation: 'blink 1s infinite' }}>●</span>}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.8, color: '#444', whiteSpace: 'pre-line' }}>
        {displayText}
        {isTyping && <span style={{ borderRight: `2px solid ${brandColors.gold}`, animation: 'blink 0.8s infinite', marginLeft: 1 }}>&nbsp;</span>}
      </div>

      {showExtras && !isTyping && (
        <>
          {showScore && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <StarOutlined style={{ color: brandColors.gold }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>跟进质量评分</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Progress
                  percent={qualityScore}
                  size="small"
                  strokeColor={qualityScore >= 90 ? '#52c41a' : qualityScore >= 80 ? brandColors.gold : '#faad14'}
                  style={{ flex: 1 }}
                />
                <Tag color={qualityScore >= 90 ? 'green' : qualityScore >= 80 ? 'gold' : 'orange'}>
                  {qualityScore >= 90 ? '优秀' : qualityScore >= 80 ? '良好' : '待改进'}
                </Tag>
              </div>
            </div>
          )}

          {showActions && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <BulbOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>AI 建议下一步行动</span>
              </div>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {nextStepSuggestions.slice(0, 3).map((suggestion, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
                    fontSize: 12, color: '#555',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ArrowRightOutlined style={{ color: brandColors.gold, fontSize: 10 }} />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </Space>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`}</style>
    </div>
  );
};

export default AIAssistant;
