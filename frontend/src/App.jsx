import { useState } from "react";
import axios from "axios";
import "./index.css";
import AuditForm from "./components/AuditForm/AuditForm";
import Loading from "./components/Loading/Loading";
import Dashboard from "./components/Dashboard/Dashboard";

const API_URL = "http://localhost:3001";

function App() {
   const [loading, setLoading] = useState(false);
   const [results, setResults] = useState(null);
   const [formData, setFormData] = useState(null);
   const [error, setError] = useState(null);

   const handleSubmit = async (data) => {
      setLoading(true);
      setError(null);
      setResults(null);
      setFormData(data);

      try {
         const response = await axios.post(`${API_URL}/audit`, data);
         setResults(response.data);
      } catch (err) {
         const errorMessage =
            err.response?.data?.error ||
            "Une erreur est survenue lors de l'analyse. Veuillez réessayer.";
         setError(errorMessage);
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const handleReset = () => {
      setResults(null);
      setError(null);
   };

   return (
      <div className='app'>
         <header className='app-header'>
            <h1>SmartQA</h1>
            <p>Audit intelligent de sites Webflow</p>
         </header>

         <main>
            {!results && !loading && (
               <AuditForm onSubmit={handleSubmit} isLoading={loading} />
            )}

            {loading && <Loading />}

            {error && (
               <div className='alert alert-error'>
                  {error}
                  <button onClick={handleReset} className='btn-reset'>
                     Réessayer
                  </button>
               </div>
            )}

            {results && (
               <>
                  <Dashboard results={results} formData={formData} />
                  <div className='audit-actions'>
                     <button
                        onClick={() => handleSubmit(formData)}
                        className='btn-rerun-audit'
                     >
                        Refaire l'audit
                     </button>
                     <button onClick={handleReset} className='btn-new-audit'>
                        Nouvel audit
                     </button>
                  </div>
               </>
            )}
         </main>
      </div>
   );
}

export default App;
