'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Wallet,
  Receipt
} from 'lucide-react';
import { stripeService, PaymentIntent, PaymentDistribution, ContractorPayout } from '@/lib/stripe-service';

interface PaymentInterfaceProps {
  projectId: string;
  customerId: string;
  contractorId?: string;
  initialAmount?: number;
}

interface MockProject {
  id: string;
  title: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedCost: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export default function PaymentInterface({ 
  projectId, 
  customerId, 
  contractorId, 
  initialAmount = 0 
}: PaymentInterfaceProps) {
  const [activeTab, setActiveTab] = useState('customer-payment');
  const [amount, setAmount] = useState(initialAmount);
  const [currency, setCurrency] = useState('USD');
  const [projectComplexity, setProjectComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [paymentDistribution, setPaymentDistribution] = useState<PaymentDistribution | null>(null);
  const [contractorPayout, setContractorPayout] = useState<ContractorPayout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mock project data
  const mockProject: MockProject = {
    id: projectId,
    title: 'Garden Landscaping Project',
    description: 'Complete garden redesign with new plants, irrigation system, and stone pathways',
    complexity: projectComplexity,
    estimatedCost: initialAmount || 2500,
    status: 'pending'
  };

  const handleCreatePaymentIntent = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const intent = await stripeService.createCustomerPaymentIntent(
        amount,
        currency,
        customerId,
        projectId,
        { projectTitle: mockProject.title }
      );
      
      setPaymentIntent(intent);
      setSuccess('Payment intent created successfully! Customer can now complete payment.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment intent');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapturePayment = async () => {
    if (!paymentIntent) return;

    setIsProcessing(true);
    setError(null);

    try {
      const capturedPayment = await stripeService.captureCustomerPayment(paymentIntent.id);
      setPaymentIntent(capturedPayment);
      
      // Process payment distribution
      const distribution = await stripeService.processPaymentDistribution(
        projectId,
        capturedPayment.id,
        capturedPayment.amount,
        contractorId || 'contractor_123',
        projectComplexity
      );
      
      setPaymentDistribution(distribution);
      setSuccess('Payment captured and distributed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseHoldback = async () => {
    if (!paymentDistribution) return;

    setIsProcessing(true);
    setError(null);

    try {
      const holdbackPayout = await stripeService.releaseHoldback(
        paymentDistribution.id,
        projectId,
        contractorId || 'contractor_123'
      );
      
      setContractorPayout(holdbackPayout);
      setSuccess('Holdback released successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release holdback');
    } finally {
      setIsProcessing(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDistribution = () => {
    if (!amount) return null;
    return stripeService.calculatePaymentDistribution(amount, projectComplexity);
  };

  const distribution = calculateDistribution();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Management
          </CardTitle>
          <CardDescription>
            Manage project payments, distributions, and contractor payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer-payment">Customer Payment</TabsTrigger>
              <TabsTrigger value="payment-distribution">Payment Distribution</TabsTrigger>
              <TabsTrigger value="contractor-payout">Contractor Payout</TabsTrigger>
            </TabsList>

            {/* Customer Payment Tab */}
            <TabsContent value="customer-payment" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Project Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="2500.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complexity">Project Complexity</Label>
                <Select value={projectComplexity} onValueChange={(value: any) => setProjectComplexity(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple (3% fee)</SelectItem>
                    <SelectItem value="medium">Medium (5% fee)</SelectItem>
                    <SelectItem value="complex">Complex (7% fee)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {distribution && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Platform Fee</div>
                        <div className="font-semibold">${distribution.platformFee.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Contractor Amount</div>
                        <div className="font-semibold">${distribution.contractorAmount.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Holdback</div>
                        <div className="font-semibold">${distribution.holdbackAmount.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Net to Contractor</div>
                        <div className="font-semibold">${distribution.netContractorAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleCreatePaymentIntent}
                  disabled={isProcessing || !amount}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {isProcessing ? 'Creating...' : 'Create Payment Intent'}
                </Button>
              </div>

              {paymentIntent && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Payment Intent Created</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>ID: {paymentIntent.id}</div>
                      <div>Amount: ${paymentIntent.amount} {paymentIntent.currency}</div>
                      <div>Status: {paymentIntent.status}</div>
                    </div>
                    <Button 
                      onClick={handleCapturePayment}
                      disabled={isProcessing || paymentIntent.status === 'succeeded'}
                      className="mt-3"
                      variant="outline"
                    >
                      {isProcessing ? 'Capturing...' : 'Capture Payment'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payment Distribution Tab */}
            <TabsContent value="payment-distribution" className="space-y-4 mt-4">
              {paymentDistribution ? (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Payment Distribution</h3>
                        <Badge className={getStatusColor(paymentDistribution.status)}>
                          {paymentDistribution.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Total Amount</div>
                          <div className="text-lg font-semibold">${paymentDistribution.totalAmount}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Platform Fee</div>
                          <div className="text-lg font-semibold">${paymentDistribution.platformFee}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Contractor Amount</div>
                          <div className="text-lg font-semibold">${paymentDistribution.contractorAmount}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Holdback</div>
                          <div className="text-lg font-semibold">${paymentDistribution.holdbackAmount}</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Payment Progress</span>
                          <span>100%</span>
                        </div>
                        <Progress value={100} className="w-full" />
                      </div>

                      <div className="text-xs text-gray-500">
                        Created: {paymentDistribution.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No payment distribution yet. Complete a customer payment first.</p>
                </div>
              )}
            </TabsContent>

            {/* Contractor Payout Tab */}
            <TabsContent value="contractor-payout" className="space-y-4 mt-4">
              {contractorPayout ? (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Contractor Payout</h3>
                        <Badge className={getStatusColor(contractorPayout.status)}>
                          {contractorPayout.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Amount</div>
                          <div className="text-lg font-semibold">${contractorPayout.amount}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Currency</div>
                          <div className="text-lg font-semibold">{contractorPayout.currency}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Transfer ID</div>
                          <div className="text-sm font-mono">{contractorPayout.stripeTransferId}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Type</div>
                          <div className="text-sm">{contractorPayout.metadata.type}</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="text-xs text-gray-500">
                        Created: {contractorPayout.createdAt.toLocaleDateString()}
                        {contractorPayout.completedAt && (
                          <span className="ml-4">
                            Completed: {contractorPayout.completedAt.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No contractor payout yet. Complete payment distribution first.</p>
                </div>
              )}

              {paymentDistribution && paymentDistribution.holdbackAmount > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Holdback Available</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      ${paymentDistribution.holdbackAmount} is held back until project completion.
                    </p>
                    <Button 
                      onClick={handleReleaseHoldback}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      {isProcessing ? 'Releasing...' : 'Release Holdback'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Project Title</Label>
              <p className="font-medium">{mockProject.title}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Complexity</Label>
              <Badge className={getComplexityColor(mockProject.complexity)}>
                {mockProject.complexity.charAt(0).toUpperCase() + mockProject.complexity.slice(1)}
              </Badge>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Estimated Cost</Label>
              <p className="font-medium">${mockProject.estimatedCost}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Status</Label>
              <Badge className={getStatusColor(mockProject.status)}>
                {mockProject.status.replace('_', ' ').charAt(0).toUpperCase() + mockProject.status.replace('_', ' ').slice(1)}
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-sm text-gray-600">Description</Label>
            <p className="text-sm text-gray-700">{mockProject.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Error and Success Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{success}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

