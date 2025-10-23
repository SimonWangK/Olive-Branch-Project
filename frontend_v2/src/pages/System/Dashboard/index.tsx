import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Row, Col, Card, Statistic, List, Avatar, Tag, Space, Progress, message } from 'antd';
import { FileTextOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import { getDashboardStats } from '@/services/system/case';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalCases: number;
  totalTasks: number;
  totalCreditors: number;
  complianceRate: number;
  caseTypeDistribution: { name: string; value: number; color: string }[];
  activeCases: {
    id: string;
    name: string;
    type: string;
    jurisdiction: string;
    tasksCompleted: number;
    totalTasks: number;
    progress: number;
  }[];
  recentTasks: {
    id: string;
    assignee: string;
    assigneeAvatar: string;
    case: string;
    dueDate: string;
    status: string;
  }[];
}

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true); // Start with loading true
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await getDashboardStats();
        console.log('API Response:', JSON.stringify(response, null, 2)); // Detailed debug
        if (response && response.data && response.data) {
          setStats(response.data);
        } else {
          console.error('Unexpected response structure:', response);
          message.error('Failed to load dashboard data: Invalid response structure');
          setStats({
            totalCases: 0,
            totalTasks: 0,
            totalCreditors: 0,
            complianceRate: 0,
            caseTypeDistribution: [],
            activeCases: [],
            recentTasks: [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        message.error('Failed to load dashboard data');
        setStats({
          totalCases: 0,
          totalTasks: 0,
          totalCreditors: 0,
          complianceRate: 0,
          caseTypeDistribution: [],
          activeCases: [],
          recentTasks: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };


  const handleTotalCasesClick = () => {
    navigate('/system/case');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  // Render loading state if stats is null
  if (!stats) {
    return (
      <PageContainer
        title=" "
        subTitle="Streamline insolvency and compliance workflows"
        loading={loading}
      />
    );
  }

  return (
    <PageContainer title=" " subTitle="Streamline insolvency and compliance workflows">
      {/* Key Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable onClick={handleTotalCasesClick}>
            <Statistic
              title="Total Cases"
              value={stats.totalCases ?? 0}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Total Tasks"
              value={stats.totalTasks ?? 0}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Total Creditors"
              value={stats.totalCreditors ?? 0}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} hoverable>
            <Statistic
              title="Compliance Rate"
              value={stats.complianceRate ?? 0}
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
              dataSource={stats.activeCases || []}
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
              dataSource={stats.recentTasks || []}
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
        <Col xs={24} lg={12}>
          <Card title="Case Type Distribution" loading={loading}>
            {(stats.caseTypeDistribution || []).map((type) => (
              <div key={type.name} style={{ marginBottom: 16 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{type.name}</span>
                  <span>{type.value}%</span>
                </Space>
                <Progress percent={type.value} strokeColor={type.color} showInfo={false} strokeWidth={8} />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default DashboardPage;