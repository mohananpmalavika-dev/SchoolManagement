'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface SystemMetrics {
  uptime: number;
  apiResponseTime: number;
  databaseResponseTime: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
  uptime: number;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'CRITICAL';
  message: string;
  service: string;
  count: number;
}

interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  duration: number;
  type: 'FULL' | 'INCREMENTAL';
}

export default function SystemPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSystemData();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSystemData = async () => {
    try {
      if (loading) setLoading(true);
      const token = localStorage.getItem('adminToken');

      const [metricsRes, servicesRes, errorsRes, backupsRes] = await Promise.all([
        fetch('http://localhost:3001/api/admin/system/metrics', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/system/services', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/system/errors?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/admin/system/backups?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!metricsRes.ok || !servicesRes.ok || !errorsRes.ok || !backupsRes.ok) {
        throw new Error('Failed to fetch system data');
      }

      const [metricsData, servicesData, errorsData, backupsData] = await Promise.all([
        metricsRes.json(),
        servicesRes.json(),
        errorsRes.json(),
        backupsRes.json(),
      ]);

      setMetrics(metricsData);
      setServices(servicesData);
      setErrors(errorsData);
      setBackups(backupsData);
    } catch (err) {
      setError('Failed to load system data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelBadgeVariant = (level: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (level) {
      case 'CRITICAL': return 'danger';
      case 'ERROR': return 'danger';
      case 'WARN': return 'warning';
      default: return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0) return `${days}d ${remainingHours}h`;
    return `${remainingHours}h`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getHealthPercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  const handleRunBackup = async () => {
    if (!confirm('Are you sure you want to start a manual backup? This may take several minutes.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/system/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to start backup');

      alert('Backup started successfully');
      fetchSystemData();
    } catch (err) {
      alert('Failed to start backup');
      console.error(err);
    }
  };

  const handleRestartService = async (serviceName: string) => {
    if (!confirm(`Are you sure you want to restart the ${serviceName} service?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/system/services/${serviceName}/restart`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to restart service');

      alert('Service restart initiated');
      fetchSystemData();
    } catch (err) {
      alert('Failed to restart service');
      console.error(err);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const overallHealth = services.every(s => s.status === 'healthy') ? 'healthy' :
    services.some(s => s.status === 'down') ? 'critical' : 'warning';

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p className="text-gray-600 mt-1">Real-time system health and performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <Button size="sm" variant="outline" onClick={fetchSystemData}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Overall Health Alert */}
        <Alert
          variant={overallHealth === 'healthy' ? 'success' : overallHealth === 'critical' ? 'danger' : 'warning'}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <strong>System Status: {overallHealth.toUpperCase()}</strong>
              <p className="text-sm mt-1">
                {overallHealth === 'healthy' && 'All systems operational'}
                {overallHealth === 'warning' && 'Some services degraded - monitoring in progress'}
                {overallHealth === 'critical' && 'Critical issues detected - immediate attention required'}
              </p>
            </div>
            <span className={`text-4xl ${overallHealth === 'healthy' ? '' : 'animate-pulse'}`}>
              {overallHealth === 'healthy' ? '✓' : '⚠️'}
            </span>
          </div>
        </Alert>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {/* System Metrics */}
        {metrics && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Uptime</div>
                <div className="text-2xl font-bold text-green-600">{metrics.uptime}%</div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">API Response</div>
                <div className={`text-2xl font-bold ${metrics.apiResponseTime > 500 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.apiResponseTime}ms
                </div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">DB Response</div>
                <div className={`text-2xl font-bold ${metrics.databaseResponseTime > 100 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {metrics.databaseResponseTime}ms
                </div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Active Conns</div>
                <div className="text-2xl font-bold text-blue-600">{metrics.activeConnections}</div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Req/Min</div>
                <div className="text-2xl font-bold text-purple-600">{metrics.requestsPerMinute}</div>
              </Card>

              <Card className="text-center">
                <div className="text-sm text-gray-600 mb-1">Error Rate</div>
                <div className={`text-2xl font-bold ${metrics.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.errorRate}%
                </div>
              </Card>
            </div>

            {/* Resource Usage */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resource Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                  <span className={`text-lg font-bold ${metrics.cpuUsage > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                    {metrics.cpuUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${metrics.cpuUsage > 80 ? 'bg-red-600' : 'bg-blue-600'}`}
                    style={{ width: `${metrics.cpuUsage}%` }}
                  ></div>
                </div>
              </Card>

              <Card>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                  <span className={`text-lg font-bold ${metrics.memoryUsage > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                    {metrics.memoryUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${metrics.memoryUsage > 80 ? 'bg-red-600' : 'bg-green-600'}`}
                    style={{ width: `${metrics.memoryUsage}%` }}
                  ></div>
                </div>
              </Card>

              <Card>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                  <span className={`text-lg font-bold ${metrics.diskUsage > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                    {metrics.diskUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${metrics.diskUsage > 80 ? 'bg-red-600' : 'bg-purple-600'}`}
                    style={{ width: `${metrics.diskUsage}%` }}
                  ></div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Services Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Service Health</h2>
              <Button size="sm" variant="outline" onClick={fetchSystemData}>
                Check All
              </Button>
            </div>

            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${service.status === 'healthy' ? 'bg-green-500' : service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                    <div>
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-xs text-gray-500">
                        {service.responseTime}ms • Uptime: {service.uptime}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                    {service.status !== 'healthy' && (
                      <button
                        onClick={() => handleRestartService(service.name)}
                        className="text-xs text-blue-600 hover:text-blue-900"
                      >
                        Restart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Errors */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Errors</h2>
              <Badge variant="danger">{errors.length}</Badge>
            </div>

            <div className="space-y-2">
              {errors.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No errors in the last 24 hours</p>
              ) : (
                errors.map((error) => (
                  <div
                    key={error.id}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant={getLevelBadgeVariant(error.level)}>
                        {error.level}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(error.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">{error.service}</div>
                    <div className="text-xs text-gray-700 mt-1">{error.message}</div>
                    {error.count > 1 && (
                      <div className="text-xs text-red-600 mt-1">
                        Occurred {error.count} times
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Backups */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Backup History</h2>
            <Button size="sm" variant="primary" onClick={handleRunBackup}>
              Run Manual Backup
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatTimestamp(backup.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{backup.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatBytes(backup.size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDuration(backup.duration)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={backup.status === 'SUCCESS' ? 'success' : backup.status === 'FAILED' ? 'danger' : 'warning'}>
                        {backup.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {backup.status === 'SUCCESS' && (
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 text-sm">
                            Download
                          </button>
                          <button className="text-green-600 hover:text-green-900 text-sm">
                            Restore
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
