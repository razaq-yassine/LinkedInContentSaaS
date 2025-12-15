"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Step2Props {
  onNext: (styleChoice: string) => void;
  onBack: () => void;
}

export default function Step2StyleChoice({ onNext, onBack }: Step2Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Writing Style</h2>
        <p className="text-slate-600">How would you like your posts to sound?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => onNext("top_creators")}
        >
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-bold mb-2">Top Creators Format</h3>
          <p className="text-slate-600 mb-4">
            Use proven formats from top LinkedIn creators:
          </p>
          <ul className="text-sm text-slate-600 space-y-2 mb-4">
            <li>✓ Hook → Context → Insight → Takeaway</li>
            <li>✓ Single-line formatting</li>
            <li>✓ Data-driven content</li>
            <li>✓ Mobile-optimized</li>
          </ul>
          <Button className="w-full">Use Top Creator Format</Button>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => onNext("my_style")}
        >
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-xl font-bold mb-2">My Personal Style</h3>
          <p className="text-slate-600 mb-4">
            AI learns from your existing posts to match your voice:
          </p>
          <ul className="text-sm text-slate-600 space-y-2 mb-4">
            <li>✓ Analyzes your writing patterns</li>
            <li>✓ Matches your tone & voice</li>
            <li>✓ Preserves your uniqueness</li>
            <li>✓ Requires 10 sample posts</li>
          </ul>
          <Button className="w-full" variant="outline">
            Use My Style
          </Button>
        </Card>
      </div>

      <Button variant="outline" onClick={onBack}>
        ← Back
      </Button>
    </div>
  );
}


