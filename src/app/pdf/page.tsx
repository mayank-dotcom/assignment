"use client"
import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import "./pdf.css"
const PdfEmbeddingForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError("Please upload a PDF file");
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await axios.post("/api/chunks_pdf", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResponse(res.data.message);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string; details?: string }>;
      setError(
        axiosError.response?.data.details ||
        axiosError.response?.data.error ||
        "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4" id="pdf_cont">
      <h2 className="text-xl font-bold mb-4">PDF Embeddings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="w-full p-2 border rounded"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading || !file}
          className="w-full bg-pink-500 text-white p-2 rounded hover:bg-pink-600 disabled:bg-pink-300"
        >
          {loading ? "Processing..." : "Generate Embeddings"}
        </button>
      </form>
      {response && <p className="text-green-600 mt-4">{response}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
      <div
     id="back_b2"
        className="flex justify-center items-center w-14 h-14 rounded-full bg-pink-300 transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-white"
      >
        <span style={{color:"black",fontWeight:"900",fontSize:"20px!important",scale:"120%"}}>
    <a href="/" id="fic">   <i className="fa-solid fa-arrow-left"></i></a>
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
};

export default PdfEmbeddingForm;