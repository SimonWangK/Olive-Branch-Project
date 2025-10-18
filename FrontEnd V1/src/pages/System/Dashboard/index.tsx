import React, { useState, useEffect } from "react";
import { PageContainer } from "@ant-design/pro-components";
import { Row, Col, Card, Statistic, List, Avatar, Tag, Space, Button, Progress } from "antd";
import { PlusOutlined, TeamOutlined, CalendarOutlined, FileTextOutlined, LockOutlined } from "@ant-design/icons";

// Mock data for Olive Branch
const mockStats = {
  totalCases: 15,
  totalTasks: 92,
  totalCreditors: 60,
  complianceRate: 78,
};

const mockActiveCases = [
  { id: 'CASE001', name: 'Bankruptcy Case A', type: 'Bankruptcy', jurisdiction: 'US', tasksCompleted: 10, totalTasks: 12, progress: 83 },
  { id: 'CASE002', name: 'Liquidation Case B', type: 'Liquidation', jurisdiction: 'UK', tasksCompleted: 8, totalTasks: 15, progress: 53 },
  { id: 'CASE003', name: 'Restructuring Case C', type: 'Restructuring', jurisdiction: 'EU', tasksCompleted: 5, totalTasks: 10, progress: 50 },
];

const mockRecentTasks = [
  { id: 'TASK001', assignee: 'John Doe', assigneeAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', case: 'Bankruptcy Case A', dueDate: 'Today 09:00', status: 'confirmed' },
  { id: 'TASK002', assignee: 'Jane Smith', assigneeAvatar: 'https://images.unsplash.com/photo-1494790108755-2616c9da07b7?w=40&h=40&fit=crop&crop=face', case: 'Liquidation Case B', dueDate: 'Today 11:00', status: 'pending' },
  { id: 'TASK003', assignee: 'Mike Wilson', assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face', case: 'Restructuring Case C', dueDate: 'Today 14:00', status: 'confirmed' },
];

const mockCaseTypes = [
  { name: 'Bankruptcy', value: 40, color: '#1890ff' },
  { name: 'Liquidation', value: 35, color: '#52c41a' },
  { name: 'Restructuring', value: 25, color: '#faad14' },
];

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Completed';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  return (
    <PageContainer
      title=" "
      subTitle="Streamline insolvency and compliance workflows"
      extra={[
        <Button key="add" type="primary" icon={<PlusOutlined />}>New Case</Button>,
      ]}
    >
      {/* Key Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Total Cases"
              value={mockStats.totalCases}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Total Tasks"
              value={mockStats.totalTasks}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Total Creditors"
              value={mockStats.totalCreditors}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Compliance Rate"
              value={mockStats.complianceRate}
              suffix="%"
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Active Cases */}
        <Col xs={24} lg={12}>
          <Card title="Active Cases" loading={loading} style={{ height: 400 }}>
            <List
              dataSource={mockActiveCases}
              itemLayout="horizontal"
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<FileTextOutlined />} size={50} />}
                    title={`${item.name} (${item.jurisdiction})`}
                    description={
                      <Space size={16}>
                        <span>Type: {item.type}</span>
                        <span>Tasks: {item.tasksCompleted}/{item.totalTasks}</span>
                        <span>Progress: {item.progress}%</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recent Tasks */}
        <Col xs={24} lg={12}>
          <Card title="Recent Tasks" loading={loading} style={{ height: 400 }}>
            <List
              dataSource={mockRecentTasks}
              itemLayout="horizontal"
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={item.assigneeAvatar} size={40} />}
                    title={
                      <Space>
                        {item.assignee}
                        <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                      </Space>
                    }
                    description={`${item.case} - Due: ${item.dueDate}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Case Type Distribution */}
        {/* <Col xs={24} lg={12}>
          <Card title="Case Type Distribution" loading={loading}>
            {mockCaseTypes.map((type) => (
              <div key={type.name} style={{ marginBottom: 16 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{type.name}</span>
                  <span>{type.value}%</span>
                </Space>
                <Progress percent={type.value} strokeColor={type.color} showInfo={false} strokeWidth={8} />
              </div>
            ))}
          </Card>
        </Col> */}
      </Row>
    </PageContainer>
  );
};

export default DashboardPage;