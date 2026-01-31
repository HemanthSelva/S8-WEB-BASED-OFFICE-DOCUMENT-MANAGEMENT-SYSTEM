import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowInstance } from '@/types';
import { Check, X, Clock } from 'lucide-react';

export const WorkflowsPage = () => {
  const [pendingWorkflows, setPendingWorkflows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = async () => {
    try {
      const response = await api.get('/workflows/pending');
      setPendingWorkflows(response.data);
    } catch (error) {
      console.error('Failed to fetch workflows', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleAction = async (instanceId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post(`/workflows/action/${instanceId}`, {
        action,
        comment: `${action} via Dashboard`
      });
      fetchWorkflows(); // Refresh list
    } catch (error) {
      console.error('Action failed', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Workflow Approvals</h1>
      
      {loading ? (
        <p>Loading workflows...</p>
      ) : (
        <div className="grid gap-4">
          {pendingWorkflows.length === 0 && <p className="text-gray-500">No pending approvals.</p>}
          
          {pendingWorkflows.map((wf) => (
            <Card key={wf.id} className="border-l-4 border-l-yellow-400">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="font-semibold text-yellow-700">Pending Approval</span>
                  </div>
                  <h3 className="text-lg font-bold">{wf.document.title}</h3>
                  <p className="text-sm text-gray-500">Step {wf.currentStep}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={() => handleAction(wf.id, 'APPROVE')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleAction(wf.id, 'REJECT')}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
