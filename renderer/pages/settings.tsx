import React from 'react';
import Layout from '../components/Layout';
import Settings from '../components/Settings';

const SettingsPage: React.FC = () => {
  return (
    <Layout title="設定">
      <div className="container mx-auto px-4 py-6">
        <Settings />
      </div>
    </Layout>
  );
};

export default SettingsPage;