/**
 * Question Editor Component - Enhanced for Database Migration
 * Handles question creation and editing with type safety and database integration
 * 
 * CRITICAL: This component handles medical education content creation
 */

import React, { useState, useEffect } from 'react';
import { StorageService } from '../utils/storageUtils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { CheckCircle, AlertTriangle, Plus, Minus, Save, Eye, EyeOff } from 'lucide-react';
import { 
  QuestionData, 
  SpecialtyType, 
  QuestionStatusType, 
  DifficultyType,
  AdminData,
  MedicalSystem
} from '../types';

interface QuestionEditorProps {
  admin: AdminData;
  onNavigate: (page: string) => void;
  initialQuestion?: QuestionData | null;
  mode?: 'create' | 'edit' | 'review';
  onSave?: (question: QuestionData) => void;
  onCancel?: () => void;
}

interface FormErrors {
  text?: string;
  options?: string;
  correctAnswer?: string;
  explanation?: string;
  system?: string;
  specialty?: string;
  optionExplanations?: string;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  admin,
  onNavigate,
  initialQuestion = null,
  mode = 'create',
  onSave,
  onCancel
}) => {
  // Form state with proper type safety
  const [formData, setFormData] = useState<Partial<QuestionData>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    specialty: 'medicine' as SpecialtyType,
    system: '',
    difficulty: 'medium' as DifficultyType,
    status: 'pending' as QuestionStatusType,
    optionExplanations: ['', '', '', ''],
    tags: [],
    isActive: true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [availableSystems, setAvailableSystems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      try {
        // Load available medical systems for the specialty
        await loadMedicalSystems(formData.specialty || 'medicine');
        
        // If editing, load the question data
        if (initialQuestion) {
          setFormData({
            ...initialQuestion,
            // Ensure arrays are properly initialized with null checks
            options: Array.isArray(initialQuestion.options) ? initialQuestion.options : ['', '', '', ''],
            optionExplanations: Array.isArray(initialQuestion.optionExplanations) 
              ? initialQuestion.optionExplanations 
              : ['', '', '', ''],
            tags: Array.isArray(initialQuestion.tags) ? initialQuestion.tags : []
          });
        }
      } catch (error) {
        console.error('❌ Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [initialQuestion]);

  // Load medical systems based on specialty
  const loadMedicalSystems = async (specialty: SpecialtyType) => {
    try {
      const result = await StorageService.getMedicalSystems(specialty);
      
      if (result.success && Array.isArray(result.data)) {
        const systems = result.data
          .filter((system: MedicalSystem) => system.isActive !== false)
          .map((system: MedicalSystem) => system.name || system.systemName || '')
          .filter((name: string) => name.length > 0);
        
        setAvailableSystems(systems);
        
        // If no system is selected and systems are available, select the first one
        if (!formData.system && systems.length > 0) {
          setFormData(prev => ({ ...prev, system: systems[0] }));
        }
      } else {
        console.error('❌ Failed to load medical systems:', result.error);
        setAvailableSystems([]);
      }
    } catch (error) {
      console.error('❌ Error loading medical systems:', error);
      setAvailableSystems([]);
    }
  };

  // Handle specialty change
  const handleSpecialtyChange = async (specialty: SpecialtyType) => {
    setFormData((prev: Partial<QuestionData>) => ({ ...prev, specialty, system: '' }));
    await loadMedicalSystems(specialty);
  };

  // Handle option changes with array safety
  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev: Partial<QuestionData>) => {
      const newOptions = Array.isArray(prev.options) ? [...prev.options] : ['', '', '', ''];
      
      // Ensure the array has enough elements
      while (newOptions.length <= index) {
        newOptions.push('');
      }
      
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
    
    // Clear option-related errors
    if (errors.options) {
      setErrors((prev: FormErrors) => ({ ...prev, options: undefined }));
    }
  };

  // Handle option explanation changes with array safety
  const handleOptionExplanationChange = (index: number, value: string) => {
    setFormData((prev: Partial<QuestionData>) => {
      const newExplanations = Array.isArray(prev.optionExplanations) 
        ? [...prev.optionExplanations] 
        : ['', '', '', ''];
      
      // Ensure the array has enough elements
      while (newExplanations.length <= index) {
        newExplanations.push('');
      }
      
      newExplanations[index] = value;
      return { ...prev, optionExplanations: newExplanations };
    });
  };

  // Add new option with array safety
  const addOption = () => {
    setFormData((prev: Partial<QuestionData>) => {
      const currentOptions = Array.isArray(prev.options) ? prev.options : [];
      const currentExplanations = Array.isArray(prev.optionExplanations) ? prev.optionExplanations : [];
      
      return {
        ...prev,
        options: [...currentOptions, ''],
        optionExplanations: [...currentExplanations, '']
      };
    });
  };

  // Remove option with array safety
  const removeOption = (index: number) => {
    setFormData((prev: Partial<QuestionData>) => {
      const currentOptions = Array.isArray(prev.options) ? [...prev.options] : [];
      const currentExplanations = Array.isArray(prev.optionExplanations) ? [...prev.optionExplanations] : [];
      
      // Don't allow removal if less than 2 options
      if (currentOptions.length <= 2) {
        return prev;
      }
      
      currentOptions.splice(index, 1);
      currentExplanations.splice(index, 1);
      
      // Adjust correct answer if necessary
      let newCorrectAnswer = prev.correctAnswer || 0;
      if (newCorrectAnswer >= currentOptions.length) {
        newCorrectAnswer = Math.max(0, currentOptions.length - 1);
      }
      
      return {
        ...prev,
        options: currentOptions,
        optionExplanations: currentExplanations,
        correctAnswer: newCorrectAnswer
      };
    });
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate question text
    if (!formData.text || formData.text.trim().length < 10) {
      newErrors.text = 'Question text must be at least 10 characters long';
    }

    // Validate options with proper array safety
    const options = Array.isArray(formData.options) ? formData.options : [];
    if (options.length < 2) {
      newErrors.options = 'At least 2 options are required';
    } else {
      const nonEmptyOptions = options.filter((opt: string) => opt && opt.trim().length > 0);
      if (nonEmptyOptions.length < 2) {
        newErrors.options = 'At least 2 non-empty options are required';
      }
    }

    // Validate correct answer
    const correctAnswer = formData.correctAnswer ?? -1;
    if (correctAnswer < 0 || correctAnswer >= options.length) {
      newErrors.correctAnswer = 'Please select a valid correct answer';
    }

    // Validate specialty and system
    if (!formData.specialty) {
      newErrors.specialty = 'Specialty is required';
    }

    if (!formData.system) {
      newErrors.system = 'Medical system is required';
    }

    // Validate explanation
    if (!formData.explanation || formData.explanation.trim().length < 5) {
      newErrors.explanation = 'Explanation must be at least 5 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const questionData: QuestionData = {
        id: initialQuestion?.id || `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: formData.text!,
        options: Array.isArray(formData.options) ? formData.options.filter((opt: string) => opt.trim().length > 0) : [],
        correctAnswer: formData.correctAnswer!,
        explanation: formData.explanation!,
        specialty: formData.specialty!,
        system: formData.system!,
        difficulty: formData.difficulty || 'medium',
        status: mode === 'create' ? 'pending' : (formData.status || 'pending'),
        submittedBy: admin.id,
        reviewedBy: mode === 'review' ? admin.id : undefined,
        reviewedAt: mode === 'review' ? new Date().toISOString() : undefined,
        reviewNotes: mode === 'review' ? 'Reviewed by content manager' : undefined,
        optionExplanations: Array.isArray(formData.optionExplanations) ? formData.optionExplanations : [],
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        isActive: formData.isActive !== false,
        createdAt: initialQuestion?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let result;
      if (mode === 'edit' && initialQuestion) {
        result = await StorageService.updateQuestion(initialQuestion.id || '', questionData)
      } else {
        result = await StorageService.createQuestion(questionData);
      }

      if (result.success) {
        console.log('✅ Question saved successfully:', result.data);
        
        if (onSave) {
          onSave(result.data as QuestionData);
        } else {
          // Navigate back to content management
          onNavigate('content-management');
        }
      } else {
        console.error('❌ Failed to save question:', result.error);
        setErrors({ text: result.error || 'Failed to save question' });
      }

    } catch (error) {
      console.error('❌ Error saving question:', error);
      setErrors({ text: 'An unexpected error occurred while saving the question' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render preview
  const renderPreview = () => {
    const options = Array.isArray(formData.options) ? formData.options : [];
    
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Question Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600">Question Text:</Label>
            <p className="mt-1 p-3 bg-gray-50 rounded border">{formData.text || 'No question text entered'}</p>
          </div>
          
          <div>
            <Label className="text-sm text-gray-600">Options:</Label>
            <div className="mt-1 space-y-2">
              {options.map((option: string, index: number) => (
                <div 
                  key={index} 
                  className={`p-2 rounded border flex items-center gap-2 ${
                    index === formData.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span>{option || `Option ${index + 1} not entered`}</span>
                  {index === formData.correctAnswer && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-gray-600">Explanation:</Label>
            <p className="mt-1 p-3 bg-blue-50 rounded border">{formData.explanation || 'No explanation entered'}</p>
          </div>
          
          <div className="flex gap-4">
            <Badge variant="outline">{formData.specialty}</Badge>
            <Badge variant="outline">{formData.system}</Badge>
            <Badge variant="outline">{formData.difficulty}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading question editor...</p>
        </div>
      </div>
    );
  }

  const options = Array.isArray(formData.options) ? formData.options : ['', '', '', ''];
  const optionExplanations = Array.isArray(formData.optionExplanations) ? formData.optionExplanations : ['', '', '', ''];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {mode === 'create' ? 'Create New Question' : mode === 'edit' ? 'Edit Question' : 'Review Question'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'create' ? 'Add a new FCPS question to the database' : 
             mode === 'edit' ? 'Update the question details' : 
             'Review and approve/reject the question'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Text */}
          <div>
            <Label htmlFor="question-text">Question Text *</Label>
            <Textarea
              id="question-text"
              placeholder="Enter the question text here..."
              value={formData.text || ''}
              onChange={(e) => setFormData((prev: Partial<QuestionData>) => ({ ...prev, text: e.target.value }))}
              className={`mt-1 min-h-[120px] ${errors.text ? 'border-red-500' : ''}`}
            />
            {errors.text && (
              <p className="text-red-500 text-sm mt-1">{errors.text}</p>
            )}
          </div>

          {/* Specialty and System */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialty">Specialty *</Label>
              <Select
                value={formData.specialty || 'medicine'}
                onValueChange={(value) => handleSpecialtyChange(value as SpecialtyType)}
              >
                <SelectTrigger className={errors.specialty ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="gynae-obs">Gynae & Obs</SelectItem>
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-red-500 text-sm mt-1">{errors.specialty}</p>
              )}
            </div>

            <div>
              <Label htmlFor="system">Medical System *</Label>
              <Select
                value={formData.system || ''}
                onValueChange={(value) => setFormData((prev: Partial<QuestionData>) => ({ ...prev, system: value }))}
              >
                <SelectTrigger className={errors.system ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select medical system" />
                </SelectTrigger>
                <SelectContent>
                  {availableSystems.map((system) => (
                    <SelectItem key={system} value={system}>
                      {system}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.system && (
                <p className="text-red-500 text-sm mt-1">{errors.system}</p>
              )}
            </div>
          </div>

          {/* Difficulty and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty || 'medium'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as DifficultyType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'review' && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'pending'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as QuestionStatusType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Answer Options *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
            </div>
            
            <div className="space-y-4">
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-sm font-medium">
                        Option {String.fromCharCode(65 + index)}
                      </Label>
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === index}
                        onChange={() => setFormData((prev: Partial<QuestionData>) => ({ ...prev, correctAnswer: index }))}
                        className="ml-2"
                      />
                      <Label className="text-sm text-gray-600">Correct Answer</Label>
                      
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <Input
                      placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="mb-2"
                    />
                    
                    <Textarea
                      placeholder={`Optional explanation for option ${String.fromCharCode(65 + index)}`}
                      value={optionExplanations[index] || ''}
                      onChange={(e) => handleOptionExplanationChange(index, e.target.value)}
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {errors.options && (
              <p className="text-red-500 text-sm mt-2">{errors.options}</p>
            )}
            {errors.correctAnswer && (
              <p className="text-red-500 text-sm mt-2">{errors.correctAnswer}</p>
            )}
          </div>

          <Separator />

          {/* Main Explanation */}
          <div>
            <Label htmlFor="explanation">Question Explanation *</Label>
            <Textarea
              id="explanation"
              placeholder="Provide a detailed explanation of the correct answer..."
              value={formData.explanation || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              className={`mt-1 min-h-[100px] ${errors.explanation ? 'border-red-500' : ''}`}
            />
            {errors.explanation && (
              <p className="text-red-500 text-sm mt-1">{errors.explanation}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Question' : mode === 'edit' ? 'Update Question' : 'Save Review'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && renderPreview()}

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the errors above before submitting the question.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default QuestionEditor;