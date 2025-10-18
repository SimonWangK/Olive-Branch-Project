import React, { useEffect, useState } from 'react';
import { useParams } from 'umi';
import { Card, Descriptions, message } from 'antd';

// Mock data for the case detail (you can replace this with real API later)
const mockCaseDetail = {
  case_num: 'CA123456',
  case_type: 'Legal',
  jurisdiction: 'California',
  description: 'This is a sample case description.',
  status: 'Open',
  opened_at: '2023-10-01',
  target_close: '2024-10-01',
  updated_at: '2023-10-10',
};

interface CaseDetail {
  case_num: string;
  case_type: string;
  jurisdiction: string;
  description: string;
  status: string;
  opened_at: string;
  target_close: string;
  updated_at: string;
}

const CaseDetail: React.FC = () => {
  const { case_num } = useParams<{ case_num: string }>(); // Fetch case_num from the URL
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);

  useEffect(() => {
    // Simulate fetching case details
    const fetchCaseDetail = async () => {
      try {
        // Simulate a delay like an API request
        setTimeout(() => {
          setCaseDetail(mockCaseDetail); // Set mock data
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch case detail:', error);
        message.error('Failed to fetch case detail.');
      }
    };
    fetchCaseDetail();
  }, [case_num]);

  return (
    <Card title="Case Details">
      {caseDetail ? (
        <Descriptions bordered>
          <Descriptions.Item label="Case Number">{caseDetail.case_num}</Descriptions.Item>
          <Descriptions.Item label="Case Type">{caseDetail.case_type}</Descriptions.Item>
          <Descriptions.Item label="Jurisdiction">{caseDetail.jurisdiction}</Descriptions.Item>
          <Descriptions.Item label="Description">{caseDetail.description}</Descriptions.Item>
          <Descriptions.Item label="Status">{caseDetail.status}</Descriptions.Item>
          <Descriptions.Item label="Opened At">{caseDetail.opened_at}</Descriptions.Item>
          <Descriptions.Item label="Target Close">{caseDetail.target_close}</Descriptions.Item>
          <Descriptions.Item label="Updated At">{caseDetail.updated_at}</Descriptions.Item>
        </Descriptions>
      ) : (
        <p>Loading...</p>
      )}
    </Card>
  );
};

export default CaseDetail;
