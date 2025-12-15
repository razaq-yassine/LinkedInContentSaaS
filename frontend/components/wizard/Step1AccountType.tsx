"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Step1Props {
  onNext: (accountType: string) => void;
}

export default function Step1AccountType({ onNext }: Step1Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Welcome! Let's get started</h2>
        <p className="text-slate-600">Choose your account type</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => onNext("person")}
        >
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-xl font-bold mb-2">Personal Profile</h3>
          <p className="text-slate-600 mb-4">
            I'm creating content as an individual professional
          </p>
          <Button className="w-full">Select Personal</Button>
        </Card>

        <Card className="p-6 opacity-50 cursor-not-allowed border-2">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="text-xl font-bold mb-2">Business Page</h3>
          <p className="text-slate-600 mb-4">
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


