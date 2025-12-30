import { useState, useEffect } from "react";
import "./Loading.css";

function Loading({ message = "Analyse en cours..." }) {
   const [logs, setLogs] = useState([]);

   useEffect(() => {
      const eventSource = new EventSource("http://localhost:3001/audit/logs");

      eventSource.onmessage = (event) => {
         try {
            const data = JSON.parse(event.data);
            setLogs((prev) => [...prev.slice(-20), data]); // Garder les 20 derniers logs
         } catch (e) {
            console.error("Erreur parsing SSE:", e);
         }
      };

      eventSource.onerror = () => {
         console.log("Connexion SSE fermée");
         eventSource.close();
      };

      return () => {
         eventSource.close();
      };
   }, []);

   return (
      <div className='loading-container card'>
         <div className='loading-content'>
            <div className='spinner'></div>
            <p>{message}</p>
            <span className='loading-hint'>
               L'IA analyse le contenu du site, cela peut prendre quelques
               minutes...
            </span>
         </div>

         {/* Console de logs */}
         <div className='loading-console'>
            <div className='console-header'>
               <span>📋 Console</span>
            </div>
            <div className='console-logs'>
               {logs.length === 0 ? (
                  <div className='console-log waiting'>
                     En attente de connexion...
                  </div>
               ) : (
                  logs.map((log, i) => (
                     <div key={i} className={`console-log ${log.type}`}>
                        {log.message}
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
   );
}

export default Loading;
