// COMPLETELY NEW FILE - CREATE FROM SCRATCH
// THIS IS SEPARATE FROM THE EXISTING ExcelImportWizard.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { addMockExamQuestionsBulk } from '../utils/mockExamUtils';
import * as XLSX from 'xlsx';
import { SpecialtyType } from '../types';

interface MockExamImportWizardProps {
  specialty: SpecialtyType;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MockExamImportWizard: React.FC<MockExamImportWizardProps> = ({
  specialty,
  onSuccess,
  onCancel
}) => {
  const [selectedMockExam, setSelectedMockExam] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [importStats, setImportStats] = useState<{total: number, valid: number, errors: string[]} | null>(null);
  const [previewData, setPreviewData] = useState<{questions: any[], totalCount: number, errors: string[]} | null>(null);

  const [availableMockExams, setAvailableMockExams] = useState<any[]>([]);

  // Load available mock exam sets when component mounts
  useEffect(() => {
    loadAvailableMockExams();
  }, [specialty]);

  const loadAvailableMockExams = async () => {
    try {
      const { getMockExamSets } = await import('../utils/mockExamUtils');
      const mockSets = await getMockExamSets(specialty);
      
      // Filter for approved mock exam sets only
      const approvedSets = mockSets.filter(set => set.status === 'approved');
      
      // Map to the format needed for dropdown
      const mockExamOptions = approvedSets.map(set => ({
        value: set.name,
        label: set.name,
        maxQuestions: set.totalQuestions,
        id: set.id
      }));
      
      setAvailableMockExams(mockExamOptions);
    } catch (error) {
      console.error('Error loading mock exam sets:', error);
    }
  };

  const selectedOption = availableMockExams.find(opt => opt.value === selectedMockExam);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportStats(null);
      setPreviewData(null);
      // Process file for preview
      processFileForPreview(selectedFile);
    }
  };

  const processFileForPreview = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await processExcelForMockExam(file);
      
      // Show preview with first 3 questions
      const previewQuestions = result.validQuestions.slice(0, 3);
      setPreviewData({
        questions: previewQuestions,
        totalCount: result.validQuestions.length,
        errors: result.errors
      });
      setStep(2); // Move to preview step
    } catch (error) {
      console.error('Preview processing error:', error);
      alert(`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !selectedMockExam || !previewData) return;
    
    setIsProcessing(true);
    
    try {
      // Also need to process all questions, not just preview
      const fullResult = await processExcelForMockExam(file);
      const allQuestionsWithMetadata = fullResult.validQuestions.map((q, index) => ({
        ...q,
        id: `${selectedMockExam.toLowerCase().replace(' ', '_')}_${Date.now()}_${index}`,
        status: 'pending' as const,
        specialty,
        mockExam: selectedMockExam,
        createdAt: new Date().toISOString()
      }));
      
      if (allQuestionsWithMetadata.length > 0) {
        const success = addMockExamQuestionsBulk(specialty, selectedMockExam, allQuestionsWithMetadata);
        
        if (success) {
          setImportStats({
            total: fullResult.totalRows,
            valid: allQuestionsWithMetadata.length,
            errors: fullResult.errors
          });
          setStep(3); // Success step
        } else {
          throw new Error('Failed to save questions to storage');
        }
      } else {
        throw new Error('No valid questions found in the Excel file');
      }
    } catch (error) {
      console.error('Mock exam import error:', error);
      setImportStats({
        total: 0,
        valid: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
      setStep(3); // Show errors
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    if (importStats && importStats.valid > 0) {
      onSuccess();
    } else {
      setStep(1); // Back to start
      setFile(null);
      setImportStats(null);
      setPreviewData(null);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Mock Exam Questions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Mock Exam:</label>
                <Select value={selectedMockExam} onValueChange={setSelectedMockExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose mock exam..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMockExams.length > 0 ? (
                      availableMockExams.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} (Max {option.maxQuestions} questions)
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="">
                        No approved mock exam sets found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedMockExam && selectedOption && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Selected: <strong>{selectedMockExam}</strong><br/>
                    Maximum questions: {selectedOption.maxQuestions}
                  </AlertDescription>
                </Alert>
              )}
              
              {availableMockExams.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No approved mock exam sets found. Please create and get approval for mock exam sets first.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Upload Excel File:</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="mock-excel-upload"
                    disabled={!selectedMockExam || isProcessing || availableMockExams.length === 0}
                  />
                  <label 
                    htmlFor="mock-excel-upload" 
                    className={`cursor-pointer text-sm ${
                      selectedMockExam && !isProcessing && availableMockExams.length > 0 
                        ? 'text-blue-600 hover:text-blue-800' 
                        : 'text-gray-400'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : 
                     availableMockExams.length === 0 ? 'No mock exam sets available' :
                     'Click to upload Excel file'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports both simplified format and your 19-column FCPS format
                  </p>
                </div>
              </div>
            </>
          )}
          
          
          {step === 2 && previewData && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <FileText className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                      <h3 className="font-medium">Preview: Sample Questions</h3>
                      <p className="text-sm text-gray-600">
                        Showing {previewData.questions.length} of {previewData.totalCount} questions
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm bg-gray-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span>Mock Exam:</span>
                        <span className="font-medium">{selectedMockExam}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>File:</span>
                        <span className="font-medium truncate ml-2">{file?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Valid Questions:</span>
                        <span className="font-medium text-green-600">{previewData.totalCount}</span>
                      </div>
                      {previewData.errors.length > 0 && (
                        <div className="flex justify-between">
                          <span>Skipped Rows:</span>
                          <span className="font-medium text-orange-600">{previewData.errors.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Questions */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {previewData.questions.map((question, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-blue-800 mb-1">
                            Question {index + 1}:
                          </h4>
                          <p className="text-sm">{question.question}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {question.options.map((option: any, optIndex: number) => (
                            <div 
                              key={optIndex}
                              className={`p-2 rounded ${
                                optIndex === question.correctAnswer 
                                  ? 'bg-green-100 text-green-800 font-medium' 
                                  : 'bg-gray-50'
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + optIndex)}:
                              </span> {option}
                              {optIndex === question.correctAnswer && (
                                <span className="ml-2 text-green-600">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-blue-800">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                        
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span><strong>Category:</strong> {question.category}</span>
                          <span><strong>Difficulty:</strong> {question.difficulty}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {previewData.errors.length > 0 && (
                <Card className="border-orange-200">
                  <CardContent className="pt-4">
                    <h4 className="font-medium text-orange-800 mb-2">
                      ⚠️ Rows Skipped ({previewData.errors.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {previewData.errors.slice(0, 5).map((error, index) => (
                        <p key={index} className="text-xs text-orange-700 bg-orange-50 p-1 rounded">
                          {error}
                        </p>
                      ))}
                      {previewData.errors.length > 5 && (
                        <p className="text-xs text-orange-600">
                          ... and {previewData.errors.length - 5} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === 2 && file && !previewData && isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600">Processing Excel file...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && importStats && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {importStats.valid > 0 ? (
                    <>
                      <div className="text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-2" />
                        <h3 className="font-medium text-green-800">Import Successful!</h3>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Rows Processed:</span>
                          <span className="font-medium">{importStats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valid Questions:</span>
                          <span className="font-medium text-green-600">{importStats.valid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Errors/Skipped:</span>
                          <span className="font-medium text-red-600">{importStats.errors.length}</span>
                        </div>
                      </div>
                      
                      {importStats.errors.length > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Some rows were skipped due to missing data or formatting issues.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-2" />
                        <h3 className="font-medium text-red-800">Import Failed</h3>
                      </div>
                      
                      <div className="space-y-2">
                        {importStats.errors.map((error, index) => (
                          <Alert key={index}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {error}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex space-x-2">
            {step === 1 && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            
            {step === 2 && previewData && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep(1);
                    setFile(null);
                    setPreviewData(null);
                  }}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Importing...' : `Import ${previewData.totalCount} Questions`}
                </Button>
              </>
            )}

            {step === 3 && (
              <Button onClick={handleFinish} className="flex-1">
                {importStats && importStats.valid > 0 ? 'Finish' : 'Try Again'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// SMART EXCEL PROCESSING - WORKS WITH YOUR 19-COLUMN FCPS FORMAT
const processExcelForMockExam = async (file: File): Promise<{validQuestions: any[], totalRows: number, errors: string[]}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('Excel file must have at least a header row and one data row');
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        console.log('📋 Detected headers:', headers);
        
        // Smart column mapping - works with ANY format
        const columnMap = mapFCPSHeadersSmart(headers);
        
        console.log('🎯 Column mapping:', columnMap);
        
        // Validate that we found the essential columns
        validateRequiredColumns(columnMap, headers);
        
        const validQuestions: any[] = [];
        const errors: string[] = [];
        
        // Process each row
        rows.forEach((row, index) => {
          if (!row || row.length === 0 || !row[columnMap.question]) {
            return; // Skip empty rows silently
          }
          
          try {
            const question = processSmartFCPSRow(row, columnMap);
            validQuestions.push(question);
          } catch (error) {
            errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
        
        console.log(`✅ Processed ${validQuestions.length} valid questions from ${headers.length}-column Excel file`);
        
        resolve({
          validQuestions,
          totalRows: rows.length,
          errors
        });
      } catch (error) {
        reject(new Error(`Smart Excel processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsBinaryString(file);
  });
};

// Smart column mapping that detects required columns from ANY format
const mapFCPSHeadersSmart = (headers: string[]): { [key: string]: number } => {
  const headerMap: { [key: string]: number } = {};
  
  headers.forEach((header, index) => {
    if (!header) return; // Skip empty headers
    
    const normalizedHeader = header.toLowerCase().trim();
    
    // Question detection (multiple variations)
    if ((normalizedHeader.includes('scenario') && normalizedHeader.includes('question')) ||
        normalizedHeader === 'question' ||
        normalizedHeader === 'question text' ||
        normalizedHeader.includes('scenario + question')) {
      headerMap.question = index;
    }
    
    // Option detection (exact matches to avoid conflicts)
    else if (normalizedHeader === 'option a') {
      headerMap.optionA = index;
    }
    else if (normalizedHeader === 'option b') {
      headerMap.optionB = index;
    }
    else if (normalizedHeader === 'option c') {
      headerMap.optionC = index;
    }
    else if (normalizedHeader === 'option d') {
      headerMap.optionD = index;
    }
    else if (normalizedHeader === 'option e') {
      headerMap.optionE = index;
    }
    
    // Correct answer detection
    else if (normalizedHeader === 'correct option' ||
             normalizedHeader === 'correct answer' ||
             normalizedHeader === 'answer') {
      headerMap.answer = index;
    }
    
    // Explanation detection (prioritize correct explanation)
    else if (normalizedHeader.includes('explanation (correct') ||
             normalizedHeader === 'explanation (correct option)') {
      headerMap.explanation = index;
    }
    
    // System/Category detection
    else if (normalizedHeader === 'system') {
      headerMap.category = index;
    }
    
    // Difficulty detection
    else if (normalizedHeader.includes('difficulty')) {
      headerMap.difficulty = index;
    }
  });
  
  // If no explanation found, try backup patterns
  if (headerMap.explanation === undefined) {
    headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      if (normalizedHeader.includes('explanation') && 
          !normalizedHeader.includes('incorrect')) {
        headerMap.explanation = index;
      }
    });
  }
  
  return headerMap;
};

// Validation function
const validateRequiredColumns = (columnMap: { [key: string]: number }, headers: string[]) => {
  const requiredColumns = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'answer', 'explanation'];
  const missingColumns = requiredColumns.filter(col => columnMap[col] === undefined);
  
  if (missingColumns.length > 0) {
    console.error('❌ Column mapping failed:', columnMap);
    console.error('📋 Available headers:', headers);
    throw new Error(`Could not detect required columns: ${missingColumns.join(', ')}\n\nDetected columns: ${Object.keys(columnMap).join(', ')}`);
  }
  
  console.log('✅ All required columns detected successfully');
};

// Smart row processing
const processSmartFCPSRow = (row: any[], columnMap: { [key: string]: number }): any => {
  // Extract fields using detected column positions
  const question = row[columnMap.question]?.toString()?.trim();
  const optionA = row[columnMap.optionA]?.toString()?.trim();
  const optionB = row[columnMap.optionB]?.toString()?.trim();
  const optionC = row[columnMap.optionC]?.toString()?.trim();
  const optionD = row[columnMap.optionD]?.toString()?.trim();
  const optionE = row[columnMap.optionE]?.toString()?.trim();
  const correctAnswerLetter = row[columnMap.answer]?.toString()?.trim()?.toUpperCase();
  const explanation = row[columnMap.explanation]?.toString()?.trim();
  
  // Validate required fields
  if (!question) throw new Error(`Question text is empty`);
  if (!optionA) throw new Error(`Option A is empty`);
  if (!optionB) throw new Error(`Option B is empty`);
  if (!optionC) throw new Error(`Option C is empty`);
  if (!optionD) throw new Error(`Option D is empty`);
  if (!optionE) throw new Error(`Option E is empty`);
  if (!explanation) throw new Error(`Explanation is empty`);
  
  if (!['A', 'B', 'C', 'D', 'E'].includes(correctAnswerLetter)) {
    throw new Error(`Invalid correct answer "${correctAnswerLetter}". Must be A, B, C, D, or E`);
  }
  
  // Convert letter to index
  const correctAnswerIndex = correctAnswerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
  
  // Extract optional fields (use detected columns or defaults)
  const category = columnMap.category !== undefined ? 
    (row[columnMap.category]?.toString()?.trim() || 'General') : 'General';
  
  const difficultyRaw = columnMap.difficulty !== undefined ? 
    (row[columnMap.difficulty]?.toString()?.trim() || 'Medium') : 'Medium';
  
  const difficulty = normalizeDifficulty(difficultyRaw);
  
  return {
    question,
    options: [optionA, optionB, optionC, optionD, optionE],
    correctAnswer: correctAnswerIndex,
    explanation,
    category,
    difficulty,
    source: 'smart_fcps_import',
    importedAt: new Date().toISOString()
  };
};

// Difficulty normalization
const normalizeDifficulty = (difficulty: string): string => {
  const diff = difficulty?.toLowerCase()?.trim();
  
  if (['1', '2', 'easy', 'low'].includes(diff)) return 'Easy';
  if (['3', 'medium', 'moderate', 'mid'].includes(diff)) return 'Medium';
  if (['4', '5', 'hard', 'difficult', 'high'].includes(diff)) return 'Hard';
  
  return 'Medium';
};