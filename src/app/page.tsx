import Image from "next/image";
import './page.css'
import PlaceholdersAndVanishInput from"@/app/components/Inputform"
export default function Home() {
  return (
    <div>
      <PlaceholdersAndVanishInput/>
      <div
     id="add_url"
        className="flex justify-center items-center w-14 h-14 rounded-full bg-pink-300 transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-white"
      >
        <span style={{color:"black",fontWeight:"900",fontSize:"20px!important",scale:"120%"}}>
    <a href="/url" id="fic">   <i className="fa-solid fa-link"></i></a>
          <g id="Grupo_3793" data-name="Grupo 3793" transform="translate(1.5 1.5)">
            <path
              id="Trazado_28219"
              data-name="Trazado 28219"
              d="M7,10V24.188"
              transform="translate(-1.088 -0.541)"
              fill="none"
              stroke="#000"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            ></path>
            <path
              id="Trazado_28220"
              data-name="Trazado 28220"
              d="M17.37,6.587l-1.182,4.871h6.893a2.365,2.365,0,0,1,2.27,3.027L22.6,23.944a2.365,2.365,0,0,1-2.27,1.7H4.365A2.365,2.365,0,0,1,2,23.282V13.823a2.365,2.365,0,0,1,2.365-2.365H7.628a2.365,2.365,0,0,0,2.116-1.312L13.823,2A3.7,3.7,0,0,1,17.37,6.587Z"
              transform="translate(-2 -2)"
              fill="none"
              stroke="#000"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            ></path>
          </g>
        </span>
      </div>
      <div
     id="add_pdf"
        className="flex justify-center items-center w-14 h-14 rounded-full bg-pink-300 transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-white"
      >
        <span style={{color:"black",fontWeight:"900",fontSize:"20px!important",scale:"120%"}}>
    <a href="/pdf" id="fic">    <i className="fa-solid fa-file"></i></a>
          <g id="Grupo_3793" data-name="Grupo 3793" transform="translate(1.5 1.5)">
            <path
              id="Trazado_28219"
              data-name="Trazado 28219"
              d="M7,10V24.188"
              transform="translate(-1.088 -0.541)"
              fill="none"
              stroke="#000"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            ></path>
            <path
              id="Trazado_28220"
              data-name="Trazado 28220"
              d="M17.37,6.587l-1.182,4.871h6.893a2.365,2.365,0,0,1,2.27,3.027L22.6,23.944a2.365,2.365,0,0,1-2.27,1.7H4.365A2.365,2.365,0,0,1,2,23.282V13.823a2.365,2.365,0,0,1,2.365-2.365H7.628a2.365,2.365,0,0,0,2.116-1.312L13.823,2A3.7,3.7,0,0,1,17.37,6.587Z"
              transform="translate(-2 -2)"
              fill="none"
              stroke="#000"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            ></path>
          </g>
        </span>
      </div>
      
      
    </div>
  );
}
