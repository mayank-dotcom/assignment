"use client";

import PlaceholdersAndVanishInput  from "./ui/placeholders-and-vanish-input";
import "./input.css"
import { Orbitron } from 'next/font/google';
const orbit = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'], 
});
export default function PlaceholdersAndVanishInputDemo() {
  const placeholders = [
    "What's the first rule of Fight Club?",
    "Who is Tyler Durden?",
    "Where is Andrew Laeddis Hiding?",
    "Write a Javascript method to reverse a string",
    "How to assemble your own PC?",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };
  return (
    <div className="h-[40rem] flex flex-col justify-center  items-center px-4" id="bot_cont" >
      <div id="head_cont">     
         <h2 id="tit" className={`text-3xl md:text-7xl font-bold dark:text-white text-center ${orbit.className}`}>
      Helpdesk 
      </h2><span id="headset"><i className="fa-solid fa-headset"></i></span>
      </div>

      <div id="inputbasr">
      <PlaceholdersAndVanishInput
      
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
      />

      </div>
    </div>
  );
}
