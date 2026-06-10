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

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                error: 'Server configuration error: Missing GEMINI_API_KEY in Vercel Environment Variables' 
            });
        }

        const prompt = `You are an expert ATS resume optimizer and career coach.

**Job Description:**
${jobDescription.slice(0, 3500)}

**Resume Bullet Points:**
${resumeBullets.slice(0, 3500)}

Analyze and return a professional markdown response with these exact sections:

1. **🔍 Missing Keywords**  
   List the most important skills, tools, technologies, certifications, and action verbs from the JD that are missing or weak in the resume.

2. **✍️ Optimized Bullet Points**  
   Rewrite **each** original bullet point into a stronger version that naturally incorporates the missing keywords. Keep them achievement-oriented and concise.

3. **💡 Quick Improvement Tips**  
   3-5 actionable tips on keyword placement, resume length, and ATS best practices.

Be specific, professional, and results-focused.`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API__KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 0.5, 
                        maxOutputTokens: 1600 
                    }
                })
            }
        );

        if (!geminiRes.ok) {
            const errData = await geminiRes.json().catch(() => ({}));
            console.error("Gemini Error:", errData);
            return res.status(502).json({ 
                error: `Gemini API error: ${errData.error?.message || geminiRes.status}` 
            });
        }

        const data = await geminiRes.json();
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated. Please try again.";

        res.status(200).json({ analysis });

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: 'Internal server error. Please try again in a moment.' });
    }
}