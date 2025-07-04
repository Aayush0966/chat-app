import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
    Upload,
    X,
    Image as ImageIcon,
    Send,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (file: File) => Promise<void>; // Remove caption parameter
    maxSize?: number; // in MB (default: 5MB to match server limit)
    acceptedFormats?: string[];
}

const ImageUpload = ({
    isOpen,
    onClose,
    onSend,
    maxSize = 5, // Match server's 5MB limit
    acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}: ImageUploadProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setSelectedFile(null);
        setPreview(null);
        setIsUploading(false);
        setUploadProgress(0);
        setError(null);
        setIsDragOver(false);
    };

    const handleClose = () => {
        if (!isUploading) {
            resetState();
            onClose();
        }
    };

    const validateFile = (file: File): string | null => {
        if (!acceptedFormats.includes(file.type)) {
            return `Invalid file format. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
        }

        if (file.size > maxSize * 1024 * 1024) {
            return `File size too large. Maximum size: ${maxSize}MB`;
        }

        return null;
    };

    const handleFileSelect = (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleSend = async () => {
        if (!selectedFile || isUploading) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 100);

            await onSend(selectedFile);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Small delay to show completion
            setTimeout(() => {
                resetState();
                onClose();
            }, 500);

        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to send image');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Send Image
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {!selectedFile ? (
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                                isDragOver
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50 hover:bg-accent/5"
                            )}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={triggerFileInput}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-3 rounded-full bg-primary/10">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Drop your image here</p>
                                    <p className="text-sm text-muted-foreground">
                                        or click to browse
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Supports: JPEG, PNG, GIF, WebP (max {maxSize}MB)
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <img
                                    src={preview!}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg border"
                                />
                                {!isUploading && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPreview(null);
                                            setError(null);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {isUploading && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Uploading...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={!selectedFile || isUploading}
                        className="min-w-[100px]"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Send
                            </>
                        )}
                    </Button>
                </DialogFooter>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFormats.join(',')}
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </DialogContent>
        </Dialog>
    );
};

export default ImageUpload;
