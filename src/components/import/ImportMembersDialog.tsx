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
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MemberRow {
  name: string;
  phone: string;
  email?: string;
  takaful_amount?: number;
  plus_amount?: number;
  status?: string;
}

export function ImportMembersDialog({ open, onOpenChange }: ImportMembersDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<MemberRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const importMembers = useMutation({
    mutationFn: async (members: MemberRow[]) => {
      const { error } = await supabase.from('family_members').insert(
        members.map((m) => ({
          name: m.name,
          phone: m.phone,
          email: m.email || null,
          takaful_amount: m.takaful_amount || 0,
          plus_amount: m.plus_amount || 0,
          status: m.status || 'active',
        }))
      );
      if (error) throw error;
      return members.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      toast({
        title: 'Import Successful',
        description: `${count} members imported successfully.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import members.',
        variant: 'destructive',
      });
    },
  });

  const downloadTemplate = () => {
    const template = [
      {
        name: 'John Doe',
        phone: '+92 300 1234567',
        email: 'john@example.com',
        takaful_amount: 300,
        plus_amount: 1000,
        status: 'active',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // name
      { wch: 18 }, // phone
      { wch: 25 }, // email
      { wch: 15 }, // takaful_amount
      { wch: 15 }, // plus_amount
      { wch: 10 }, // status
    ];
    
    XLSX.writeFile(wb, 'members_import_template.xlsx');
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
        const jsonData = XLSX.utils.sheet_to_json<MemberRow>(worksheet);

        // Validate data
        const validationErrors: string[] = [];
        const validMembers: MemberRow[] = [];

        jsonData.forEach((row, index) => {
          if (!row.name || typeof row.name !== 'string') {
            validationErrors.push(`Row ${index + 2}: Name is required`);
            return;
          }
          if (!row.phone) {
            validationErrors.push(`Row ${index + 2}: Phone is required`);
            return;
          }
          validMembers.push(row);
        });

        setPreviewData(validMembers);
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
    importMembers.mutate(previewData);
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
          <DialogTitle className="font-serif text-xl">Import Members</DialogTitle>
          <DialogDescription>
            Download the template, fill in member data, and upload to import.
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
                {previewData.length} valid members ready to import
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
            disabled={previewData.length === 0 || importMembers.isPending}
          >
            {importMembers.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Import {previewData.length} Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
