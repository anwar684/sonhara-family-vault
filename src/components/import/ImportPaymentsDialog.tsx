import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaymentRow {
  member_name: string;
  fund_type: string;
  month: string;
  amount: number;
  status: string;
  paid_date?: string;
}

interface ProcessedPayment {
  member_id: string;
  fund_type: string;
  month: string;
  amount: number;
  due_amount: number;
  status: string;
  paid_date?: string;
}

export function ImportPaymentsDialog({ open, onOpenChange }: ImportPaymentsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: membersData } = useFamilyMembers();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ProcessedPayment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const members = membersData || [];

  const importPayments = useMutation({
    mutationFn: async (payments: ProcessedPayment[]) => {
      const { error } = await supabase.from('payments').insert(
        payments.map((p) => ({
          member_id: p.member_id,
          fund_type: p.fund_type,
          month: p.month,
          amount: p.amount,
          due_amount: p.due_amount,
          status: p.status,
          paid_date: p.paid_date || null,
        }))
      );
      if (error) throw error;
      return payments.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Import Successful',
        description: `${count} payments imported successfully.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import payments.',
        variant: 'destructive',
      });
    },
  });

  const downloadTemplate = () => {
    const template = [
      {
        member_name: 'John Doe',
        fund_type: 'takaful',
        month: '2024-01',
        amount: 300,
        status: 'paid',
        paid_date: '2024-01-15',
      },
      {
        member_name: 'Jane Smith',
        fund_type: 'plus',
        month: '2024-01',
        amount: 1000,
        status: 'paid',
        paid_date: '2024-01-10',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // member_name
      { wch: 12 }, // fund_type
      { wch: 12 }, // month
      { wch: 12 }, // amount
      { wch: 10 }, // status
      { wch: 12 }, // paid_date
    ];
    
    XLSX.writeFile(wb, 'payments_import_template.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<PaymentRow>(worksheet);

        // Create member lookup by name (case-insensitive)
        const memberLookup = new Map(
          members.map((m) => [m.name.toLowerCase(), m])
        );

        // Validate and process data
        const validationErrors: string[] = [];
        const validPayments: ProcessedPayment[] = [];

        jsonData.forEach((row, index) => {
          const rowNum = index + 2;

          if (!row.member_name) {
            validationErrors.push(`Row ${rowNum}: Member name is required`);
            return;
          }

          const member = memberLookup.get(row.member_name.toLowerCase());
          if (!member) {
            validationErrors.push(`Row ${rowNum}: Member "${row.member_name}" not found`);
            return;
          }

          const fundType = row.fund_type?.toLowerCase();
          if (!fundType || !['takaful', 'plus'].includes(fundType)) {
            validationErrors.push(`Row ${rowNum}: Fund type must be 'takaful' or 'plus'`);
            return;
          }

          if (!row.month || !/^\d{4}-\d{2}$/.test(row.month)) {
            validationErrors.push(`Row ${rowNum}: Month must be in YYYY-MM format`);
            return;
          }

          if (typeof row.amount !== 'number' || row.amount < 0) {
            validationErrors.push(`Row ${rowNum}: Amount must be a positive number`);
            return;
          }

          const status = row.status?.toLowerCase() || 'pending';
          if (!['paid', 'pending', 'partial'].includes(status)) {
            validationErrors.push(`Row ${rowNum}: Status must be 'paid', 'pending', or 'partial'`);
            return;
          }

          const dueAmount = fundType === 'takaful' ? member.takaful_amount : member.plus_amount;

          validPayments.push({
            member_id: member.id,
            fund_type: fundType,
            month: row.month,
            amount: row.amount,
            due_amount: dueAmount,
            status,
            paid_date: row.paid_date,
          });
        });

        setPreviewData(validPayments);
        setErrors(validationErrors);
      } catch (err) {
        setErrors(['Failed to parse Excel file. Please check the format.']);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = () => {
    if (previewData.length === 0) {
      toast({
        title: 'No Data',
        description: 'No valid data to import.',
        variant: 'destructive',
      });
      return;
    }
    importPayments.mutate(previewData);
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Import Payments</DialogTitle>
          <DialogDescription>
            Download the template, fill in payment data, and upload to import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1: Download Template */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Step 1: Download Template</p>
                <p className="text-sm text-muted-foreground">
                  Get the Excel template with required columns
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1">Template columns:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><strong>member_name</strong>: Exact name as in system</li>
              <li><strong>fund_type</strong>: "takaful" or "plus"</li>
              <li><strong>month</strong>: Format YYYY-MM (e.g., 2024-01)</li>
              <li><strong>amount</strong>: Payment amount</li>
              <li><strong>status</strong>: "paid", "pending", or "partial"</li>
              <li><strong>paid_date</strong>: Optional (YYYY-MM-DD)</li>
            </ul>
          </div>

          {/* Step 2: Upload File */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Step 2: Upload Excel File</p>
                <p className="text-sm text-muted-foreground">
                  Upload your filled template
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {errors.length > 5 && <li>...and {errors.length - 5} more errors</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <Alert className="border-success/50 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                {previewData.length} valid payments ready to import
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            onClick={handleImport}
            disabled={previewData.length === 0 || importPayments.isPending}
          >
            {importPayments.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Import {previewData.length} Payments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
