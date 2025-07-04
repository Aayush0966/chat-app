import { cn } from "@/lib/utils";

interface ImageSkeletonProps {
  className?: string;
  showCaption?: boolean;
}

const ImageSkeleton = ({ className, showCaption = false }: ImageSkeletonProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative rounded-lg bg-muted/50 animate-pulse overflow-hidden">
        <div className="w-full h-48 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              <span className="text-xs font-medium">Loading image...</span>
            </div>
          </div>
        </div>
      </div>
      {showCaption && (
        <div className="h-4 bg-muted/30 rounded animate-pulse w-3/4"></div>
      )}
    </div>
  );
};

export default ImageSkeleton;
