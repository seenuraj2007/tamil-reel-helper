import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    // --- 1. Body Parse ---
    const body = await req.json()

    // --- 2. Extract Variables ---
    const { niche, audience, platform, goal, userId } = body

    // --- 3. Validation ---
    if (!niche || !platform || !goal) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // --- 4. Safe DB Check (Handle Missing Profile) ---
    let profileData = null
    let error = null

    // Try to fetch (Returns null if not found, instead of crashing)
    const result = await supabase
      .from('profiles')
      .select('plan_usage, monthly_limit')
      .eq('user_id', userId)
      .maybeSingle()

    profileData = result.data
    error = result.error

    let currentUsage = 0
    let limit = 30

    if (profileData) {
      // User found: Use existing data
      currentUsage = profileData.plan_usage || 0
      limit = profileData.monthly_limit || 30
    } else {
      // Profile NOT found (New User): Create a new profile row
      console.log('Creating new profile for user:', userId)
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
          user_id: userId, 
          plan_usage: 0, 
          monthly_limit: 30 
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Insert Error:', insertError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
      
      // Keep defaults (0 and 30)
    }

    // --- 5. Check Limit ---
    if (currentUsage >= limit) {
      return NextResponse.json({ 
        error: 'Monthly limit reached. Upgrade to Pro for more.', 
        usage: { current: currentUsage, limit: limit }
      }, { status: 429 }) // 429 Too Many Requests
    }

    // --- 6. AI Logic ---
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    })

    const systemPrompt = "You are a senior social media marketing strategist."

    const userPrompt = `
      Niche: ${niche}
      Target Audience: ${audience || 'General public'} 
      Platform: ${platform}
      Goal: ${goal}

      TASK: Create a 7-Day Social Media Plan.

      Output Sections:
      1. Strategy Summary: 
         - Focus on how to appeal to this ${audience || 'audience'} on ${platform}.
      
      2. Weekly Schedule (7 Days):
         - Each day must be actionable.
         - Tailor content to audience (e.g., if audience is students, post about budget offers or late-night food).

      3. Pro Tip:
         - Give ONE specific insider secret or psychology hack for this niche on this platform.

      4. Best Time to Post (NEW):
         - Suggest ideal time slot to post on ${platform} for ${audience || 'your audience'} to achieve goal ${goal}.
         - Example format: "7 PM - 9 PM" or "Weekdays 9 AM".

      5. Viral Hashtags:
         - 5-10 relevant hashtags.

      Return ONLY raw JSON:
      {
        "strategy": "Summary text...",
        "schedule": ["Day 1 task...", "Day 2 task...", "..."],
        "proTip": "Secret tip here...",
        "bestPostTime": "Time slot here...", 
        "hashtags": "#tag1 #tag2"
      }
    `

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 1, // Slightly higher for creative time suggestions
      stream: false,
      response_format: { type: "json_object" } // Force JSON to include bestPostTime
    })

    const content = chatCompletion.choices[0]?.message?.content || '{}'

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid AI Response' }, { status: 500 })
    }

    // --- 7. Increment Usage Count in DB ---
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ plan_usage: currentUsage + 1 })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Update Error:', updateError)
      // Don't return error here, plan generate aagirundhaal count update fail aagala, user use panna mudiyum
    }

    return NextResponse.json(parsed)

  } catch (error) {
    console.error('Server Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}