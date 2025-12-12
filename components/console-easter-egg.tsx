"use client";

import { useEffect } from "react";
import readme from "../README.md";

const ConsoleEasterEgg = () => {
  useEffect(() => {
    console.log(readme);
  }, []);

  return null;
};

export default ConsoleEasterEgg;
