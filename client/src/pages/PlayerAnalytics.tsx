import { useQuery } from "@tanstack/react-query";
import { AdvancedPlayerDashboard } from "../components/AdvancedPlayerDashboard"; // Relative path
import { Button } from "../components/ui/button"; // Relative path
import { Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "../hooks/use-toast"; // Relative path
import { useState } from "react";
import { format } from "date-fns"; // Added missing import

export default function PlayerAnalytics() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const shareAsImage = async () => {
    let originalWidth = '';
    try {
      setIsExporting(true);
      const element = document.getElementById('analytics-content');
      if (!element) return;

      // Save original width and get computed height
      originalWidth = element.style.width;
      const height = element.getBoundingClientRect().height;

      // Set export width
      element.style.width = '1200px';
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 1200, // Standard width
        height: Math.ceil(height),
        windowWidth: 1200,
        windowHeight: Math.ceil(height),
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('analytics-content');
          if (clonedElement) {
            clonedElement.style.width = '1200px';
            clonedElement.style.height = `${height}px`;
            clonedElement.style.position = 'relative';
          }
        }
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `volleyball-analytics-${format(new Date(), 'yyyy-MM-dd')}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast({
            title: "Analytics report downloaded successfully",
            variant: "success",
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error creating image:', error);
      toast({
        title: "Error exporting image",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Restore original width and reset export state
      const element = document.getElementById('analytics-content');
      if (element) {
        element.style.width = originalWidth;
      }
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Player Analytics</h1>
          <p className="text-muted-foreground">Compare player performance across multiple metrics</p>
        </div>
        <Button onClick={shareAsImage} variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Export as Image
        </Button>
      </div>

      <div id="analytics-content" className="w-full">
        <AdvancedPlayerDashboard />
      </div>
    </div>
  );
}