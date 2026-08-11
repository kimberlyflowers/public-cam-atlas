import Link from "next/link";

const exclusions = [
  ["Traffic Cam Archive", "Live previews may be public; archive is paid", "Not separately ingested", "Its live traffic coverage substantially duplicates TxDOT, while archived downloads require payment."],
  ["San Antonio city intersection cameras", "Operational system", "No public video endpoint found", "The city documents traffic cameras and publishes detector/signal telemetry, but the audited public pages expose no playable camera feed."],
  ["VIA, school-zone and flood sensor systems", "Public information varies", "No public video endpoint found", "Public status or sensor data is not labeled as video."],
  ["Live Oak Flock system", "Restricted", "Excluded", "The city says only authorized police personnel have access."],
  ["San Marcos: Wonder World @ Hunter", "Official public listing", "Temporarily excluded", "The listed YouTube video currently rejects public embedding; the other 13 official feeds are included."],
] as const;

export default function SourcesPage() {
  return <main style={{minHeight:"100vh",overflow:"auto",padding:"40px",background:"#f5f4ee",color:"#132923",fontFamily:"Arial, sans-serif"}}>
    <div style={{maxWidth:960,margin:"0 auto"}}>
      <Link href="/" style={{color:"#278467",textDecoration:"none",fontSize:13}}>← Back to map</Link>
      <h1 style={{marginTop:24}}>Source decisions</h1>
      <p style={{maxWidth:720,color:"#6f817b",lineHeight:1.6}}>A feed may be included when it is publicly reachable without authentication or payment and was found through a public webpage, dataset, directory, or search index. Every camera panel shows how it was found and why it was included. County labels are calculated from official U.S. Census TIGERweb boundaries. We do not scan IP ranges, guess credentials, or bypass access controls.</p>
      <h2 style={{marginTop:38,fontFamily:"Georgia, serif",fontWeight:500}}>Reviewed but not included</h2>
      <div style={{display:"grid",gap:10}}>{exclusions.map(([source,access,status,reason]) => <article key={source} style={{padding:18,border:"1px solid #dde2dc",borderRadius:12,background:"#fff"}}><strong>{source}</strong><div style={{display:"flex",gap:10,margin:"8px 0",color:"#278467",fontSize:11}}><span>{access}</span><span>·</span><span>{status}</span></div><p style={{margin:0,color:"#6f817b",fontSize:13,lineHeight:1.5}}>{reason}</p></article>)}</div>
    </div>
  </main>;
}
