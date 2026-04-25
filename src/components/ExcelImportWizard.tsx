import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';

import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Download,
  ArrowRight,
  ArrowLeft,
  X,
  Settings,
  Eye,
  Send,
  FileText,
  Target,
  BarChart3,
  AlertTriangle,
  Check,
  Loader2,
  MapPin,
  Zap,
  Database,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Import utility functions
import {
  ExcelMCQRow,
  ProcessedMCQ,
  SystemMapping,
  ValidationResult,
  BatchSubmission,
  detectExcelFormat,
  validateExcelData,
  processExcelData,
  autoMapSystems,
  distributeMCQsBySystem,
  createBatchSubmission,
  saveToPendingQueue,
  validateBatchForSubmission,
  generateExcelTemplate
  
} from '../utils/excelImportUtils';

interface ExcelImportWizardProps {
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  specialty: 'medicine' | 'surgery' | 'gynae-obs';
  onSuccess: (batchSubmission: BatchSubmission) => void;
  onCancel: () => void;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'submit';

interface UploadState {
  file: File | null;
  fileName: string;
  isLoading: boolean;
  formatDetection: ReturnType<typeof detectExcelFormat> | null;
  fileAnalysis: {
    totalRows: number;
    totalColumns: number;
    estimatedMcqs: number;
  } | null;
  rawData: ExcelMCQRow[] | null;
  validationResult: ValidationResult | null;
}

interface MappingState {
  systemMappings: { [excelSystem: string]: string };
  detectedSpecialty: 'medicine' | 'surgery' | 'gynae-obs';
  uniqueSystems: string[];
  autoMappings: SystemMapping[];
}

interface PreviewState {
  processedMcqs: ProcessedMCQ[];
  systemDistribution: { [systemName: string]: number };
  previewMcqs: ProcessedMCQ[];
  showAllPreview: boolean;
}

interface SubmitState {
  batchName: string;
  batchDescription: string;
  priority: 'low' | 'medium' | 'high';
  isSubmitting: boolean;
  submitValidation: ReturnType<typeof validateBatchForSubmission> | null;
}

const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({
  admin,
  specialty,
  onSuccess,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [systems, setSystems] = useState<any[]>([]);

  // Load medical systems for the specialty
  const loadSystems = useCallback(async () => {
    try {
      console.log(`🔄 Loading medical systems for Excel Import (${specialty})...`);
      const { getMedicalSystems } = await import('../utils/cmsUtils');
      const systemsData = await getMedicalSystems(specialty);
      
      if (Array.isArray(systemsData) && systemsData.length > 0) {
        setSystems(systemsData);
        console.log(`✅ Loaded ${systemsData.length} systems for Excel Import:`, {
          specialty,
          systemNames: systemsData.map(s => s.name),
          visible: systemsData.filter(s => s.isVisible !== false).length,
          active: systemsData.filter(s => s.isActive !== false).length
        });
      } else {
        console.warn(`⚠️ No medical systems found for ${specialty} in Excel Import`);
        setSystems([]);
      }
    } catch (error) {
      console.error('❌ Error loading medical systems for Excel Import:', error);
      setSystems([]);
    }
  }, [specialty]);

  // 🎯 SURGICAL FIX 1: Initial system loading
  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  // 🎯 SURGICAL FIX 2: Listen for medical systems updates
  useEffect(() => {
    const handleSystemUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Medical systems updated in Excel Import Wizard, refreshing...', customEvent.detail);
      
      // Only refresh if it affects current specialty or is a global update
      const { specialty: eventSpecialty } = customEvent.detail || {};
      if (!eventSpecialty || eventSpecialty === specialty) {
        try {
          // Force refresh medical systems cache first
          const { forceRefreshMedicalSystems, getMedicalSystems } = await import('../utils/cmsUtils');
          forceRefreshMedicalSystems();
          
          // Then reload systems for current specialty
          const refreshedSystems = await getMedicalSystems(specialty);
          setSystems(refreshedSystems || []);
          
          console.log(`✅ Excel Import Wizard systems refreshed for ${specialty}:`, {
            count: refreshedSystems?.length || 0,
            systems: refreshedSystems?.map(s => s.name) || []
          });
        } catch (error) {
          console.error('❌ Error refreshing medical systems in Excel Import Wizard:', error);
        }
      }
    };

    window.addEventListener('medicalSystemsUpdated', handleSystemUpdate);
    
    return () => {
      window.removeEventListener('medicalSystemsUpdated', handleSystemUpdate);
    };
  }, [specialty]);

  // 🎯 SURGICAL FIX 3: Manual refresh function for debugging
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered for Excel Import systems...');
    try {
      const { forceRefreshMedicalSystems } = await import('../utils/cmsUtils');
      forceRefreshMedicalSystems();
      await loadSystems();
      alert(`Systems refreshed! Found ${systems.length} systems for ${specialty}`);
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      alert('Refresh failed. Check console for details.');
    }
  };
  
  // Step states
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    fileName: '',
    isLoading: false,
    formatDetection: null,
    fileAnalysis: null,
    rawData: null,
    validationResult: null
  });
  
  const [mappingState, setMappingState] = useState<MappingState>({
    systemMappings: {},
    detectedSpecialty: 'medicine',
    uniqueSystems: [],
    autoMappings: []
  });
  
  const [previewState, setPreviewState] = useState<PreviewState>({
    processedMcqs: [],
    systemDistribution: {},
    previewMcqs: [],
    showAllPreview: false
  });
  
  const [submitState, setSubmitState] = useState<SubmitState>({
    batchName: '',
    batchDescription: '',
    priority: 'medium',
    isSubmitting: false,
    submitValidation: null
  });

  // Step navigation
  const steps = [
    { id: 'upload', title: 'Upload & Detection', icon: Upload },
    { id: 'mapping', title: 'System Mapping', icon: MapPin },
    { id: 'preview', title: 'Preview & Validation', icon: Eye },
    { id: 'submit', title: 'Submit Batch', icon: Send }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  // File upload handlers
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadState(prev => ({ ...prev, isLoading: true, file, fileName: file.name }));

    try {
      // Read Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      if (jsonData.length === 0) {
        throw new Error('Excel file appears to be empty');
      }
      
      const headers = jsonData[0].map(h => h?.toString().trim() || '');
      const dataRows = jsonData.slice(1).filter(row => 
        row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
      );
      
      // Format detection
      const formatDetection = detectExcelFormat(headers);
      
      // File analysis
      const fileAnalysis = {
        totalRows: dataRows.length,
        totalColumns: headers.length,
        estimatedMcqs: dataRows.length
      };
      
      // Convert to structured data
      const rawData: ExcelMCQRow[] = dataRows.map(row => {
        const mcqRow: any = {};
        headers.forEach((header, index) => {
          mcqRow[header] = row[index]?.toString() || '';
        });
        return mcqRow as ExcelMCQRow;
      });
      
      // Validate data
      const validationResult = validateExcelData(rawData);
      
      setUploadState(prev => ({
        ...prev,
        isLoading: false,
        formatDetection,
        fileAnalysis,
        rawData,
        validationResult
      }));
      
      console.log('📊 File processed:', {
        fileName: file.name,
        totalRows: dataRows.length,
        confidence: formatDetection.confidence,
        validMcqs: validationResult.validMcqCount
      });
      
    } catch (error) {
      console.error('❌ Error processing Excel file:', error);
      setUploadState(prev => ({
        ...prev,
        isLoading: false,
        validationResult: {
          isValid: false,
          errors: [`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          validMcqCount: 0,
          totalRows: 0
        }
      }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (excelFile) {
      handleFileSelect(excelFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Step 2: System mapping
  const handleNextToMapping = () => {
    if (!uploadState.rawData || !uploadState.validationResult?.isValid) return;
    
    // Extract unique systems
    const uniqueSystems = [...new Set(
      uploadState.rawData
        .map(row => row.System?.toString().trim())
        .filter(sys => sys)
    )];
    
    // Auto-generate mappings
    const autoMappings = autoMapSystems(uniqueSystems, systems);
    
    // Create initial mapping object
    const systemMappings: { [key: string]: string } = {};
    autoMappings.forEach(mapping => {
      systemMappings[mapping.excelSystem] = mapping.appSystem;
    });
    
    // Use the passed specialty
    const detectedSpecialty = specialty;
    
    setMappingState({
      systemMappings,
      detectedSpecialty,
      uniqueSystems,
      autoMappings
    });
    
    setCurrentStep('mapping');
  };

  // Step 3: Preview
  const handleNextToPreview = () => {
    if (!uploadState.rawData) return;
    
    // Process MCQs with current mappings
    const processedMcqs = processExcelData(uploadState.rawData, mappingState.systemMappings);
    const systemDistribution = distributeMCQsBySystem(processedMcqs);
    const previewMcqs = processedMcqs.slice(0, 10); // First 10 for preview
    
    setPreviewState({
      processedMcqs,
      systemDistribution,
      previewMcqs,
      showAllPreview: false
    });
    
    setCurrentStep('preview');
  };

  // Step 4: Submit
  const handleNextToSubmit = () => {
    const batchName = `${specialty.toUpperCase()} Batch - ${new Date().toLocaleDateString()}`;
    
    setSubmitState(prev => ({
      ...prev,
      batchName
    }));
    
    setCurrentStep('submit');
  };

  // Final submission
  const handleFinalSubmit = async () => {
    if (!previewState.processedMcqs.length) return;
    
    setSubmitState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Validate batch
      const validation = validateBatchForSubmission(
        previewState.processedMcqs,
        submitState.batchName,
        mappingState.systemMappings
      );
      
      if (!validation.isValid) {
        setSubmitState(prev => ({ ...prev, submitValidation: validation, isSubmitting: false }));
        return;
      }
      
      // Create batch submission
      const batchSubmission = createBatchSubmission(
        previewState.processedMcqs,
        {
          name: submitState.batchName,
          description: submitState.batchDescription,
          priority: submitState.priority,
          submittedBy: admin.id,
          originalFileName: uploadState.fileName
        },
        {
          totalRows: uploadState.fileAnalysis?.totalRows || 0,
          validMcqs: uploadState.validationResult?.validMcqCount || 0,
          errorCount: uploadState.validationResult?.errors.length || 0,
          warningCount: uploadState.validationResult?.warnings.length || 0
        }
      );
      
      // Save to pending queue
      saveToPendingQueue(previewState.processedMcqs, batchSubmission, specialty);
      
      // Log CMS activity
      const { logCMSActivity } = await import('../utils/cmsUtils');
      await logCMSActivity(
        'Excel Import Submitted',
        `Batch "${submitState.batchName}" submitted with ${previewState.processedMcqs.length} MCQs`,
        admin.id,
        'content-manager',
        'import',
        {
          batchId: batchSubmission.id,
          mcqCount: previewState.processedMcqs.length,
          systems: Object.keys(previewState.systemDistribution),
          fileName: uploadState.fileName,
          specialty: specialty
        }
      );
      
      console.log('✅ Excel import submitted successfully:', batchSubmission);
      onSuccess(batchSubmission);
      
    } catch (error) {
      console.error('❌ Error submitting Excel import:', error);
      setSubmitState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        submitValidation: {
          isValid: false,
          errors: [`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: []
        }
      }));
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const templateContent = generateExcelTemplate();
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PulsePrep_MCQ_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            {/* Upload Area */}
            <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
              <CardContent className="p-8">
                <div
                  className="text-center space-y-4"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                >
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    {uploadState.isLoading ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">
                      {uploadState.file ? 'File Uploaded' : 'Upload Excel File'}
                    </h3>
                    <p className="text-blue-700">
                      {uploadState.file 
                        ? `${uploadState.fileName} (${(uploadState.file.size / 1024 / 1024).toFixed(2)} MB)`
                        : 'Drag and drop your Excel file here, or click to browse'
                      }
                    </p>
                  </div>
                  
                  {!uploadState.file && (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadState.isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Browse Files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </div>
                  )}
                  
                  {uploadState.file && !uploadState.isLoading && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setUploadState({
                          file: null,
                          fileName: '',
                          isLoading: false,
                          formatDetection: null,
                          fileAnalysis: null,
                          rawData: null,
                          validationResult: null
                        });
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear File
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="w-5 h-5 mr-2 text-green-600" />
                  Excel Template
                </CardTitle>
                <CardDescription>
                  Download the official Excel template with correct column format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template (CSV)
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Template includes all 19 required columns with example MCQ data
                </p>
              </CardContent>
            </Card>

            {/* Format Detection Results */}
            {uploadState.formatDetection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                    Format Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Format Confidence</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={uploadState.formatDetection.confidence} className="w-24" />
                      <span className="text-sm font-medium">
                        {uploadState.formatDetection.confidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {uploadState.formatDetection.missingColumns.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Missing columns:</strong> {uploadState.formatDetection.missingColumns.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadState.formatDetection.extraColumns.length > 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Extra columns:</strong> {uploadState.formatDetection.extraColumns.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadState.fileAnalysis && (
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {uploadState.fileAnalysis.totalRows}
                        </div>
                        <div className="text-sm text-gray-600">Total Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {uploadState.fileAnalysis.totalColumns}
                        </div>
                        <div className="text-sm text-gray-600">Columns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {uploadState.fileAnalysis.estimatedMcqs}
                        </div>
                        <div className="text-sm text-gray-600">Est. MCQs</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Validation Results */}
            {uploadState.validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Data Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Validation Status</span>
                    <Badge className={uploadState.validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {uploadState.validationResult.isValid ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {uploadState.validationResult.validMcqCount}
                      </div>
                      <div className="text-sm text-gray-600">Valid MCQs</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {uploadState.validationResult.errors.length}
                      </div>
                      <div className="text-sm text-gray-600">Errors</div>
                    </div>
                  </div>
                  
                  {uploadState.validationResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Errors found:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {uploadState.validationResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                          {uploadState.validationResult.errors.length > 5 && (
                            <li className="text-sm">... and {uploadState.validationResult.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadState.validationResult.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warnings:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {uploadState.validationResult.warnings.slice(0, 3).map((warning, index) => (
                            <li key={index} className="text-sm">{warning}</li>
                          ))}
                          {uploadState.validationResult.warnings.length > 3 && (
                            <li className="text-sm">... and {uploadState.validationResult.warnings.length - 3} more warnings</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-6">
            {/* Specialty Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Specialty Detection
                </CardTitle>
                <CardDescription>
                  Auto-detected specialty based on system names
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Label>Detected Specialty:</Label>
                  <Select 
                    value={specialty} 
                    onValueChange={() => {}}
                    
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="surgery">Surgery</SelectItem>
                      <SelectItem value="gynae-obs">Gynae & Obs</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* 🎯 SURGICAL FIX 4: Manual refresh button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    className="ml-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh Systems
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Mappings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-purple-600" />
                  System Mapping
                </CardTitle>
                <CardDescription>
                  Map Excel systems to app systems ({mappingState.uniqueSystems.length} unique systems found)
                  {/* 🎯 SURGICAL FIX 5: Show current systems count */}
                  <br />
                  <span className="text-green-600">Available systems: {systems.length}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mappingState.autoMappings.map((mapping) => {
                    const mcqCount = uploadState.rawData?.filter(row => 
                      row.System?.toString().trim() === mapping.excelSystem
                    ).length || 0;
                    
                    return (
                      <div key={mapping.excelSystem} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{mapping.excelSystem}</div>
                          <div className="text-sm text-gray-500">{mcqCount} MCQs</div>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        <div className="flex-1">
                          <Select 
                            value={mappingState.systemMappings[mapping.excelSystem]} 
                            onValueChange={(value) => 
                              setMappingState(prev => ({
                                ...prev,
                                systemMappings: {
                                  ...prev.systemMappings,
                                  [mapping.excelSystem]: value
                                }
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select app system" />
                            </SelectTrigger>
                            <SelectContent>
                              {systems
                                .filter(sys => sys.specialty === specialty || sys.isUniversal)
                                .map(system => (
                                  <SelectItem key={system.id} value={system.name}>
                                    {system.name}
                                    {system.isUniversal && <span className="text-xs text-gray-500 ml-1">(Universal)</span>}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Badge className={
                          mapping.confidence === 'high' ? 'bg-green-100 text-green-800' :
                          mapping.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {mapping.confidence}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            {/* Processing Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                  Processing Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {previewState.processedMcqs.length}
                    </div>
                    <div className="text-sm text-blue-700">Total MCQs</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.keys(previewState.systemDistribution).length}
                    </div>
                    <div className="text-sm text-green-700">Systems</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {uploadState.validationResult?.warnings.length || 0}
                    </div>
                    <div className="text-sm text-purple-700">Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 capitalize">
                      {specialty}
                    </div>
                    <div className="text-sm text-yellow-700">Specialty</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                  System Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(previewState.systemDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .map(([system, count]) => (
                      <div key={system} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{system}</span>
                        <Badge variant="secondary">{count} MCQs</Badge>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            {/* MCQ Preview Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-indigo-600" />
                    MCQ Preview
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewState(prev => ({ 
                      ...prev, 
                      showAllPreview: !prev.showAllPreview,
                      previewMcqs: prev.showAllPreview ? prev.processedMcqs.slice(0, 10) : prev.processedMcqs
                    }))}
                  >
                    {previewState.showAllPreview ? 'Show Less' : 'Show All'}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Preview of processed MCQs ({previewState.showAllPreview ? 'All' : 'First 10'})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>MCQ #</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Options</TableHead>
                        <TableHead>Correct</TableHead>
                        <TableHead>System</TableHead>
                        <TableHead>Difficulty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewState.previewMcqs.map((mcq, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {mcq.originalMcqNumber || index + 1}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={mcq.question}>
                              {mcq.question.substring(0, 80)}
                              {mcq.question.length > 80 && '...'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {mcq.options.length} options
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              {String.fromCharCode(65 + mcq.correctAnswer)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={mcq.system}>
                              {mcq.system}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              mcq.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                              mcq.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                              mcq.difficulty === 'advanced' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {mcq.difficulty}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );

      case 'submit':
        return (
          <div className="space-y-6">
            {/* Batch Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Batch Information
                </CardTitle>
                <CardDescription>
                  Provide details for this import batch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="batchName">Batch Name *</Label>
                  <Input
                    id="batchName"
                    value={submitState.batchName}
                    onChange={(e) => setSubmitState(prev => ({ ...prev, batchName: e.target.value }))}
                    placeholder="Enter a descriptive batch name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="batchDescription">Description</Label>
                  <Textarea
                    id="batchDescription"
                    value={submitState.batchDescription}
                    onChange={(e) => setSubmitState(prev => ({ ...prev, batchDescription: e.target.value }))}
                    placeholder="Optional description of this batch content..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Review Priority</Label>
                  <Select 
                    value={submitState.priority} 
                    onValueChange={(value) => 
                      setSubmitState(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    Higher priority batches will be reviewed first
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submission Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-green-600" />
                  Submission Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total MCQs:</span>
                      <span className="font-medium">{previewState.processedMcqs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Specialty:</span>
                      <span className="font-medium capitalize">{specialty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Systems:</span>
                      <span className="font-medium">{Object.keys(previewState.systemDistribution).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority:</span>
                      <Badge className={
                        submitState.priority === 'high' ? 'bg-red-100 text-red-800' :
                        submitState.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {submitState.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>File:</span>
                      <span className="font-medium truncate max-w-32" title={uploadState.fileName}>
                        {uploadState.fileName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Submitted by:</span>
                      <span className="font-medium">{admin.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Review Status:</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Submission Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Errors */}
            {submitState.submitValidation && !submitState.submitValidation.isValid && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cannot submit batch:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {submitState.submitValidation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Warnings */}
            {(submitState.submitValidation?.warnings?.length ?? 0) > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {(submitState.submitValidation?.warnings || []).map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Check if current step can proceed to next
  const canProceedToNext = () => {
    switch (currentStep) {
      case 'upload':
        return uploadState.validationResult?.isValid && uploadState.rawData;
      case 'mapping':
        return Object.keys(mappingState.systemMappings).length > 0 &&
               Object.values(mappingState.systemMappings).every(mapping => mapping);
      case 'preview':
        return previewState.processedMcqs.length > 0;
      case 'submit':
        return submitState.batchName.trim() && !submitState.isSubmitting;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Excel MCQ Import Wizard</h2>
              <p className="text-gray-600">Import FCPS MCQs from Excel with automatic processing</p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="ml-6 mr-4 w-8 h-0.5 bg-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-right text-sm text-gray-600 mt-1">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {currentStep === 'upload' && 'Upload your Excel file to get started'}
              {currentStep === 'mapping' && 'Map Excel systems to app systems'}
              {currentStep === 'preview' && 'Review processed MCQs before submission'}
              {currentStep === 'submit' && 'Ready to submit batch for review'}
            </div>
            
            <div className="flex items-center space-x-4">
              {currentStep !== 'upload' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const prevIndex = Math.max(0, currentStepIndex - 1);
                    setCurrentStep(steps[prevIndex].id as WizardStep);
                  }}
                  disabled={submitState.isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {currentStep === 'submit' ? (
                <Button
                  onClick={handleFinalSubmit}
                  disabled={!canProceedToNext()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitState.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Batch
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    switch (currentStep) {
                      case 'upload':
                        handleNextToMapping();
                        break;
                      case 'mapping':
                        handleNextToPreview();
                        break;
                      case 'preview':
                        handleNextToSubmit();
                        break;
                    }
                  }}
                  disabled={!canProceedToNext()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportWizard;