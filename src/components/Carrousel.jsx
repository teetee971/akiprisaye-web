import React, { useState, useEffect } from "react";

const images = [
  "/assets/app.png",
  "/assets/carte.png",
  "/assets/budget.png",
  "/assets/classement.png",
  "/assets/vie-chere.png"
];

export default function Carrousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-64 bg-black flex items-center justify-center">
      <img src={images[index]} alt="carrousel" className="h-full object-contain" />
    </div>
  );
}