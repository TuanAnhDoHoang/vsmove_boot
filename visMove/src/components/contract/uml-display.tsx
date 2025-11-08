"use client";

import { useEffect, useState } from 'react';
import { Code, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface UMLDisplayProps {
  umlString: string;
  functionName: string;
}
export default function UMLDisplay({ umlString, functionName }: UMLDisplayProps) {
  const [umlImage, setUmlImage] = useState<string | null>(null);
  const [viewUMLCode, setViewUMLCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    let imageUrl: string | null = null;

    const convertUmlToImage = async () => {
      const umlContent = umlString; // Sử dụng umlString nếu có, nếu không thì dùng uml_string
      if (!umlContent) return;

      setIsLoading(true);
      try {
        const response = await axios.post(
          "https://vis-move-server.vercel.app/generate_uml",
          { uml_text: umlString }, // Send uml_text in request body
          { responseType: 'arraybuffer' } // Configure responseType in axios config
        );

        const blob = new Blob([response.data], { type: 'image/png' });
        imageUrl = URL.createObjectURL(blob);

        // const fileName = "/tmp/anhdoo.png";
        // const a = document.createElement('a');
        // a.href = imageUrl;
        // a.download = fileName;                   // <-- name of the saved file
        // document.body.appendChild(a);
        // a.click();

        // // 5. Clean up
        // document.body.removeChild(a);
        // window.URL.revokeObjectURL(imageUrl);

        // console.log('Download started:', fileName);


        setUmlImage(imageUrl);
      } catch (err) {
        console.error('Error generating UML image:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to generate UML diagram image.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    convertUmlToImage();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [umlString, toast]);

  const handleCopyToClipboard = () => {
    const umlContent = umlString;
    navigator.clipboard.writeText(umlContent).then(() => {
      toast({
        title: 'Copied to Clipboard',
        description: 'UML diagram code has been copied.',
      });
    }).catch(err => {
      console.error('Failed to copy text:', err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy UML code to clipboard.',
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl">UML Sequence Diagram</CardTitle>
            <CardDescription>Visual representation of the '{functionName}' function flow.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy UML</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-center">Loading UML diagram...</div>
        )}
        {!isLoading && !viewUMLCode && umlImage && (
          <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 font-code text-sm overflow-x-auto min-h-30">
            <img src={umlImage} alt="UML Diagram" className="max-w-full m-auto" />
            <Button variant="outline" size="icon" onClick={() => setViewUMLCode(true)}>
              <Code className="h-4 w-4" />
              <span className="sr-only">View code</span>
            </Button>
          </div>
        )}
        {!isLoading && viewUMLCode && (umlString) && (
          <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 font-code text-sm overflow-x-auto">
            <pre><code>{umlString}</code></pre>
            <Button variant="outline" size="icon" onClick={() => setViewUMLCode(false)}>
              <Code className="h-4 w-4" />
              <span className="sr-only">View image</span>
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">You can render this diagram using an online tool like PlantUML.</p>
      </CardContent>
    </Card>
  );
}