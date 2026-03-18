
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { images, apiKey } = req.body;
    const imageContents = images.map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.type, data: img.data }
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `Ești un asistent care parsează bonuri fiscale din Moldova. 
Extrage TOATE produsele din bon și returnează DOAR un JSON valid, fără text adițional.

Format JSON:
{
  "items": [
    {"luna": "2026 03", "categorie": "Alimente", "produs": "Cartofi", "pret": 25.50}
  ]
}

REGULI STRICTE:
- "luna": format "YYYY MM" (ex: "2026 03"). Dacă data nu e vizibilă, lasă string gol "".
- "categorie": folosește DOAR aceste categorii: Alimente, Transport, Comunale, Medicina, Igiena, Curatenie, Binefacere, Altele, Familie, Arenda, Birotica, Electrocasnice, Imbracaminte, Casnice, Cadou, Taxe
- "produs": 1-2 cuvinte în română, generic, scurt. Exemple: Burger, Cartofi, Apa, Cascaval, Suc, Lavas, Fidea, Sarmale, Rosii, Castraveti
- "pret": prețul FINAL plătit (după reduceri), număr decimal
- Sacosa/punga → Altele, Sacosa
- Fanta/Pepsi/orice suc → Alimente, Suc
- Apă → Alimente, Apa
- Hârtie igienică → Igiena, Hirtie igienica
- Șervețele → Igiena, Servetele
- Castraveti/cornisoni → Alimente, Castraveti
- Tortilla/lavash → Alimente, Lavas
- Orice burger/sandwich cu carne/pește → Alimente, Burger
- Produse curățenie casă → Curatenie
- Medicamente/spray nazal/pastile → Medicina
- Dacă sunt mai multe bonuri în imagine, parsează-le pe toate.`,
        messages: [{
          role: 'user',
          content: [
            ...imageContents,
            { type: 'text', text: 'Parsează toate bonurile din aceste imagini și returnează JSON.' }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
