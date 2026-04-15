import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { lincolnTheme } from './theme';
import AppRoutes from './routes';

const App: React.FC = () => (
  <ConfigProvider theme={lincolnTheme} locale={zhCN}>
    <AppRoutes />
  </ConfigProvider>
);

export default App;
