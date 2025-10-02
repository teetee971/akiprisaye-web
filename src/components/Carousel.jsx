import React from "react";

export default function Carousel() {
  const slides = ["/assets/app.png","/assets/carte.png","/assets/budget.png"];
  return (
    <div className="flex space-x-4 p-4 justify-center">
      {slides.map((src, i) => (
        <img key={i} src={src} alt="slide" className="w-40 h-40 rounded-xl shadow" />
      ))}
    </div>
  );
}