import { Card } from "@/components/ui/card";
import { MessageSquare, Sparkles, Clock } from "lucide-react";

export default function CommentsPage() {
  return (
    <div className="min-h-screen bg-[#F3F2F0] flex items-center justify-center px-4 py-8">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center bg-white">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-[#E7F3FF] rounded-full flex items-center justify-center">
              <MessageSquare className="w-12 h-12 text-[#0A66C2]" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#0A66C2] rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
          Comments Generator
        </h1>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF4E6] rounded-full mb-6">
          <Clock className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-sm font-semibold text-[#F59E0B]">Coming Soon</span>
        </div>

        <p className="text-lg text-[#666666] mb-6 leading-relaxed">
          We're building an intelligent comment generator that will evaluate LinkedIn posts 
          and help you craft meaningful, engaging comments that boost your visibility.
        </p>

        <div className="bg-[#F3F2F0] rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-black mb-4">What to expect:</h2>
          <ul className="space-y-3 text-left">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#0A66C2] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <span className="text-[#666666]">
                Evaluate post worthiness and engagement potential
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#0A66C2] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <span className="text-[#666666]">
                Generate contextual comments aligned with your expertise
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#0A66C2] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <span className="text-[#666666]">
                Maximize engagement with value-adding responses
              </span>
            </li>
          </ul>
        </div>

        <p className="text-sm text-[#999999] mt-8">
          Stay tuned for updates. We'll notify you when this feature launches!
        </p>
      </Card>
    </div>
  );
}


