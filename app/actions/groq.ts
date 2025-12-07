'use server'

import Groq from 'groq-sdk'

export async function generateIcebreakers(): Promise<string[]> {
    const apiKey = process.env.GROQ_API_KEY
    
    if (!apiKey || apiKey === 'your_groq_api_key') {
        // Fallback pool - pick 3 random ones
        const fallbacks = [
            'Bhai tera CGPA kaisa hai? 😂',
            'Mess ka khana ya Maggi?',
            'Kaunsi year? First year?',
            'Campus mein sabse weird jagah kaunsi hai?',
            'Night canteen ya hostel food?',
            'Tera fav professor kaun hai?',
            'Last movie binge-watch?',
            'Are you team Android ya iPhone?',
            'Hostel roommate kaisa hai?',
            'Agar 10 lakh mile abhi, kya karega?'
        ]
        // Shuffle and pick 3
        const shuffled = fallbacks.sort(() => 0.5 - Math.random())
        return shuffled.slice(0, 3)
    }

    try {
        const groq = new Groq({ apiKey })
        
        // Add timestamp to make each request unique
        const now = new Date().toLocaleTimeString('en-IN')
        
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: `You are a funny Indian college student. Generate 3 SHORT, funny, Hinglish icebreaker questions to start an anonymous chat. 
                    
Rules:
- Each question must be under 10 words
- Mix Hindi and English naturally
- Be quirky and relatable to college life
- No numbering, just 3 lines separated by newlines
- Make them DIFFERENT each time (current time: ${now})

Examples: "Mess ka khana ya starve?", "Bhai tera CGPA reveal kar", "Campus wifi sucks na?"`
                }
            ],
            model: 'llama3-8b-8192',
            max_tokens: 100,
            temperature: 1.0, // Higher temperature = more randomness
        })

        const text = completion.choices[0]?.message?.content || ''
        const lines = text.split('\n').filter(line => line.trim().length > 0 && line.trim().length < 50).slice(0, 3)
        
        if (lines.length >= 3) return lines
        
        // If not enough lines, supplement with fallbacks
        const fallbacks = ['Bro what\'s your major?', 'Mess rating /10?', 'Night owl ya early bird?']
        return [...lines, ...fallbacks].slice(0, 3)
    } catch (error) {
        console.error('Groq Icebreakers Error:', error)
        return ['Kya scene hai?', 'Hostel mein ho ya day scholar?', 'Boring vacation hai na?']
    }
}

export async function generateRoast(): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY
    
    if (!apiKey || apiKey === 'your_groq_api_key') {
        // Random fallback roasts
        const roasts = [
            'Tera face dekh ke WiFi bhi disconnect ho jaata hai 📶',
            'Bhai tu itna boring hai, even Netflix ne skip button suggest kiya',
            'Tera attendance se zyada toh mere sleep hours hain',
            'Tu woh banda hai jo group project mein sirf naam deta hai',
            'Tera bio "exploring life" hai but tu sirf mess explore karta hai',
        ]
        return roasts[Math.floor(Math.random() * roasts.length)]
    }

    try {
        const groq = new Groq({ apiKey })
        
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: `Give ONE savage but friendly roast in Hinglish (Hindi + English mix). 
Like a college friend roasting another friend. 
Keep it under 15 words. 
Be creative and funny, not mean.
No quotes, just the roast.
Example: "Bhai tera attendance se zyada toh meri neend hai"`
                }
            ],
            model: 'llama3-8b-8192',
            max_tokens: 50,
            temperature: 1.2, // Very high for maximum creativity
        })

        const roast = completion.choices[0]?.message?.content?.trim()
        return roast || 'Tu itna special hai, AI ne bhi jawab dena chhod diya 😂'
    } catch (error) {
        console.error('Groq Roast Error:', error)
        return 'AI thak gaya tujhe roast karte karte. Break le raha hai.'
    }
}
