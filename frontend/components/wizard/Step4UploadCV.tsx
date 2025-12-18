"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
      
      if (!validTypes.includes(droppedFile.type)) {
        alert("Please upload a PDF or image file (JPG, PNG, WebP)");
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
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
      
      if (!validTypes.includes(selectedFile.type)) {
        alert("Please upload a PDF or image file (JPG, PNG, WebP)");
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
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Upload Your CV/Resume</h2>
        <p className="text-slate-600">
          We'll analyze your experience to create your professional profile
        </p>
      </div>

      <Card className="p-8 w-full">
        <Label htmlFor="cv-upload" className="cursor-pointer block w-full">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
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
                <div className="text-6xl mb-4">
                  {file.type.startsWith("image/") ? "🖼️" : "📄"}
                </div>
                <p className="text-lg font-medium mb-2">{file.name}</p>
                <p className="text-sm text-slate-500 mb-4">
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
                <div className="text-6xl mb-4">📤</div>
                <p className="text-lg font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  Upload your CV/Resume
                </p>
                <p className="text-xs text-slate-400 mt-4">
                  PDF or Images (JPG, PNG, WebP) • Max 10MB
                </p>
              </div>
            )}
          </div>
        </Label>
        <Input
          id="cv-upload"
          type="file"
          accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What we'll extract:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your professional experience and skills</li>
            <li>• Industry expertise and specializations</li>
            <li>• Career achievements and milestones</li>
            <li>• Content themes relevant to your background</li>
          </ul>
        </div>
      </Card>

      <div className="flex justify-between mt-6">
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

