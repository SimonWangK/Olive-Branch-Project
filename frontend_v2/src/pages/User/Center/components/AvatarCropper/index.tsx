// src/components/AvatarCropperForm.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Row, Col, Button, Space, Upload, message } from 'antd';
import { useIntl } from '@umijs/max';
import { Cropper } from 'react-cropper';
import './cropper.css';
import styles from './index.less';
import {
  MinusOutlined,
  PlusOutlined,
  RedoOutlined,
  UndoOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { storage, db, auth } from '@/utils/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export type AvatarCropperProps = {
  onFinished: (isSuccess: boolean) => void;
  open: boolean;
  data: any; 
};

const AvatarCropperForm: React.FC<AvatarCropperProps> = (props) => {
  const cropperRef = useRef<HTMLImageElement>(null);
  const [imageData, setImageData] = useState<any>();
  const [previewData, setPreviewData] = useState();

  useEffect(() => {
    setImageData(props.data.avatar); 
  }, [props]);

  const intl = useIntl();

  const handleOk = async () => {
    const imageElement: any = cropperRef?.current;
    const cropper: any = imageElement?.cropper;



    cropper.getCroppedCanvas().toBlob(async (blob: Blob) => {
      try {
      
        const fileName = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
        const storageRef = ref(storage, fileName);


        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);


        const userDocRef = doc(db, 'users');
        await updateDoc(userDocRef, {
          avatar: downloadURL,
          updatedAt: new Date(),
        });

        message.success('upload success!');
        props.onFinished(true);
      } catch (error) {
        message.error('upload failed!');
        console.error('upload error:', error);
        props.onFinished(false);
      }
    }, 'image/png');
  };

  const handleCancel = () => {
    props.onFinished(false);
  };

  const onCrop = () => {
    const imageElement: any = cropperRef?.current;
    const cropper: any = imageElement?.cropper;
    setPreviewData(cropper.getCroppedCanvas().toDataURL());
  };

  const onRotateRight = () => {
    const imageElement: any = cropperRef?.current;
    const cropper: any = imageElement?.cropper;
    cropper.rotate(90);
  };

  const onRotateLeft = () => {
    const imageElement: any = cropperRef?.current;
    const cropper: any = imageElement?.cropper;
    cropper.rotate(-90);
  };

  const onZoomIn = () => {
    const imageElement: any = cropperRef?.current;
    const cropper: any = imageElement?.cropper;
    cropper.zoom(0.1);
  };

  const onZoomOut = () => {
    const imageElement: any = cropperRef?.current;
    const cropper: any = imageElement?.cropper;
    cropper.zoom(-0.1);
  };

  const beforeUpload = (file: any) => {

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('No more  5MB！');
      return false;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageData(reader.result);
    };
    return false; //
  };

  return (
    <Modal
      width={800}
      title={"Edit Image"}
      open={props.open}
      destroyOnClose
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Row gutter={[16, 16]}>
        <Col span={12} order={1}>
          <Cropper
            ref={cropperRef}
            src={imageData}
            style={{ height: 350, width: '100%', marginBottom: '16px' }}
            initialAspectRatio={1}
            guides={false}
            crop={onCrop}
            zoomable={true}
            zoomOnWheel={true}
            rotatable={true}
          />
        </Col>
        <Col span={12} order={2}>
          <div className={styles.avatarPreview}>
            <img src={previewData} style={{ height: '100%', width: '100%' }} />
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Upload beforeUpload={beforeUpload} maxCount={1}>
            <Button>
              <UploadOutlined />
              Upload
            </Button>
          </Upload>
        </Col>
        <Col>
          <Space>
            <Button icon={<RedoOutlined />} onClick={onRotateRight} />
            <Button icon={<UndoOutlined />} onClick={onRotateLeft} />
            <Button icon={<PlusOutlined />} onClick={onZoomIn} />
            <Button icon={<MinusOutlined />} onClick={onZoomOut} />
          </Space>
        </Col>
      </Row>
    </Modal>
  );
};

export default AvatarCropperForm;