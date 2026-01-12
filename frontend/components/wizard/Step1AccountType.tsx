"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Building2 } from "lucide-react";

interface Step1Props {
  onNext: (accountType: string) => void;
}

export default function Step1AccountType({ onNext }: Step1Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-1">Welcome! Let's get started</h2>
        <p className="text-slate-600">Choose your account type</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => onNext("person")}
        >
          <div className="mb-3 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <User className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-1">Personal Profile</h3>
          <p className="text-slate-600 text-sm mb-3">
            I'm creating content as an individual professional
          </p>
          <Button className="w-full">Select Personal</Button>
        </Card>

        <Card className="p-4 opacity-50 cursor-not-allowed border-2">
          <div className="mb-3 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-1">Business Page</h3>
          <p className="text-slate-600 text-sm mb-3">
            I'm managing content for a company account
          </p>
          <Button className="w-full" disabled>
            Coming Soon
          </Button>
        </Card>
      </div>
    </div>
  );
}


