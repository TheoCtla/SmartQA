import { useState } from "react";
import axios from "axios";
import "./index.css";
import AuditFormV2 from "./components/AuditForm/AuditFormV2";
import Loading from "./components/Loading/Loading";
// import DashboardV2 from "./components/DashboardV2/DashboardV2"; // À venir

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
         // Appel à l'API V2
         const response = await axios.post(`${API_URL}/audit/v2`, data);
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
            <h1>
               SmartQA <span className='version-badge'>V2</span>
            </h1>
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
                  {/* Dashboard V2 temporaire - affiche les résultats bruts */}
                  <div className='card results-preview'>
                     <h2>✅ Audit terminé !</h2>
                     <div className='result-summary'>
                        <p>
                           <strong>Décision :</strong>{" "}
                           <span
                              className={`decision-badge ${results.etape6_synthese?.decision}`}
                           >
                              {results.etape6_synthese?.decision || "N/A"}
                           </span>
                        </p>
                        <p>
                           <strong>Pages analysées :</strong>{" "}
                           {results.meta?.pages_analysees}
                        </p>
                        <p>
                           <strong>Résumé :</strong>{" "}
                           {results.etape6_synthese?.resume || "Aucun résumé"}
                        </p>
                     </div>

                     <details className='raw-results'>
                        <summary>Voir les résultats bruts (JSON)</summary>
                        <pre>{JSON.stringify(results, null, 2)}</pre>
                     </details>
                  </div>

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
