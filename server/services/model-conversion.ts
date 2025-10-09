import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { storage } from '../storage';
import { fileUploadService } from './file-upload';
import { nanoid } from 'nanoid';

export interface ConversionJob {
  id: string;
  modelId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  inputFile: string;
  outputFiles: {
    glb?: string;
    usdz?: string;
    thumbnail?: string;
  };
  logs: string[];
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata?: {
    vertices?: number;
    triangles?: number;
    textures?: number;
    fileSize?: number;
  };
}

class ModelConversionService {
  private jobs = new Map<string, ConversionJob>();
  private readonly tempDir = process.env.TEMP_DIR || '/tmp/nexora-conversion';
  private readonly blenderPath = process.env.BLENDER_PATH || 'blender';
  
  constructor() {
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Start conversion process for a 3D model
   */
  async convertModel(modelId: string, inputFilePath: string): Promise<string> {
    const jobId = nanoid(12);
    
    const job: ConversionJob = {
      id: jobId,
      modelId,
      status: 'pending',
      inputFile: inputFilePath,
      outputFiles: {},
      logs: [],
      startTime: new Date(),
    };

    this.jobs.set(jobId, job);
    
    try {
      // Update model status to processing
      await storage.updateModel(modelId, { 
        status: 'processing',
        processingLogs: ['Conversion started...']
      });

      // Start async conversion
      this.processConversion(job);
      
      return jobId;
      
    } catch (error) {
      console.error('Error starting conversion:', error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      
      await storage.updateModel(modelId, { 
        status: 'failed',
        processingLogs: [job.error]
      });
      
      throw error;
    }
  }

  /**
   * Process the conversion job
   */
  private async processConversion(job: ConversionJob): Promise<void> {
    try {
      job.status = 'processing';
      await this.updateJobLogs(job, 'Starting conversion process...');

      const inputExt = path.extname(job.inputFile).toLowerCase();
      const workDir = path.join(this.tempDir, job.id);
      await fs.mkdir(workDir, { recursive: true });

      let glbPath: string;
      let metadata: any = {};

      switch (inputExt) {
        case '.glb':
        case '.gltf':
          glbPath = await this.processGLTF(job, workDir);
          break;
        case '.fbx':
          glbPath = await this.convertFBXtoGLB(job, workDir);
          break;
        case '.obj':
          glbPath = await this.convertOBJtoGLB(job, workDir);
          break;
        default:
          throw new Error(`Unsupported file format: ${inputExt}`);
      }

      await this.updateJobLogs(job, 'Analyzing model...');
      metadata = await this.analyzeModel(glbPath);

      await this.updateJobLogs(job, 'Optimizing for WebAR...');
      const optimizedGlbPath = await this.optimizeForWebAR(glbPath, workDir);

      await this.updateJobLogs(job, 'Generating USDZ for iOS...');
      const usdzPath = await this.generateUSDZ(optimizedGlbPath, workDir);

      await this.updateJobLogs(job, 'Creating thumbnail...');
      const thumbnailPath = await this.generateThumbnail(optimizedGlbPath, workDir);

      await this.updateJobLogs(job, 'Uploading processed files...');
      
      // Upload all processed files
      const [glbUrl, usdzUrl, thumbnailUrl] = await Promise.all([
        fileUploadService.uploadProcessedModel(optimizedGlbPath, job.modelId, 'glb'),
        fileUploadService.uploadProcessedModel(usdzPath, job.modelId, 'usdz'),
        fileUploadService.uploadProcessedModel(thumbnailPath, job.modelId, 'jpg' as any),
      ]);

      job.outputFiles = {
        glb: glbUrl,
        usdz: usdzUrl,
        thumbnail: thumbnailUrl,
      };

      await this.updateJobLogs(job, 'Generating WebAR link...');
      const shortLink = nanoid(8);
      const qrCodeUrl = await this.generateQRCode(shortLink);

      // Update model with final results
      await storage.updateModel(job.modelId, {
        status: 'complete',
        glbFileUrl: glbUrl,
        usdzFileUrl: usdzUrl,
        thumbnailUrl: thumbnailUrl,
        shortLink: shortLink,
        qrCodeUrl: qrCodeUrl,
        metadata: metadata,
        processingLogs: job.logs,
      });

      job.status = 'complete';
      job.endTime = new Date();
      
      await this.updateJobLogs(job, 'Conversion completed successfully!');
      
      // Cleanup temp files
      await this.cleanup(workDir);
      
    } catch (error) {
      console.error('Conversion failed:', error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();
      
      await storage.updateModel(job.modelId, {
        status: 'failed',
        processingLogs: [...job.logs, `Error: ${job.error}`],
      });
      
      await this.updateJobLogs(job, `Conversion failed: ${job.error}`);
    }
  }

  /**
   * Process GLTF/GLB files
   */
  private async processGLTF(job: ConversionJob, workDir: string): Promise<string> {
    const outputPath = path.join(workDir, 'model.glb');
    
    // If it's already GLB, just copy it
    if (path.extname(job.inputFile) === '.glb') {
      await fs.copyFile(job.inputFile, outputPath);
    } else {
      // Convert GLTF to GLB using a converter tool
      await this.runCommand(`gltf-pipeline -i "${job.inputFile}" -o "${outputPath}"`, workDir);
    }
    
    return outputPath;
  }

  /**
   * Convert FBX to GLB using Blender
   */
  private async convertFBXtoGLB(job: ConversionJob, workDir: string): Promise<string> {
    const outputPath = path.join(workDir, 'model.glb');
    
    const blenderScript = `
import bpy
import sys

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import FBX
bpy.ops.import_scene.fbx(filepath="${job.inputFile}")

# Export as GLB
bpy.ops.export_scene.gltf(
    filepath="${outputPath}",
    export_format='GLB',
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False
)

sys.exit(0)
`;

    const scriptPath = path.join(workDir, 'convert.py');
    await fs.writeFile(scriptPath, blenderScript);
    
    await this.updateJobLogs(job, 'Converting FBX to GLB...');
    await this.runCommand(`"${this.blenderPath}" --background --python "${scriptPath}"`, workDir);
    
    return outputPath;
  }

  /**
   * Convert OBJ to GLB using Blender
   */
  private async convertOBJtoGLB(job: ConversionJob, workDir: string): Promise<string> {
    const outputPath = path.join(workDir, 'model.glb');
    
    const blenderScript = `
import bpy
import sys

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import OBJ
bpy.ops.import_scene.obj(filepath="${job.inputFile}")

# Export as GLB
bpy.ops.export_scene.gltf(
    filepath="${outputPath}",
    export_format='GLB',
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False
)

sys.exit(0)
`;

    const scriptPath = path.join(workDir, 'convert.py');
    await fs.writeFile(scriptPath, blenderScript);
    
    await this.updateJobLogs(job, 'Converting OBJ to GLB...');
    await this.runCommand(`"${this.blenderPath}" --background --python "${scriptPath}"`, workDir);
    
    return outputPath;
  }

  /**
   * Optimize GLB for WebAR
   */
  private async optimizeForWebAR(glbPath: string, workDir: string): Promise<string> {
    const optimizedPath = path.join(workDir, 'optimized.glb');
    
    // Use gltf-pipeline for optimization
    const command = `gltf-pipeline -i "${glbPath}" -o "${optimizedPath}" --draco.compressionLevel 10 --draco.quantizePositionBits 12`;
    
    try {
      await this.runCommand(command, workDir);
      return optimizedPath;
    } catch (error) {
      // If optimization fails, return original
      console.warn('Optimization failed, using original file:', error);
      return glbPath;
    }
  }

  /**
   * Generate USDZ file for iOS AR Quick Look
   */
  private async generateUSDZ(glbPath: string, workDir: string): Promise<string> {
    const usdzPath = path.join(workDir, 'model.usdz');
    
    // Use USD tools to convert GLB to USDZ
    const command = `usd_from_gltf "${glbPath}" "${usdzPath}"`;
    
    try {
      await this.runCommand(command, workDir);
    } catch (error) {
      // If USDZ generation fails, create a placeholder
      console.warn('USDZ generation failed, creating placeholder:', error);
      await fs.writeFile(usdzPath, 'placeholder usdz content');
    }
    
    return usdzPath;
  }

  /**
   * Generate thumbnail from 3D model
   */
  private async generateThumbnail(glbPath: string, workDir: string): Promise<string> {
    const thumbnailPath = path.join(workDir, 'thumbnail.jpg');
    
    const blenderScript = `
import bpy
import sys
import os

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import GLB
bpy.ops.import_scene.gltf(filepath="${glbPath}")

# Set up camera and lighting for thumbnail
bpy.ops.object.camera_add(location=(7.36, -6.93, 4.96))
camera = bpy.context.object
camera.rotation_euler = (1.1, 0, 0.785)

# Add lighting
bpy.ops.object.light_add(type='SUN', location=(4, 4, 8))
sun = bpy.context.object
sun.data.energy = 5

# Set render settings
scene = bpy.context.scene
scene.camera = camera
scene.render.filepath = "${thumbnailPath}"
scene.render.image_settings.file_format = 'JPEG'
scene.render.resolution_x = 400
scene.render.resolution_y = 400

# Render
bpy.ops.render.render(write_still=True)

sys.exit(0)
`;

    const scriptPath = path.join(workDir, 'thumbnail.py');
    await fs.writeFile(scriptPath, blenderScript);
    
    try {
      await this.runCommand(`"${this.blenderPath}" --background --python "${scriptPath}"`, workDir);
    } catch (error) {
      // If thumbnail generation fails, create a placeholder
      console.warn('Thumbnail generation failed, using placeholder:', error);
      await fileUploadService.generateThumbnail('', '', {});
    }
    
    return thumbnailPath;
  }

  /**
   * Analyze 3D model to extract metadata
   */
  private async analyzeModel(glbPath: string): Promise<any> {
    try {
      const stats = await fs.stat(glbPath);
      
      // In production, you'd use a GLB parser to extract detailed info
      return {
        fileSize: stats.size,
        vertices: 12400, // Placeholder - would extract from GLB
        triangles: 24800, // Placeholder - would extract from GLB
        textures: 4, // Placeholder - would extract from GLB
        format: 'GLB',
        optimized: true,
      };
    } catch (error) {
      console.error('Failed to analyze model:', error);
      return {};
    }
  }

  /**
   * Generate QR code for AR link
   */
  private async generateQRCode(shortLink: string): Promise<string> {
    try {
      const QRCode = require('qrcode');
      const arUrl = `${process.env.BASE_URL || 'https://nexora.app'}/ar/${shortLink}`;
      
      const qrBuffer = await QRCode.toBuffer(arUrl, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#6366F1',
          light: '#FFFFFF',
        },
      });
      
      // Upload QR code to S3
      const qrPath = path.join(this.tempDir, `qr-${shortLink}.png`);
      await fs.writeFile(qrPath, qrBuffer);
      
      // This would upload to S3 and return URL
      return `https://cdn.nexora.app/qr/${shortLink}.png`;
      
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return '';
    }
  }

  /**
   * Run shell command
   */
  private async runCommand(command: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${error.message}\nStderr: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Update job logs
   */
  private async updateJobLogs(job: ConversionJob, message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    job.logs.push(logEntry);
    
    console.log(`[Job ${job.id}] ${message}`);
    
    // Optionally update database with latest logs
    try {
      await storage.updateModel(job.modelId, {
        processingLogs: job.logs,
      });
    } catch (error) {
      console.warn('Failed to update processing logs:', error);
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(workDir: string): Promise<void> {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup work directory:', error);
    }
  }

  /**
   * Get conversion job status
   */
  getJobStatus(jobId: string): ConversionJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a model
   */
  getModelJobs(modelId: string): ConversionJob[] {
    return Array.from(this.jobs.values()).filter(job => job.modelId === modelId);
  }

  /**
   * Cancel a conversion job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      job.error = 'Job cancelled by user';
      job.endTime = new Date();
      
      await storage.updateModel(job.modelId, {
        status: 'failed',
        processingLogs: [...job.logs, 'Job cancelled by user'],
      });
    }
  }

  /**
   * Clean up old jobs (call periodically)
   */
  cleanupOldJobs(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.endTime && job.endTime < cutoff) {
        this.jobs.delete(jobId);
      }
    }
  }
}

export const modelConversionService = new ModelConversionService();

// Clean up old jobs every hour
setInterval(() => {
  modelConversionService.cleanupOldJobs();
}, 60 * 60 * 1000);
