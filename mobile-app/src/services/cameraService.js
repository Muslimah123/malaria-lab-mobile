import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

class CameraService {
    constructor() {
        this.uploadQueue = [];
        this.isProcessing = false;
    }

    /**
     * Request camera and media library permissions
     */
    async requestPermissions() {
        try {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            const mediaPermission = await MediaLibrary.requestPermissionsAsync();
            
            return {
                camera: cameraPermission.status === 'granted',
                media: mediaPermission.status === 'granted'
            };
        } catch (error) {
            console.error('Permission request failed:', error);
            return { camera: false, media: false };
        }
    }

    /**
     * Take a photo using the camera
     */
    async takePhoto(options = {}) {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1.0, // Full quality - no compression
                base64: false,
                ...options
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                return await this.processImage(asset.uri, 'camera');
            }

            return null;
        } catch (error) {
            console.error('Camera capture failed:', error);
            throw new Error('Failed to capture image');
        }
    }

    /**
     * Select image from gallery
     */
    async selectFromGallery(options = {}) {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1.0, // Full quality - no compression
                base64: false,
                allowsMultipleSelection: true,
                ...options
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const processedImages = [];
                
                for (const asset of result.assets) {
                    const processed = await this.processImage(asset.uri, 'gallery');
                    if (processed) {
                        processedImages.push(processed);
                    }
                }

                return processedImages;
            }

            return [];
        } catch (error) {
            console.error('Gallery selection failed:', error);
            throw new Error('Failed to select images from gallery');
        }
    }

    /**
     * Process captured/selected image - Generate thumbnail for UI, keep original for upload
     */
    async processImage(uri, source) {
        try {
            // Get file info
            const fileInfo = await FileSystem.getInfoAsync(uri);
            
            // Validate file size
            if (fileInfo.size > 100 * 1024 * 1024) { // 100MB limit for high-res images
                throw new Error('Image file too large (maximum 100MB)');
            }

            // Generate thumbnail for UI display
            const thumbnail = await this.generateThumbnail(uri);
            
            // Generate unique filename
            const filename = this.generateFilename(source);
            
            // Get image metadata
            const metadata = await this.getImageMetadata(uri);
            
            return {
                uri: uri, // Original image URI for upload
                thumbnail: thumbnail, // Thumbnail URI for UI display
                filename,
                size: fileInfo.size,
                width: metadata.width,
                height: metadata.height,
                source,
                timestamp: new Date().toISOString(),
                metadata
            };
        } catch (error) {
            console.error('Image processing failed:', error);
            throw error;
        }
    }

    /**
     * Generate thumbnail for UI display (doesn't affect original image)
     */
    async generateThumbnail(uri) {
        try {
            // Create a small thumbnail for UI display only
            const result = await manipulateAsync(
                uri,
                [
                    { resize: { width: 200, height: 150 } } // Small thumbnail size
                ],
                {
                    compress: 0.8,
                    format: SaveFormat.JPEG
                }
            );
            
            return result.uri;
        } catch (error) {
            console.error('Thumbnail generation failed:', error);
            // Return original URI if thumbnail generation fails
            return uri;
        }
    }

    /**
     * Get image metadata
     */
    async getImageMetadata(uri) {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
                base64: false
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                return {
                    width: asset.width,
                    height: asset.height,
                    type: asset.type,
                    exif: asset.exif
                };
            }

            return { width: 0, height: 0, type: 'image/jpeg' };
        } catch (error) {
            console.error('Metadata extraction failed:', error);
            return { width: 0, height: 0, type: 'image/jpeg' };
        }
    }

    /**
     * Generate unique filename
     */
    generateFilename(source) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = Math.random().toString(36).substring(2, 8);
        return `${source}_${timestamp}_${random}.jpg`;
    }

    /**
     * Validate image quality (basic client-side validation)
     */
    validateImageQuality(imageData) {
        const errors = [];
        const warnings = [];

        // Check file size
        if (imageData.size > 100 * 1024 * 1024) {
            errors.push('File size exceeds 100MB limit');
        }

        // Check minimum size
        if (imageData.size < 1024) {
            errors.push('File size too small (minimum 1KB)');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Add image to upload queue
     */
    addToUploadQueue(imageData) {
        this.uploadQueue.push({
            ...imageData,
            id: Date.now() + Math.random(),
            status: 'pending',
            progress: 0
        });
    }

    /**
     * Remove image from upload queue
     */
    removeFromQueue(imageId) {
        this.uploadQueue = this.uploadQueue.filter(img => img.id !== imageId);
    }

    /**
     * Get upload queue
     */
    getUploadQueue() {
        return this.uploadQueue;
    }

    /**
     * Clear upload queue
     */
    clearUploadQueue() {
        this.uploadQueue = [];
    }

    /**
     * Update upload progress
     */
    updateProgress(imageId, progress) {
        const image = this.uploadQueue.find(img => img.id === imageId);
        if (image) {
            image.progress = progress;
        }
    }

    /**
     * Update upload status
     */
    updateStatus(imageId, status) {
        const image = this.uploadQueue.find(img => img.id === imageId);
        if (image) {
            image.status = status;
        }
    }

    /**
     * Clean up temporary files
     */
    async cleanupTempFiles() {
        try {
            for (const image of this.uploadQueue) {
                if (image.uri && image.uri.startsWith('file://')) {
                    try {
                        await FileSystem.deleteAsync(image.uri);
                    } catch (error) {
                        console.warn('Failed to delete temp file:', error);
                    }
                }
                // Clean up thumbnail if it's different from original
                if (image.thumbnail && image.thumbnail !== image.uri && image.thumbnail.startsWith('file://')) {
                    try {
                        await FileSystem.deleteAsync(image.thumbnail);
                    } catch (error) {
                        console.warn('Failed to delete thumbnail:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }

    /**
     * Get camera settings
     */
    getCameraSettings() {
        return {
            maxFileSize: 100 * 1024 * 1024, // 100MB
            allowedFormats: ['jpg', 'jpeg', 'png', 'tiff', 'tif'],
            quality: 1.0, // Full quality
            noCompression: true,
            thumbnailSize: { width: 200, height: 150 } // UI display size
        };
    }
}

export default new CameraService();
