import { useState } from "react";
import api from "./services/api";
import "./index.css";
import AuditFormV2 from "./components/AuditForm/AuditFormV2";
import Loading from "./components/Loading/Loading";
import DashboardV2 from "./components/DashboardV2/DashboardV2";

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
         // Appel à l'API V2
         const response = await api.post("/audit/v2", data);
         setResults(response.data);
         console.log("Résultats V2:", response.data);
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
            <p>Audit intelligent de sites Webflow - Pipeline 6 étapes</p>
         </header>

         <main>
            {!results && !loading && (
               <AuditFormV2 onSubmit={handleSubmit} isLoading={loading} />
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
                  <DashboardV2 results={results} />

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
