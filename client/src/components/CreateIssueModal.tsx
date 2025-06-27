import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const createIssueSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description too long'),
  category: z.string().min(1, 'Please select a category'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string().min(1, 'Location is required'),
  wardNumber: z.string().min(1, 'Ward number is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  isAnonymous: z.boolean().default(false),
});

type CreateIssueFormData = z.infer<typeof createIssueSchema>;

interface CreateIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateIssueFormData, files: FileList | null) => Promise<void>;
}

export default function CreateIssueModal({ open, onOpenChange, onSubmit }: CreateIssueModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);

  const form = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      severity: 'medium',
      location: '',
      wardNumber: 'Ward 184',
      district: 'Bangalore Urban',
      state: 'Karnataka',
      isAnonymous: false,
    },
  });

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd use reverse geocoding to get the actual address
          form.setValue('location', 'Koramangala Ward 5, Bangalore');
          setLocationDetected(true);
        },
        (error) => {
          console.error('Error detecting location:', error);
        }
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleSubmit = async (data: CreateIssueFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data, selectedFiles);
      form.reset();
      setSelectedFiles(null);
      setLocationDetected(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span>Report New Issue</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Brief description of the issue"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="roads">Roads</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="waste">Waste Management</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Provide detailed information about the issue, when it started, and how it affects the community..."
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter location or detect automatically"
                        className="flex-1"
                        readOnly={locationDetected}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={detectLocation}
                      className="flex items-center space-x-1"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Detect</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Severity */}
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="low" />
                        <Label htmlFor="low">Low</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high">High</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="critical" id="critical" />
                        <Label htmlFor="critical">Critical</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div>
              <Label htmlFor="media">Upload Evidence</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop images/videos or click to browse
                </p>
                <input
                  id="media"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('media')?.click()}
                >
                  Choose Files
                </Button>
                {selectedFiles && selectedFiles.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {selectedFiles.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* Guidelines */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Reporting Guidelines:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Provide accurate and truthful information</li>
                  <li>Include clear photos/videos if possible</li>
                  <li>Report issues affecting public interest</li>
                  <li>Your identity is verified but can be kept anonymous for sensitive issues</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Anonymous Reporting */}
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Report anonymously (for sensitive issues)
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Issue'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
