import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getCaseDetail, 
} from '@/services/system/case';

import { 
  getDocuments, 
  uploadDocument, 
  approveDocumentVersion,
  downloadFile 
} from "@/services/system/documents";
import { 
  Card, Descriptions, Progress, List, Tag, Row, Col, Statistic, 
  Divider, Upload, Button, Modal, message, Spin, Space, Table, Image 
} from 'antd';
import { 
  FileTextOutlined, FolderOpenOutlined, ClockCircleOutlined, 
  DollarOutlined, CheckCircleOutlined, UploadOutlined, 
  EyeOutlined, CheckOutlined, DownloadOutlined 
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface CaseVersion {
  id: number;
  version_no: number;
  description: string;
  created_at: string;
}

interface CaseDetail {
  case_num: string;
  case_type: string;
  jurisdiction: string;
  description: string;
  status: string;
  opened_at: string;
  target_close: string;
  updated_at: string;
  progress: number;
  compliancePacks: Array<{ id: number; name: string; uploadDate: string; status: string }>;
  caseFiles: Array<{ 
    id: number; 
    name: string; 
    uploadDate: string; 
    size: string;
    versions?: Array<{ url: string }>;
  }>;
  financialStatus: {
    totalBudget: number;
    spent: number;
    pending: number;
    remaining: number;
  };
  versions: CaseVersion[]; // Added versions field
}

interface DocumentVersion {
  id: number;
  version_no: number;
  url: string;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
}

interface Document {
  id: number;
  case_id: number;
  title: string;
  versions: DocumentVersion[];
}

const CaseDetailComponent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');

  // Fetch case details
  useEffect(() => {
    const fetchCaseDetail = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('Case ID is missing');
        const response = await getCaseDetail(Number(id));
        setCaseDetail(response.data);
        setLoading(false);
      } catch (error: any) {
        console.error('Failed to fetch case detail:', error);
        setError(error.response?.data?.message || error.message || 'Failed to load case details');
        setLoading(false);
      }
    };
    fetchCaseDetail();
  }, [id]);

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const response = await getDocuments(Number(id));
      setDocuments(response || []);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      message.error('Failed to load documents');
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocuments();
    }
  }, [id]);

  // Extract fileId from URL format: firestore://files/zXb8nUHQ36xQzXHqNId9
  const extractFileId = (url: string): string | null => {
    console.log('URL being processed:', url); // Debugging log
    if (!url) {
      console.error('URL is undefined or empty');
      return null;
    }
    
    const match = url.match(/firestore:\/\/files\/(.+)$/);
    return match ? match[1] : null;
  };

  // Handle file upload
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a file');
      return;
    }

    if (!documentTitle.trim()) {
      message.warning('Please enter a document title');
      return;
    }

    setUploading(true);

    try {
      const file = fileList[0].originFileObj || fileList[0];
      if (!file) {
        throw new Error('File object is undefined');
      }
      
      await uploadDocument(Number(id), file as File, documentTitle);

      message.success('Document uploaded successfully');
      setUploadModalVisible(false);
      setFileList([]);
      setDocumentTitle('');
      
      const response = await getCaseDetail(Number(id));
      setCaseDetail(response.data);
      fetchDocuments();
    } catch (error: any) {
      console.error('Uploadfailed:', error);
      message.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Handle approve version
  const handleApprove = async (versionId: number) => {
    try {
      await approveDocumentVersion(Number(id), versionId);
      message.success('Version approved successfully');
      fetchDocuments();
      setVersionModalVisible(false);
    } catch (error: any) {
      console.error('Approve failed:', error);
      message.error(error.message || 'Approval failed');
    }
  };

  // Handle download file
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const fileId = extractFileId(url);
      if (!fileId) throw new Error('Invalid file ID');
      
      const response = await downloadFile(Number(id), fileId);

      const downloadUrl = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Download failed:', error);
      message.error('Download failed');
    }
  };

  // View versions modal
  const showVersions = (doc: Document) => {
    setSelectedDocument(doc);
    setVersionModalVisible(true);
  };

  const versionColumns = [
    {
      title: 'Version',
      dataIndex: 'version_no',
      key: 'version_no',
      render: (version_no: number) => `v${version_no}`
    },
    {
      title: 'Uploaded At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: DocumentVersion) => (
        record.approved_at ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>Approved</Tag>
        ) : (
          <Tag color="orange">Pending</Tag>
        )
      )
    },
    {
      title: 'Approved By',
      key: 'approved',
      render: (record: DocumentVersion) => 
        record.approved_at ? `User ${record.approved_by} on ${new Date(record.approved_at).toLocaleString()}` : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: DocumentVersion) => (
        <Space>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.url, selectedDocument?.title || 'document')}
          >
            Download
          </Button>
          {!record.approved_at && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleApprove(record.id)}
            >
              Approve
            </Button>
          )}
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <p style={{ color: 'red' }}>{error || 'Case not found'}</p>
        </Card>
      </div>
    );
  }

  const progressColor = caseDetail.progress < 30 ? '#108ee9' : caseDetail.progress < 70 ? '#108ee9' : '#52c41a';

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Progress Section */}
      <Card style={{ marginBottom: 24, borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#1890ff' }}>Case Progress</h2>
          <p style={{ color: '#8c8c8c', marginTop: 8 }}>Overall completion status of case {caseDetail.case_num}</p>
        </div>
        <Progress
          percent={caseDetail.progress}
          strokeColor={progressColor}
          size="small"
          style={{ fontSize: 18 }}
          strokeWidth={12}
        />
      </Card>

      {/* Case Details */}
      <Card title={<span><CheckCircleOutlined /> Case Details</span>} style={{ marginBottom: 24, borderRadius: 8 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
          <Descriptions.Item label="Case Number">{caseDetail.case_num}</Descriptions.Item>
          <Descriptions.Item label="Case Type">{caseDetail.case_type}</Descriptions.Item>
          <Descriptions.Item label="Jurisdiction">{caseDetail.jurisdiction}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={caseDetail.status === 'ACTIVE' ? 'green' : caseDetail.status === 'ON_HOLD' ? 'orange' : 'default'}>
              {caseDetail.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Opened At">{caseDetail.opened_at}</Descriptions.Item>
          <Descriptions.Item label="Target Close">{caseDetail.target_close || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Updated At" span={2}>{caseDetail.updated_at}</Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>{caseDetail.description || 'No description provided'}</Descriptions.Item>
        </Descriptions>
      </Card>


      {/* Compliance Pack Section */}
      <Card
        title={<span><FileTextOutlined /> Compliance Pack</span>}
        style={{ marginBottom: 24, borderRadius: 8 }}
      >
        <List
          dataSource={caseDetail.compliancePacks}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title={item.name}
                description={`Uploaded: ${item.uploadDate}`}
              />
              <Tag color={item.status === 'done' ? 'green' : item.status === 'overdue' ? 'red' : 'orange'}>
                {item.status.toUpperCase()}
              </Tag>
            </List.Item>
          )}
        />
      </Card>

      {/* Case Files Section with Preview */}
      <Card
        title={<span><FolderOpenOutlined /> Case Files</span>}
        extra={
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Upload Document
          </Button>
        }
        style={{ marginBottom: 24, borderRadius: 8 }}
      >
        <Table
          dataSource={documents}
          rowKey="id"
          columns={[
            {
              title: 'Title',
              dataIndex: 'title',
              key: 'title',
              render: (title: string) => (
                <span>
                  <FolderOpenOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                  {title}
                </span>
              ),
            },
            {
              title: 'Last Url',
              key: 'url',
              render: (record: Document) => {
                const LastUrl = record.versions?.[0];
                return LastUrl ? `${LastUrl.url}` : 'N/A';
              },
            },
            {
              title: 'Latest Version',
              key: 'version_no',
              render: (record: Document) => {
                const latestVersion = record.versions?.[0];
                return latestVersion ? `v${latestVersion.version_no}` : 'N/A';
              },
            },
            {
              title: 'Approval Status',
              key: 'approval_status',
              render: (record: Document) => {
                const latestVersion = record.versions?.[0];
                return latestVersion?.approved_at ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Approved by User {latestVersion.approved_by} on{' '}
                    {new Date(latestVersion.approved_at).toLocaleString()}
                  </Tag>
                ) : (
                  <Tag color="orange">Pending</Tag>
                );
              },
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (record: Document) => {
                const latestVersion = record.versions?.[0];
                const fileUrl = latestVersion?.url;
                return (
                  <Space>
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => showVersions(record)}
                    >
                      View Versions
                    </Button>
                    {fileUrl && (
                      <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(fileUrl, record.title)}
                      >
                        Download
                      </Button>
                    )}
                    {latestVersion && !latestVersion.approved_at && (
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size="small"
                        onClick={() => handleApprove(latestVersion.id)}
                      >
                        Approve
                      </Button>
                    )}
                  </Space>
                );
              },
            },
          ]}
          pagination={false}
        />
      </Card>

      {/* Case History Section */}
      <Card
        title={<span><ClockCircleOutlined /> Case History</span>}
        style={{ marginBottom: 24, borderRadius: 8 }}
      >
        {caseDetail.versions.length > 0 ? (
          <List
            dataSource={caseDetail.versions}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={`Version ${item.version}`}
                  description={
                    <>
                      <p>{item.description}</p>
                      <p>Created:{item.date} by {item.user} </p>

                    </>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <p style={{ color: '#8c8c8c', textAlign: 'center' }}>No case history recently</p>
        )}
      </Card>
      {/* Financial Status Section */}
      <Card
        title={<span><DollarOutlined /> Financial Status</span>}
        style={{ borderRadius: 8 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Budget"
              value={caseDetail.financialStatus.totalBudget}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Spent"
              value={caseDetail.financialStatus.spent}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Pending"
              value={caseDetail.financialStatus.pending}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Remaining"
              value={caseDetail.financialStatus.remaining}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
        <Divider />
        <Progress
          percent={Math.round((caseDetail.financialStatus.spent / caseDetail.financialStatus.totalBudget) * 100)}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#108ee9',
          }}
          status="active"
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Document"
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
          setDocumentTitle('');
        }}
        confirmLoading={uploading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>Document Title:</label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title"
              style={{ width: '100%', padding: '8px', marginTop: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
          </div>
          <Upload
            maxCount={1}
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
          >
            <Button icon={<UploadOutlined />}>Select File</Button>
          </Upload>
        </Space>
      </Modal>

      {/* Version History Modal */}
      <Modal
        title={`Version History: ${selectedDocument?.title}`}
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={selectedDocument?.versions}
          columns={versionColumns}
          rowKey="id"
          pagination subvagination={false}
        />
      </Modal>
    </div>
  );
};

export default CaseDetailComponent;