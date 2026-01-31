import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/analytics/audit-logs');
        setLogs(response.data);
      } catch (error) {
        console.error('Failed to fetch audit logs', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) return <div>Loading logs...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Audit Logs</h2>
      <div className="border rounded-md">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>IP Address</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map(log => (
                    <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.timestamp), 'PPpp')}</TableCell>
                        <TableCell>{log.user?.name || log.userId}</TableCell>
                        <TableCell>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {log.actionType}
                            </span>
                        </TableCell>
                        <TableCell>{log.document?.title || '-'}</TableCell>
                        <TableCell>{log.ipAddress || '-'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );
};
