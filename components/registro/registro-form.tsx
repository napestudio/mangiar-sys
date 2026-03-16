"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Stepper } from "@/components/ui/stepper";
import { Step1 } from "./step-1";
import { Step2 } from "./step-2";
import { checkSlugAvailability, registerRestaurant } from "@/actions/registro";
import { generateSlug } from "@/lib/slug-utils";
import type { Step1Data, Step2Data } from "@/lib/validations/registro";
import type { SlugState } from "./step-1";

const STEPS = [
  { title: "Tu negocio", description: "Nombre y acceso" },
  { title: "Detalles", description: "Tipo y responsable" },
];

const INITIAL_STEP1: Step1Data = {
  businessName: "",
  phone: "",
  contactEmail: "",
  password: "",
};

const INITIAL_STEP2: Step2Data = {
  personName: "",
  restaurantType: "RESTAURANT",
  promoCode: "",
};

export function RegistroForm() {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data>(INITIAL_STEP1);
  const [step2Data, setStep2Data] = useState<Step2Data>(INITIAL_STEP2);
  const [slugState, setSlugState] = useState<SlugState>({
    slug: "",
    available: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced slug availability check
  useEffect(() => {
    const name = step1Data.businessName;
    const slug = generateSlug(name);

    if (slug.length < 2) {
      setSlugState({ slug, available: null });
      return;
    }

    // Show "checking" state immediately
    setSlugState((prev) => ({ ...prev, slug, available: null }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const result = await checkSlugAvailability(name);
      if (result.success) {
        setSlugState({ slug: result.data.slug, available: result.data.available });
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [step1Data.businessName]);

  function handleStep1Next(data: Step1Data) {
    setStep1Data(data);
    setStep(2);
    setError(null);
  }

  function handleSubmit(data: Step2Data) {
    setStep2Data(data);
    setError(null);

    startTransition(async () => {
      const result = await registerRestaurant(step1Data, data);
      // Only reached if signIn failed (NEXT_REDIRECT bypasses this)
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="w-full space-y-8">
      <Stepper steps={STEPS} currentStep={step} />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {step === 1 && (
        <Step1
          defaultValues={step1Data}
          slugState={slugState}
          onNext={handleStep1Next}
        />
      )}

      {step === 2 && (
        <Step2
          defaultValues={step2Data}
          isPending={isPending}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
