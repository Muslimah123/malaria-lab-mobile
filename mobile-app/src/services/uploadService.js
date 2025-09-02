import { API_BASE_URL, TIMEOUT } from '../config/api';

class UploadService {
    constructor() {
        // Use simple config
        this.baseURL = API_BASE_URL;
        this.timeout = TIMEOUT;
    }

    /**
     * Upload images to Flask API without preprocessing
     * Images are sent as-is for direct model inference
     */
    async uploadImages(images, testData) {
        try {
            const formData = new FormData();
            
            // Add test data
            if (testData) {
                formData.append('testData', JSON.stringify(testData));
            }
            
            // Add images as-is (no preprocessing)
            images.forEach((image, index) => {
                // Create file object from original image URI
                const imageFile = {
                    uri: image.uri,
                    type: 'image/jpeg', // Default type
                    name: image.filename,
                };
                
                formData.append('images', imageFile);
            });

            const response = await fetch(`${this.baseURL}/upload/images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();
            return {
                success: true,
                data: result,
                message: 'Images uploaded successfully'
            };

        } catch (error) {
            console.error('Upload failed:', error);
            return {
                success: false,
                error: error.message || 'Upload failed',
                message: 'Failed to upload images'
            };
        }
    }

    /**
     * Upload single image
     */
    async uploadSingleImage(image, testData) {
        return this.uploadImages([image], testData);
    }

    /**
     * Get upload progress (for future implementation)
     */
    async getUploadProgress(uploadId) {
        try {
            const response = await api.get(`/upload/progress/${uploadId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get upload progress:', error);
            return null;
        }
    }

    /**
     * Cancel upload
     */
    async cancelUpload(uploadId) {
        try {
            const response = await api.post(`/upload/cancel/${uploadId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to cancel upload:', error);
            return false;
        }
    }

    /**
     * Get upload history
     */
    async getUploadHistory(page = 1, limit = 20) {
        try {
            const response = await api.get(`/upload/history?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get upload history:', error);
            return [];
        }
    }

    /**
     * Get auth token from storage
     */
    getAuthToken() {
        // This should get the token from your auth storage
        // Implementation depends on your auth system
        return null; // Placeholder
    }

    /**
     * Validate upload before sending
     */
    validateUpload(images, testData) {
        const errors = [];
        const warnings = [];

        // Check if images are provided
        if (!images || images.length === 0) {
            errors.push('No images selected for upload');
        }

        // Check image count limit
        if (images && images.length > 20) {
            errors.push('Maximum 20 images allowed per upload');
        }

        // Check individual image sizes
        images?.forEach((image, index) => {
            if (image.size > 100 * 1024 * 1024) { // 100MB limit
                errors.push(`Image ${index + 1}: File size exceeds 100MB limit`);
            }
            
            if (image.size < 1024) { // 1KB minimum
                errors.push(`Image ${index + 1}: File size too small (minimum 1KB)`);
            }
        });

        // Check test data
        if (!testData) {
            warnings.push('No test data provided');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Prepare upload data
     */
    prepareUploadData(images, testData) {
        return {
            images: images.map(img => ({
                filename: img.filename,
                size: img.size,
                width: img.width,
                height: img.height,
                source: img.source,
                timestamp: img.timestamp
            })),
            testData: testData || {},
            uploadTimestamp: new Date().toISOString(),
            totalSize: images.reduce((sum, img) => sum + img.size, 0),
            imageCount: images.length
        };
    }
}

export default new UploadService();
