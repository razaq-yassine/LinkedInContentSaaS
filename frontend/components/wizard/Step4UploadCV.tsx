"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle2 } from "lucide-react";

interface Step4Props {
  onNext: (file: File) => void;
  onBack: () => void;
}

export default function Step4UploadCV({ onNext, onBack }: Step4Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile.type !== "application/pdf") {
        alert("Please upload a PDF file only");
        return;
      }
      
      if (droppedFile.size > MAX_FILE_SIZE) {
        alert("File size exceeds 10MB limit. Please upload a smaller file.");
        return;
      }
      
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.type !== "application/pdf") {
        alert("Please upload a PDF file only");
        return;
      }
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert("File size exceeds 10MB limit. Please upload a smaller file.");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleNext = () => {
    if (!file) {
      alert("Please upload your CV/Resume");
      return;
    }
    onNext(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-1">Upload Your CV/Resume</h2>
        <p className="text-slate-600">
          We'll analyze your experience to create your professional profile
        </p>
      </div>

      <Card className="p-4 w-full">
        <Label htmlFor="cv-upload" className="cursor-pointer block w-full">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div onClick={(e) => e.preventDefault()}>
                <div className="mb-3 w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
                <p className="text-base font-medium mb-1">{file.name}</p>
                <p className="text-sm text-slate-500 mb-2">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-3 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mx-auto">
                  <Upload className="h-7 w-7 text-white" />
                </div>
                <p className="text-base font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500 mb-2">
                  Upload your CV/Resume
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  PDF format only • Max 10MB
                </p>
              </div>
            )}
          </div>
        </Label>
        <Input
          id="cv-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1 text-sm">What we'll extract:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your professional experience and skills</li>
            <li>• Industry expertise and specializations</li>
            <li>• Career achievements and milestones</li>
            <li>• Content themes relevant to your background</li>
          </ul>
        </div>
      </Card>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={!file}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

