import React, { useState, useEffect } from 'react';
import { Timeline, Card, Alert, Progress, Tooltip, Button, Modal, Select, Space, Table, Tag } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, CarOutlined, UserOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { calculateDistance } from '../utils/distanceUtils';
import { convertTo12Hour } from '../utils/dateUtils';

const GroupManagement = ({ group, onEdit, onAssignDriver, onUpdateStatus, drivers = [] }) => {
  const [metrics, setMetrics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (group) {
      setMetrics(group.metrics);
      generateTimeline();
    }
  }, [group]);

  const generateTimeline = () => {
    if (!group?.route?.waypoints) return;

    const events = group.route.waypoints.map(waypoint => ({
      time: waypoint.estimatedArrival || new Date(),
      type: waypoint.type,
      location: waypoint.location,
      ride: group.rides.find(r => r._id === waypoint.rideId)
    }));

    setTimeline(events.sort((a, b) => a.time - b.time));
  };

  const handleDriverAssign = async () => {
    try {
      setLoading(true);
      setError(null);
      await onAssignDriver(group._id, selectedDriver);
      setEditModalVisible(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      setError(null);
      await onUpdateStatus(group._id, newStatus);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: 'gold',
    confirmed: 'green',
    completed: 'blue',
    cancelled: 'red'
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      render: (text, ride) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: 'Pickup',
      dataIndex: 'pickupLocation',
      key: 'pickup',
      render: (text) => (
        <Tooltip title={text}>
          <div className="max-w-xs truncate">{text}</div>
        </Tooltip>
      )
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      render: (time) => convertTo12Hour(time)
    },
    {
      title: 'Distance',
      key: 'distance',
      render: (_, ride) => (
        ride.metrics?.distance?.text || 'N/A'
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Status and Actions */}
      <Card className="shadow-lg">
        <div className="flex justify-between items-center">
          <Space>
            <Tag color={statusColors[group?.status || 'pending']} className="px-3 py-1">
              {group?.status?.toUpperCase() || 'PENDING'}
            </Tag>
            {group?.driverId && (
              <Tag icon={<CarOutlined />} color="blue">
                {group.driverId.name}
              </Tag>
            )}
          </Space>
          <Space>
            {!group?.driverId && group?.status === 'pending' && (
              <Button
                type="primary"
                icon={<CarOutlined />}
                onClick={() => setEditModalVisible(true)}
              >
                Assign Driver
              </Button>
            )}
            <Button
              icon={<EditOutlined />}
              onClick={() => onEdit(group._id)}
            >
              Edit Group
            </Button>
          </Space>
        </div>
      </Card>

      {/* Metrics */}
      {metrics && (
        <Card title="Group Metrics" className="shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Tooltip title="Total route distance">
                <div className="flex items-center space-x-2">
                  <EnvironmentOutlined />
                  <span>{metrics.totalDistance.text}</span>
                </div>
              </Tooltip>
            </div>
            <div>
              <Tooltip title="Total duration">
                <div className="flex items-center space-x-2">
                  <ClockCircleOutlined />
                  <span>{metrics.totalDuration.text}</span>
                </div>
              </Tooltip>
            </div>
            <div>
              <Tooltip title="Route efficiency">
                <div className="flex items-center space-x-2">
                  <CarOutlined />
                  <span>{metrics.efficiency.text}</span>
                </div>
              </Tooltip>
            </div>
            <div>
              <Progress
                percent={Number(metrics.efficiency.text.replace('%', ''))}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Rides Table */}
      <Card title="Grouped Rides" className="shadow-lg">
        <Table
          dataSource={group?.rides || []}
          columns={columns}
          rowKey="_id"
          pagination={false}
        />
      </Card>

      {/* Route Timeline */}
      <Card title="Route Timeline" className="shadow-lg">
        <Timeline mode="left">
          {timeline.map((event, index) => (
            <Timeline.Item
              key={index}
              color={event.type === 'pickup' ? 'green' : 'red'}
              label={event.time.toLocaleTimeString()}
            >
              <div className="space-y-1">
                <div className="font-medium">
                  {event.type === 'pickup' ? 'Pick up' : 'Drop off'}
                </div>
                <div>{event.ride?.name}</div>
                <div className="text-gray-500 text-sm">{event.location}</div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      {/* Driver Assignment Modal */}
      <Modal
        title="Assign Driver"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleDriverAssign}
            disabled={!selectedDriver}
          >
            Assign Driver
          </Button>
        ]}
      >
        <div className="space-y-4">
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
            />
          )}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Driver
            </label>
            <Select
              className="w-full"
              placeholder="Select a driver"
              onChange={setSelectedDriver}
              value={selectedDriver}
            >
              {drivers
                .filter(driver => driver.isAvailable)
                .map(driver => (
                  <Select.Option key={driver._id} value={driver._id}>
                    {driver.name} - {driver.vehicle?.make} {driver.vehicle?.model}
                  </Select.Option>
                ))}
            </Select>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .ant-timeline-item-label {
          width: 120px !important;
        }
      `}</style>
    </div>
  );
};

export default GroupManagement; 