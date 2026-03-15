"use client";

import Lottie from "lottie-react";
import pizzaAnimation from "@/public/Pizza.json";

export default function SushiLoader() {
  return (
    <Lottie
      animationData={pizzaAnimation}
      loop={true}
      style={{ width: 64, height: 64 }}
    />
  );
}
