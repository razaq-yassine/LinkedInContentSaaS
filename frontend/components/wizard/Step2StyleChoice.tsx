"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, PenLine } from "lucide-react";

interface Step2Props {
  onNext: (styleChoice: string) => void;
  onBack: () => void;
}

export default function Step2StyleChoice({ onNext, onBack }: Step2Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-1">Choose Your Writing Style</h2>
        <p className="text-slate-600">How would you like your posts to sound?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => onNext("top_creators")}
        >
          <div className="mb-2 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-1">Top Creators Format</h3>
          <p className="text-slate-600 text-sm mb-2">
            Use proven formats from top LinkedIn creators:
          </p>
          <ul className="text-sm text-slate-600 space-y-1 mb-3">
            <li>✓ Hook → Context → Insight → Takeaway</li>
            <li>✓ Single-line formatting</li>
            <li>✓ Data-driven content</li>
            <li>✓ Mobile-optimized</li>
          </ul>
          <Button className="w-full">Use Top Creator Format</Button>
        </Card>

        <Card
          className="p-4 relative opacity-60 cursor-not-allowed border-2 border-slate-200"
        >
          <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <div className="mb-2 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <PenLine className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-1">My Personal Style</h3>
          <p className="text-slate-600 text-sm mb-2">
            AI learns from your existing posts to match your voice:
          </p>
          <ul className="text-sm text-slate-600 space-y-1 mb-3">
            <li>✓ Analyzes your writing patterns</li>
            <li>✓ Matches your tone & voice</li>
            <li>✓ Preserves your uniqueness</li>
            <li>✓ Requires 10 sample posts</li>
          </ul>
          <Button className="w-full" variant="outline" disabled>
            Coming Very Soon
          </Button>
        </Card>
      </div>

      <Button variant="outline" onClick={onBack}>
        ← Back
      </Button>
    </div>
  );
}


