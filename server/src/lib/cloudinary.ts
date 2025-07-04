import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

interface CloudinaryConfig {
    cloud_name: string;
    api_key: string;
    api_secret: string;
}

interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    // Add other properties as needed
}

class CloudinaryService {
    constructor() {
        this.initializeCloudinary();
    }

    private initializeCloudinary(): void {
        const config: CloudinaryConfig = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
            api_key: process.env.CLOUDINARY_API_KEY || '',
            api_secret: process.env.CLOUDINARY_API_SECRET || '',
        };

        if (!config.cloud_name || !config.api_key || !config.api_secret) {
            throw new Error('Missing Cloudinary configuration');
        }

        cloudinary.config(config);
    }

    async uploadImage(imagePath: string, publicId?: string): Promise<string> {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error('Image file not found');
            }

            const uploadResult = await cloudinary.uploader.upload(imagePath, {
                public_id: publicId,
                resource_type: 'auto',
                folder: 'chat-app',
            });
            
            if (!uploadResult?.secure_url) {
                throw new Error('Failed to get secure URL from Cloudinary');
            }

            console.log('Cloudinary upload successful:', uploadResult.secure_url);
            return uploadResult.secure_url;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Failed to upload image to Cloudinary');
        }
    }

    getOptimizedUrl(publicId: string): string {
        return cloudinary.url(publicId, {
            fetch_format: 'auto',
            quality: 'auto',
        });
    }

    getTransformedUrl(publicId: string, width: number, height: number): string {
        return cloudinary.url(publicId, {
            crop: 'auto',
            gravity: 'auto',
            width,
            height,
        });
    }
}

export const cloudinaryService = new CloudinaryService();