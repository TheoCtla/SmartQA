import "./Loading.css";

function Loading({ message = "Analyse en cours..." }) {
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
      </div>
   );
}

export default Loading;
