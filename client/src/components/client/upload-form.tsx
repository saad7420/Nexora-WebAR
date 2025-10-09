import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { FileUpload } from "@/components/ui/file-upload";
import { ModelViewer } from "@/components/ui/model-viewer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  Eye, 
  Wand2, 
  Settings,
  Tag,
  DollarSign
} from "lucide-react";
import type { Workspace } from "@shared/schema";

interface UploadFormProps {
  workspaces: Workspace[];
  onSuccess?: (modelId: string) => void;
}

const allergenOptions = [
  'Gluten', 'Dairy', 'Nuts', 'Peanuts', 'Shellfish', 'Fish', 'Soy', 'Eggs'
];

const categoryOptions = [
  'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad', 'Soup', 'Side Dish'
];

export function UploadForm({ workspaces, onSuccess }: UploadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]?.id || '');
  const [selectedProject, setSelectedProject] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    allergenTags: [] as string[],
    autoOptimize: true,
    transparentBackground: true,
    scale: [1],
    rotationY: [0],
    environment: 'studio'
  });

  // Get projects for selected workspace
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/workspaces', selectedWorkspace, 'projects'],
    queryFn: async () => {
      if (!selectedWorkspace) return [];
      const response = await fetch(`/api/workspaces/${selectedWorkspace}/projects`, {
        credentials: 'include'
      });
      return response.json();
    },
    enabled: !!selectedWorkspace
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/models/upload', data);
      return response.json();
    },
    onSuccess: (model) => {
      toast({
        title: "Upload successful!",
        description: "Your 3D model is being processed and will be ready soon.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      onSuccess?.(model.id);
      // Reset form
      setUploadedFiles([]);
      setPreviewUrl(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        allergenTags: [],
        autoOptimize: true,
        transparentBackground: true,
        scale: [1],
        rotationY: [0],
        environment: 'studio'
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload model. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
    if (files[0]) {
      // Create preview URL for the file
      const url = URL.createObjectURL(files[0]);
      setPreviewUrl(url);
      
      // Auto-fill name from filename if empty
      if (!formData.name && files[0].name) {
        const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, name: nameWithoutExt }));
      }
    }
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergenTags: prev.allergenTags.includes(allergen)
        ? prev.allergenTags.filter(tag => tag !== allergen)
        : [...prev.allergenTags, allergen]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFiles[0]) {
      toast({
        title: "No file selected",
        description: "Please upload a 3D model file.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedProject) {
      toast({
        title: "No project selected",
        description: "Please select a project for your model.",
        variant: "destructive"
      });
      return;
    }

    const data = new FormData();
    data.append('model', uploadedFiles[0]);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('projectId', selectedProject);
    data.append('allergenTags', JSON.stringify(formData.allergenTags));
    data.append('arSettings', JSON.stringify({
      scale: formData.scale[0],
      rotationY: formData.rotationY[0],
      environment: formData.environment,
      transparentBackground: formData.transparentBackground
    }));

    uploadMutation.mutate(data);
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="upload-form">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload 3D Model</h2>
        <p className="text-muted-foreground">
          Transform your 3D models into interactive WebAR experiences
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Selection</CardTitle>
              <CardDescription>Choose where to add your 3D model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workspace">Workspace</Label>
                <select
                  id="workspace"
                  value={selectedWorkspace}
                  onChange={(e) => {
                    setSelectedWorkspace(e.target.value);
                    setSelectedProject('');
                  }}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg mt-2"
                  data-testid="select-workspace"
                >
                  <option value="">Select workspace...</option>
                  {workspaces.map(workspace => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedWorkspace && (
                <div>
                  <Label htmlFor="project">Project</Label>
                  <select
                    id="project"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg mt-2"
                    data-testid="select-project"
                  >
                    <option value="">Select project...</option>
                    {projects.map((project: any) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                3D Model File
              </CardTitle>
              <CardDescription>Upload your 3D model file</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onUpload={handleFileUpload} />
            </CardContent>
          </Card>

          {/* Model Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Model Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Margherita Pizza"
                    className="mt-2"
                    data-testid="input-model-name"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="14.99"
                      className="pl-10"
                      data-testid="input-model-price"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the dish..."
                  className="mt-2"
                  rows={3}
                  data-testid="textarea-model-description"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg mt-2"
                  data-testid="select-model-category"
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Allergen Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allergenOptions.map(allergen => (
                    <Badge
                      key={allergen}
                      variant={formData.allergenTags.includes(allergen) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => toggleAllergen(allergen)}
                      data-testid={`allergen-${allergen.toLowerCase()}`}
                    >
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AR Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                AR Configuration
              </CardTitle>
              <CardDescription>Customize how your model appears in AR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Scale: {formData.scale[0]}x</Label>
                <Slider
                  value={formData.scale}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scale: value }))}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="mt-3"
                  data-testid="slider-model-scale"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0.5x</span>
                  <span>1x (Normal)</span>
                  <span>2x</span>
                </div>
              </div>

              <div>
                <Label>Initial Rotation: {formData.rotationY[0]}°</Label>
                <Slider
                  value={formData.rotationY}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, rotationY: value }))}
                  min={0}
                  max={360}
                  step={15}
                  className="mt-3"
                  data-testid="slider-model-rotation"
                />
              </div>

              <div>
                <Label htmlFor="environment">Environment</Label>
                <select
                  id="environment"
                  value={formData.environment}
                  onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg mt-2"
                  data-testid="select-model-environment"
                >
                  <option value="studio">Studio (Default)</option>
                  <option value="neutral">Neutral</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="outdoor">Outdoor</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="transparent-bg">Transparent Background</Label>
                    <p className="text-sm text-muted-foreground">Use transparent background in AR mode</p>
                  </div>
                  <Switch
                    id="transparent-bg"
                    checked={formData.transparentBackground}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, transparentBackground: checked }))}
                    data-testid="switch-transparent-bg"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-optimize">Auto-optimize</Label>
                    <p className="text-sm text-muted-foreground">Compress textures and reduce polycount</p>
                  </div>
                  <Switch
                    id="auto-optimize"
                    checked={formData.autoOptimize}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoOptimize: checked }))}
                    data-testid="switch-auto-optimize"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          {/* 3D Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Preview
              </CardTitle>
              <CardDescription>Preview how your model will appear</CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <ModelViewer
                  src={previewUrl}
                  name={formData.name}
                  description={formData.description}
                  price={formData.price ? `$${formData.price}` : undefined}
                  className="w-full"
                />
              ) : (
                <div className="aspect-square bg-secondary rounded-xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground">Upload a 3D model to see preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="space-y-3">
            <Button 
              className="w-full btn-primary" 
              size="lg"
              onClick={handleSubmit}
              disabled={isUploading || !uploadedFiles[0] || !selectedProject || !formData.name}
              data-testid="button-generate-webAR"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate WebAR Experience
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              disabled={isUploading}
              data-testid="button-preview-model"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Model
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
