// api/optimize.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { jobDescription, resumeBullets } = req.body || {};

        if (!jobDescription || !resumeBullets) {
            return res.status(400).json({ error: 'Both job description and resume bullets are required' });
        }

        const GEMINI_API_KEY = process.env.Gemini_API__Key;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                error: 'GEMINI_API_KEY is missing. Check Vercel Environment Variables.' 
            });
        }

        const prompt = `You are an expert ATS resume optimizer.

**Job Description:**
${jobDescription.slice(0, 3000)}

**Resume Bullet Points:**
${resumeBullets.slice(0, 3000)}

Return a clean markdown response with these sections:

1. **🔍 Missing Keywords**  
   List key skills, tools, technologies, and action verbs missing from the resume.

2. **✍️ Optimized Bullet Points**  
   Rewrite each original bullet with the missing keywords naturally included.

3. **💡 Quick Tips**  
   3-5 practical tips for better ATS performance.

Be specific and professional.`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 0.5, 
                        maxOutputTokens: 1500 
                    }
                })
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Gemini Error:", errText);
            return res.status(502).json({ error: `Gemini API error: ${geminiRes.status}` });
        }

        const data = await geminiRes.json();
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated.";

        res.status(200).json({ analysis });

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
}