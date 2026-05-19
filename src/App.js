import React, { useState, useEffect } from "react";

// ── Storage ───────────────────────────────────────────────────────────────────
// Uses Firebase Realtime Database
const DB = "https://rma-motors-onboarding-default-rtdb.firebaseio.com/staff";

const dbGet = async (key) => {
  try {
    const res = await fetch(`${DB}/${key}.json`);
    const json = await res.json();
    return json && typeof json === "object" ? json : null;
  } catch { return null; }
};

const dbSet = async (key, val) => {
  try {
    await fetch(`${DB}/${key}.json`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(val)
    });
    return true;
  } catch { return false; }
};

const dbList = async () => {
  try {
    const res = await fetch(`${DB}.json?shallow=true`);
    const json = await res.json();
    return json && typeof json === "object" ? Object.keys(json) : [];
  } catch { return []; }
};

const dbDelete = async (key) => {
  try {
    await fetch(`${DB}/${key}.json`, { method: "DELETE" });
    return true;
  } catch { return false; }
};

const dbFindByName = async (name) => {
  try {
    const res = await fetch(`${DB}.json`);
    const json = await res.json();
    if (!json || typeof json !== "object") return null;
    const entry = Object.entries(json).find(([k,v]) => v?.name?.toLowerCase() === name.trim().toLowerCase());
    return entry ? { ...entry[1], _key: entry[0] } : null;
  } catch { return null; }
};

// Aliases for compatibility
const sGet = dbGet;
const sSet = dbSet;
const sList = async (prefix) => { const keys = await dbList(); return keys.filter(k=>k.startsWith(prefix||"")); };
const sDelete = dbDelete;
const sGetByName = dbFindByName;

const MGMT_PASSWORD = "RMAmanager2024";

const QUIZZES = {
  sales: { label:"Speed & Response", icon:"⚡", questions:[
    { q:"What is the maximum time you have to respond to a new inbound lead?", opts:["Within 5 minutes","Within 60 seconds","Within 2 minutes","Within 30 minutes"], correct:1, exp:"Refer to the KPIs tab and Day 2 training module." },
    { q:"What is your minimum target for converting responded leads into booked appointments?", opts:["10%","20%","33%","50%"], correct:2, exp:"Refer to the KPIs tab — Lead to Appointment conversion target." },
    { q:"What is the minimum show rate you must achieve for booked appointments?", opts:["40%","50%","60%","66%"], correct:3, exp:"Refer to the KPIs tab — Appointment Show Rate target." },
    { q:"How many connected outbound calls must you complete per day?", opts:["20 calls","30 calls","40 calls","50 calls"], correct:2, exp:"Refer to the KPIs tab — Connected Calls daily target." },
    { q:"What is the minimum percentage of responded customers you must send a Snap Cell to?", opts:["10%","20%","33%","50%"], correct:3, exp:"Refer to the KPIs tab — Snap Cell send rate target." },
    { q:"What is the minimum AI Call Score you must maintain on CallGear?", opts:["60%","70%","80%","90%"], correct:2, exp:"Refer to the KPIs tab — AI Call Score target." },
  ]},
  crm: { label:"CRM & Process", icon:"📋", questions:[
    { q:"What must you NEVER do to a lead source once it has been entered in Eskimo CRM?", opts:["View it","Change it — the original lead source must never be altered","Share it with a colleague","Add a note next to it"], correct:1, exp:"Refer to the SOPs tab — CRM Stages section and Day 4 training module." },
    { q:"Within how long must you send a personalised Snap Cell video after completing your first call with a lead?", opts:["Within 30 minutes","Within 1 hour","Within 5 minutes","Within 24 hours"], correct:2, exp:"Refer to the Scripts tab and SOPs tab — Sales Process Step 2." },
    { q:"What is your first action when a new lead comes in during your shift?", opts:["Update the CRM with their details","Send a WhatsApp message","Call the lead within 60 seconds","Email them a brochure"], correct:2, exp:"Refer to the KPIs tab and SOPs tab — Sales Process Step 2." },
    { q:"What CRM system does RMA Motors use for lead management?", opts:["Salesforce","HubSpot","Eskimo CRM","DealerSocket"], correct:2, exp:"Refer to the SOPs tab — CRM Stages section and Day 4 training module." },
    { q:"What is the correct CRM stage to set immediately after a customer confirms their appointment?", opts:["Contacted","Pending","Appointment Booked","Quoted"], correct:2, exp:"Refer to the SOPs tab — CRM Stages section." },
    { q:"How long do you keep a lead and work it before handing over to the closer/sweeper?", opts:["24 hours","48 hours","72 hours","7 days"], correct:2, exp:"Refer to the SOPs tab — Sales Process Step 6, and your job description in the Home tab." },
  ]},
  objections: { label:"Objections & Scripts", icon:"🎯", questions:[
    { q:"A customer says 'I need to think about it.' What is the BEST response?", opts:["'No problem, call me when you are ready.'","'Of course — do you mind if I ask what part of the deal you would like to think about?'","'The price is very competitive, you should decide now.'","'I will send you more information by email.'"], correct:1, exp:"Refer to the Scripts tab — Objection Handling section." },
    { q:"A customer says 'I found it cheaper somewhere else.' What is the BEST approach?", opts:["Immediately offer a lower price","Hang up and mark as lost","'When you say expensive, are you comparing it to a specific car you have seen? If the prices were the same, which would you choose?'","'We cannot match that price, sorry.'"], correct:2, exp:"Refer to the Scripts tab — Objection Handling, Price section." },
    { q:"A customer says 'I need to speak to my wife first.' What should you do?", opts:["End the call and wait for them to call back","Push harder to book the appointment immediately","Offer to create a group chat so you can share the details with both of them","Tell them the car might not be available if they wait"], correct:2, exp:"Refer to the Scripts tab — Objection Handling, Decision Maker section." },
    { q:"When booking an appointment, what should you always ask for to improve show rates?", opts:["Their credit score","A verbal commitment — 'Can I get your word that you will show up?'","A non-refundable deposit","Their employer details"], correct:1, exp:"Refer to the Scripts tab — Step 6 of the Setter Framework." },
    { q:"What is the BAMFAM principle in follow-up?", opts:["Best Always Makes For Amazing Meetings","Book A Meeting From A Meeting — always secure the next step before ending any interaction","Before Appointment Meeting, Follow And Monitor","Build A Message For All Missed calls"], correct:1, exp:"Refer to the Scripts tab — BAMFAM Follow-up Sequence section." },
    { q:"How should you handle a customer who repeatedly does not answer your calls?", opts:["Mark the lead as lost immediately","Keep calling every hour until they answer","Follow the BAMFAM 6-message sequence — educational, authority, FAQ, product, social proof, and final reopener","Send one final email and close the lead"], correct:2, exp:"Refer to the Scripts tab — BAMFAM Follow-up Sequence section." },
  ]},
  knowledge: { label:"RMA Knowledge", icon:"🏢", questions:[
    { q:"Where is RMA Motors located?", opts:["Business Bay, Dubai","Showroom 3, Speedex Centre, DIP 1, Dubai","Dubai Marina, Dubai","DIFC, Dubai"], correct:1, exp:"Refer to the Home tab — Role Overview section." },
    { q:"What is the Setter's primary objective in the sales process?", opts:["To close deals and take deposits","To respond fast, build rapport, and book qualified appointments for the Closing team","To manage vehicle listings across online platforms","To handle finance applications and bank submissions"], correct:1, exp:"Refer to your job description in the Home tab and Day 1 training module." },
    { q:"What is the pathway for a high-performing Setter at RMA Motors?", opts:["Move into marketing after 6 months","Become a Purchasing Manager","Progression into a Sales Closer role, assessed at the 3-month review","Move into an HR or admin role"], correct:2, exp:"Refer to your employment offer details in the Home tab — Role Overview." },
    { q:"What does the Setter role require above all else according to the job description?", opts:["Patience and a slow, methodical approach","Urgency, CRM discipline, and exceptional communication skills","Experience in automotive finance","A background in vehicle purchasing"], correct:1, exp:"Refer to your job description in the Home tab and Day 1 training module." },
    { q:"What happens at the end of the 10-day onboarding programme before you go live?", opts:["You start taking calls immediately with no assessment","You must pass a final test of 20 questions (10 marketing + 10 purchasing) and receive a Shop Floor Ready sign-off from the Department Manager","You shadow a Closer for a full week","You complete a written essay about the sales process"], correct:1, exp:"Refer to the Training tab — Days 6–10 module." },
    { q:"What should you do if a lead comes in outside of your shift hours?", opts:["Ignore it until your next shift","Contact it within 60 seconds regardless of shift hours","Contact it within 30 minutes of the start of your next shift","Pass it to a colleague immediately"], correct:2, exp:"Refer to the SOPs tab — Sales Process Step 2." },
  ]},
  ppf: { label:"RMA PPF Upsell", icon:"🛡️", questions:[
    { q:"How many protection packages does RMA PPF offer and what are they called?", opts:["2 packages — Basic and Premium","3 packages — Essential, Elite, and Signature","4 packages — Bronze, Silver, Gold, and Platinum","2 packages — Standard and Deluxe"], correct:1, exp:"Refer to the Training tab — RMA PPF Upsell module." },
    { q:"What is the Elite package price for a Large SUV?", opts:["AED 16,950","AED 18,950","AED 20,950","AED 23,950"], correct:2, exp:"Refer to the Training tab — RMA PPF Upsell module, pricing section." },
    { q:"How much extra value does the Signature package offer compared to buying services separately?", opts:["AED 2,000","AED 4,000","AED 8,000","AED 10,000"], correct:3, exp:"Refer to the Training tab — RMA PPF Upsell module, Signature package section." },
    { q:"What is the warranty period on all Shogun PPF products?", opts:["1 year","3 years","5 years","10 years"], correct:3, exp:"Refer to the Training tab — RMA PPF Upsell module, warranty section." },
    { q:"Where are Shogun PPF films manufactured?", opts:["South Korea","Germany","Nagoya, Japan","United States"], correct:2, exp:"Refer to the Training tab — RMA PPF Upsell module, Shogun product knowledge section." },
    { q:"Which Shogun product is specifically described as the SIGNATURE PRODUCT designed for the Middle East climate?", opts:["Shogun Track","Shogun Matte","Shogun X8 Plus","Shogun Obsidian Black"], correct:2, exp:"Refer to the Training tab — RMA PPF Upsell module, Shogun gloss films section." },
  ]},
  sop: { label:"SOP Questions", icon:"📖", questions:[
    { q:"When must you click the 'Attended' button in Eskimo CRM?", opts:["At the end of your shift","When the customer physically arrives at the showroom","After the appointment is confirmed by phone","When the deal sheet is signed"], correct:1, exp:"Refer to the CRM Stages SOP — Appointment Kept section." },
    { q:"How many signed deal sheet copies must be provided at point of deposit/reservation and where does each go?", opts:["1 copy to F&I only","2 copies — customer and F&I","3 copies — customer, F&I, and Accounts","4 copies including the Purchasing team"], correct:2, exp:"Refer to Finance & Admin SOP — Step 1 Deal Handover." },
    { q:"What additional document must be completed on the same day as the deal, before the customer leaves?", opts:["Vehicle inspection form","Finance enquiry form","RTA registration form","Customer satisfaction survey"], correct:1, exp:"Refer to Finance & Admin SOP — Step 1 Deal Handover." },
    { q:"For a car that has been in stock for 80 days, what is the correct discount action?", opts:["Full retail — 0–1%","Tactical — 2–3%","Aggressive — 5–7%","Exit — whatever clears. Auction, trade, or wholesale."], correct:2, exp:"Refer to Stock & Pricing SOP — Age-Based Discount Ladder. 75–90 days = Aggressive 5–7%." },
    { q:"What is the maximum time a car should take to go live on all platforms after reconditioning sign-off?", opts:["6 hours","12 hours","24 hours","48 hours"], correct:2, exp:"Refer to Marketing SOP — Listing Goal section." },
    { q:"During an in-person appointment, at what stage must the trade-in be valued?", opts:["After the test drive","After the trial close","Before the static demo — trade-in must be valued FIRST","After the deposit is taken"], correct:2, exp:"Refer to Sales Process SOP — Step 3 In-Person Appointment." },
  ]},
};


const CLOSER_MODULES = [
  { id:"c1", day:"Module 1", title:"Appointment Communications", phase:1, defaultUnlocked:true, items:[
    "Understand your role: the Closer takes over from the Setter after the warm handover — you own the relationship from first appointment through to deposit and beyond",
    "Appointment confirmation call: call the customer within 1 hour of the appointment being booked — confirm the time, reconfirm their interest, and build excitement",
    "WhatsApp confirmation message: send a confirmation text immediately after the call with date, time, and location (Showroom 3, Speedex Centre, DIP 1)",
    "Day-before reinforcement: send a personalised message or video the evening before — reference what they are coming to see and what to expect",
    "Morning-of confirmation: on the day of the appointment, send a short check-in message — 'Looking forward to seeing you at [time] today. The [Car] is ready and waiting.'",
    "If no response to confirmation attempts: escalate to manager and notify the Setter to attempt contact via their channel",
    "Always confirm the appointment at a specific, unusual time — e.g. 2:15pm, 3:40pm — never on the hour",
    "Create a WhatsApp Event for the appointment so the customer can RSVP — this significantly improves show rates",
  ]},
  { id:"c2", day:"Module 2", title:"Snap Cells — Post-Setter Introduction", phase:1, defaultUnlocked:true, items:[
    "Your Snap Cell comes AFTER the Setter has made the warm introduction — not before",
    "Record a personalised video filmed in front of the specific car the customer enquired about — face clearly visible",
    "Introduce yourself by name and confirm you are their dedicated contact from this point forward",
    "Reference something the customer mentioned to the Setter — show you have been fully briefed",
    "Walk around the car briefly — highlight 2-3 key features relevant to what the customer is looking for",
    "End with a clear call to action: confirm the appointment time or invite them to message you directly with any questions",
    "Send within 30 minutes of the Setter introduction being made — speed shows professionalism",
    "Use Snap Cell for: post-introduction, pre-appointment reminder, after a no-show re-engagement, post-test-drive follow-up",
  ]},
  { id:"c3", day:"Module 3", title:"No Show Communications", phase:1, defaultUnlocked:true, items:[
    "A no-show is not a lost deal — it is a follow-up opportunity. React immediately and professionally",
    "Immediate (within 5 minutes of missed appointment): send a WhatsApp message — 'Hi [Name], I was looking forward to meeting you today at [time]. I hope everything is okay — would you like to reschedule? I have kept the car available for you.'",
    "30 minutes after no-show: attempt a phone call. If no answer, leave a brief voicemail — warm, not pushy",
    "2 hours after no-show: send a Snap Cell video — filmed in front of the car. Keep it light and genuine: 'The [Car] is still here and I'd love to show it to you. Let me know when works.'",
    "Same day (evening): send a final message — 'No worries at all if something came up. I am happy to rearrange at a time that suits you. Just reply here and we will get it sorted.'",
    "Following day: notify the Setter to attempt re-engagement through their channel — Setter sends a BAMFAM message",
    "After 48 hours with no response: update CRM to 'No Show' and mark for sweeper follow-up. Do not chase more than this — it becomes counter-productive",
    "Never express frustration or guilt-trip the customer — always be warm, professional, and solution-focused",
  ]},
  { id:"c4", day:"Module 4", title:"Staff Appearance — First Impressions", phase:1, defaultUnlocked:true, items:[
    "Dress code: smart business attire at all times when on the shop floor or in customer-facing situations. Company uniform guidelines apply — refer to the Company Policy Handbook",
    "Grooming: hair must be neat and clean. Facial hair should be well-groomed. No extreme hairstyles or colours",
    "Fragrance: subtle and professional. No overpowering cologne or perfume",
    "Shoes: clean, polished, smart footwear at all times — no trainers unless specifically approved",
    "Posture: stand tall, shoulders back, open body language. No slouching, leaning on cars, or hands in pockets when greeting customers",
    "Mobile phones: never on the shop floor during customer interactions — phone should be on your person but not visible or in use",
    "Greeting: when a customer arrives, move towards them immediately — do not wait for them to come to you. Smile, make eye contact, and extend a firm handshake",
    "Greeting script: 'Good [morning/afternoon], welcome to RMA Motors. I am [Name] — I have been looking forward to meeting you. You must be [Customer Name]?'",
    "Energy: match the customer's energy but lead it upwards. Be warm, confident, and genuinely enthusiastic — not scripted or robotic",
    "First impression sets the tone for the entire visit — the customer decides within seconds whether they trust you",
  ]},
  { id:"c5", day:"Module 5", title:"Welcome into the Showroom", phase:2, defaultUnlocked:false, items:[
    "WARM WELCOME: greet the customer at the entrance, not from behind a desk. Use their name immediately — it was confirmed by the Setter in the introduction",
    "Confirm their name and the car they are here to see: 'Great to have you here [Name] — you've come to see the [Car Model], right? I have it ready for you.'",
    "SHOWROOM TOUR: walk them through the showroom briefly before going to the car — give them a sense of the space, introduce the environment, and make them feel comfortable",
    "THE CAR: walk to the car together. Reveal it properly — open it up, invite them to sit inside. Start with what THEY mentioned they care about, not a generic pitch",
    "TEST DRIVE: offer the test drive early — before price discussions. 'The best way to know if this is the right car is to drive it. Shall we take it out now?'",
    "During test drive: be quiet. Let them experience the car. Ask open questions: 'How does it feel?' 'Does this match what you had in mind?'",
    "OBJECTION HANDLING — Price: 'I completely understand. Can I ask — is it the total number, or more about how it fits your budget each month?' Never drop price without manager approval.",
    "OBJECTION HANDLING — Thinking about it: 'Of course. Can I ask what specifically you'd like to think about? Sometimes I can help clarify things right now.'",
    "OBJECTION HANDLING — Partner/spouse: 'Totally understand. Would it help to get them on a quick call now so they can be part of the decision?'",
    "DEPOSIT: trial close after test drive — 'Based on what you've seen and felt today, is this the car for you?' If yes: 'The next step is to secure it with a deposit — this takes it off the market and we begin the process. Shall we do that now?'",
    "Deposit amount and process: follow manager's guidance on deposit amount. Complete the deal sheet fully and accurately. Update CRM to 'Deposit Received' immediately.",
  ]},
  { id:"c6", day:"Module 6", title:"Post Deposit — Document Collection", phase:2, defaultUnlocked:false, items:[
    "Document collection is NON-NEGOTIABLE — all documents must be collected before the customer leaves the building on the day of deposit",
    "Required documents from every customer: Emirates ID (original + copy), Passport copy (photo page), Visa copy (if applicable)",
    "For finance customers additionally: completed finance enquiry form, 3 months bank statements (some banks require 6), salary certificate or employment letter, proof of address (utility bill or tenancy agreement)",
    "Deal sheet: must be fully completed and signed by both the customer and the Sales Manager. Three copies: customer, F&I, Accounts",
    "If any documents are missing: do not let the customer leave without a firm commitment and a time by which they will send them — same day only",
    "Hand all documents to F&I immediately after the customer leaves — do not hold onto them overnight",
    "Update CRM with all document receipt notes — log what was received, what is outstanding, and the agreed deadline",
    "Finance enquiry form must be completed in full — no blank fields. F&I cannot proceed without this",
    "Passport and Emirates ID copies to be taken on the day — do not rely on the customer sending them later",
  ]},
  { id:"c7", day:"Module 7", title:"Uploading onto Titan DMS", phase:2, defaultUnlocked:false, items:[
    "Titan DMS is the primary Dealer Management System — all deal information must be entered accurately and in real time",
    "After deposit is received: open the deal in Titan DMS and update the status to reflect deposit taken",
    "Customer profile: verify the customer's details are correct in the system — name, contact number, Emirates ID number",
    "Vehicle details: confirm the correct VIN, registration, and stock number are linked to the deal",
    "Deal sheet upload: scan and attach the signed deal sheet to the customer's file in Titan",
    "Document checklist: update the document status in Titan — mark what has been received and what is outstanding",
    "Finance details: enter the payment method (cash, finance, L2O) and any relevant finance reference numbers",
    "Notes: add a comprehensive deal summary note — how the deal was done, any special arrangements, customer preferences for delivery",
    "Notify F&I through Titan: raise the F&I handover task so the F&I team are alerted and can begin the bank quotation process",
    "Never leave Titan entries incomplete — every field that applies to the deal must be filled before end of day",
  ]},
  { id:"c8", day:"Module 8", title:"How to Push a Line — PDI, Prep & Handover", phase:3, defaultUnlocked:false, items:[
    "'Pushing a line' means initiating the Pre-Delivery Inspection and preparation process in the DMS once a deal is confirmed",
    "When to push: immediately after deposit is received and deal is entered into Titan DMS",
    "Who to notify: F&I team (to begin F&I SOP), Car Care team (to begin prep, PPF, tints, ceramic if agreed), Workshop (if any mechanical work is outstanding)",
    "PDI process: raise a PDI request in Titan DMS for the technical team. The car is inspected thoroughly — mechanical, electrical, cosmetic. Any issues flagged must be resolved before handover.",
    "Prep checklist: full valet inside and out, no warning lights, AC working, minimum quarter tank fuel, no paired Bluetooth, no saved driver profiles, no stored satnav locations, no saved radio stations",
    "RTA inspection: vehicle must pass RTA before registration. Co-ordinated by F&I.",
    "Car Care: any agreed upsells (PPF, tints, ceramic coating) begin at this stage. Inform Car Care of what has been sold and the target delivery date.",
    "Timeline: from point of deposit to customer delivery is targeted at 6 days. Update the customer every 2 days with a progress message.",
    "Keeping the customer informed: send a message after pushing the line — 'Great news [Name], we have started the preparation process on your car. We are targeting delivery by [date]. I will keep you updated every step of the way.'",
    "Escalation: if any department is holding up the process beyond the 6-day target, escalate immediately to the Department Manager",
  ]},
  { id:"c9", day:"Module 9", title:"Handover & Testimonial", phase:3, defaultUnlocked:false, items:[
    "The handover is the most important moment in the customer journey — it sets the tone for the review, referral, and repeat business",
    "Scheduling: book ONE handover per hour maximum. Confirm with Car Care the vehicle is ready 30 minutes before arrival. Park in the designated handover bay.",
    "Preparation: place the completed handover pack and sunshade inside the vehicle. Handover pack includes: registration documents, insurance policy, warranty documentation, PPF/service info if applicable",
    "Coordinate with Marketing: ensure the Marketing team are available and briefed — they must be present for photos and video content",
    "Staff appearance: dress to impress. The reveal is a moment — treat it that way",
    "THE REVEAL: use the reveal curtain for a dramatic presentation. Keys and any gift handed over. Manager delivers a formal 'Thank you for choosing RMA Motors.'",
    "REFERRALS: immediately after the reveal, while the energy is high — 'We would love to help more people like you. Is there anyone in your circle — family, friends, colleagues — who is looking for a car? We'd love an introduction.'",
    "TESTIMONIAL VIDEO: ask the customer to record a short video testimonial on the spot — 'Would you mind sharing a quick 30-second video about your experience? It means a lot to us and helps other buyers feel confident choosing RMA.'",
    "Google Review: ask for a Google Review before the customer leaves — send the link directly to their WhatsApp. Target: 5 Google reviews per month minimum.",
    "Handover video: film a short customer handover video for social media — customer with the car, smiling, sharing their experience. Must be done at every handover.",
    "Post-handover: call or message within 48 hours to confirm satisfaction. Log in CRM. Customer enters the aftersales pipeline: 6, 12, 18, 24-month check-ins.",
  ]},
];

const CLOSER_QUIZZES = {
  closer_comms: { label:"Appointment & Comms", icon:"📅", questions:[
    { q:"How quickly must you send your personal Snap Cell after the Setter makes the introduction?", opts:["Same day","Within 2 hours","Within 30 minutes","Within 5 minutes"], correct:2, exp:"Refer to Training Module 2 — Snap Cells." },
    { q:"What should you do within 5 minutes of a customer not showing up for their appointment?", opts:["Mark the lead as lost","Call the manager","Send a warm WhatsApp message and offer to reschedule","Wait until the end of the day"], correct:2, exp:"Refer to Training Module 3 — No Show Communications." },
    { q:"What is the correct greeting when a customer arrives at the showroom?", opts:["Wait for them to approach you at the desk","Call their name from across the room","Move towards them immediately, smile, make eye contact and extend a handshake","Ask them to sign in at reception first"], correct:2, exp:"Refer to Training Module 4 — Staff Appearance and Module 5 — Welcome into the Showroom." },
    { q:"How many days after no-show with no response should you stop chasing and update CRM?", opts:["Same day","24 hours","48 hours","1 week"], correct:2, exp:"Refer to Training Module 3 — No Show Communications." },
    { q:"When should you offer the test drive?", opts:["After discussing price","After the customer has been in the showroom for 30 minutes","Early — before price discussions, to let them experience the car first","Only if the customer asks"], correct:2, exp:"Refer to Training Module 5 — Welcome into the Showroom." },
    { q:"What is the ROI timeline target from point of deposit to delivery?", opts:["3 days","6 days","10 days","14 days"], correct:1, exp:"Refer to the KPIs tab — ROI Timeline." },
  ]},
  closer_process: { label:"Process & Documents", icon:"📋", questions:[
    { q:"Which documents must be collected before the customer leaves on the day of deposit?", opts:["Just the deal sheet","Emirates ID, Passport copy, and finance enquiry form (where applicable)","Only the finance form","Documents can be collected the following day"], correct:1, exp:"Refer to Training Module 6 — Post Deposit Document Collection." },
    { q:"How many copies of the signed deal sheet are created and where does each go?", opts:["1 copy to F&I only","2 copies — customer and manager","3 copies — customer, F&I, and Accounts","4 copies including workshop"], correct:2, exp:"Refer to Training Module 6 — Post Deposit Document Collection." },
    { q:"When should you 'push a line' in Titan DMS?", opts:["At end of day","After the customer leaves","Immediately after deposit is received and deal is entered in Titan","Only after F&I confirms they are ready"], correct:2, exp:"Refer to Training Module 8 — How to Push a Line." },
    { q:"What is the prep checklist item regarding the car's entertainment system before handover?", opts:["Pre-set 3 radio stations for the customer","Connect your phone to demonstrate Bluetooth","No paired Bluetooth, no saved driver profiles, no stored satnav locations, no saved radio stations","Leave it as it is — do not touch the settings"], correct:2, exp:"Refer to Training Module 8 — How to Push a Line, prep checklist." },
    { q:"What must you do immediately after receiving the deposit?", opts:["Call the customer to confirm","Update CRM to Deposit Received and enter deal into Titan DMS","Send the deal sheet to the customer by email","Notify the workshop"], correct:1, exp:"Refer to Training Module 5 — Welcome into the Showroom, deposit section, and Module 7 — Titan DMS." },
    { q:"What is the minimum number of Google reviews a Closer must generate per month?", opts:["1","3","5","10"], correct:2, exp:"Refer to the KPIs tab — Google Reviews target." },
  ]},
};

const MODULES = [
  { id:"m1", day:"Day 1", title:"Welcome & HR Induction", phase:1, defaultUnlocked:true, items:["Department Manager meet & greet — full site introduction to all staff and showroom tour","HR session: finalise laptop, uniform, work phone, and complete all document sign-offs","Systems setup: Callgear, Eskimo CRM, and Bayzat logins activated and tested","Receive notepad and pen — written tests will be implemented throughout training","Read, understand, and sign: Sales SOP, Disciplinary & Performance Management Procedure, and Company Policy","Understand your role: you are the first point of contact for ALL inbound leads — speed, precision, and communication directly influence revenue","Review your KPIs: 60-second response, 33% conversion, 66% show rate, 40 calls/day, 80% AI score","Understand shift patterns: 06:00–15:00 or 15:00–00:00 — flexibility is essential for the under-60-second standard","Review probation terms: 6-month probation, monthly KPI reviews, 3-month Closer pathway assessment"] },
  { id:"m2", day:"Day 2", title:"Sales Process & Setter Framework", phase:1, defaultUnlocked:true, items:["Understand the full setter role: own all new inbound leads for the critical first 24 hours and up to 7 days","Speed to lead: respond to ALL new inbound leads within 60 seconds during your assigned coverage shift — no exceptions","Study and memorise the 8-step Setter Framework from the Scripts tab","Qualification & discovery: thoroughly qualify each lead — budget, timeline, vehicle preference, finance readiness","Use approved messaging frameworks across WhatsApp, phone, and social media to build instant rapport","Send a personalised Snap Cell video within 5 minutes of completing the first call — filmed in front of the specific car enquired about, face visible","If no answer: x2 double dial immediately, then send SMS intro, then follow the 6-message BAMFAM sequence over 15 days","Appointment booked: update CRM stage to 'Appointment Booked' immediately and trigger the pre-appointment reinforcement sequence","Contact, qualify, and quote all new leads within the first 24 hours of receipt","Lead handover: after 72 hours without conversion, complete a clean handover to the Closer team","Maintain 100% CRM accuracy — every note, task, and pipeline stage must be updated in real time","Understand the BAMFAM principle: every interaction ends with a confirmed next step — Book A Meeting From A Meeting"] },
  { id:"m3", day:"Day 3", title:"Finance & Admin", phase:1, defaultUnlocked:false, items:["Sit with Irfan (Kat's team) and Abrar (Cam's team) for 2 days — full F&I process walkthrough","Understand the DBR (Debt Burden Ratio) process and how it affects customer finance eligibility","Understand finance application forms: what is required, how to complete, and what documents to collect","Learn the bank partnerships and current interest rates RMA Motors works with","Understand the full 12-step F&I SOP: deal handover → bank quote → LPO → PDI → RTA → registration → notify","Documents Sales must provide to F&I: 3 signed deal sheet copies + customer Emirates ID + Visa copy + finance application","Understand what an LPO (Loan Purchase Order) is and what it triggers: Sales Agreement or Hayaza mortgage request","Understand PDI coordination: F&I pushes the line to prep team — ceramic, PPF, detailing, tinting","Understand how Emirates ID is collected and used to register the vehicle in the customer's name via RTA portal","Finance vs Cash SOP differences — margin VAT applies to profit only, full VAT applies to entire sale price","Understand how the E-Certificate is created in the RTA portal and how registration is completed"] },
  { id:"m4", day:"Day 4", title:"CRM, CallGear & Snap Cell", phase:2, defaultUnlocked:false, items:["CRM — Eskimo: create a new customer profile correctly (always search for existing customer first)","Assign a lead to the correct salesperson, change lead status correctly, update lead source correctly","Tag an inbound phone call to the correct customer in CRM — never leave a call untagged","Add customer correspondence and internal notes correctly — 100% CRM hygiene is a measured KPI","Use templates correctly, close leads with the correct closure reason","Phone — CallGear: make an outbound call through the system, answer inbound calls professionally within 3 rings","Use the correct opening script on every call, ask key qualifying questions, attempt to book an appointment on every call","Understand AI call scoring: what is measured, how to achieve 80%+, review one recorded call with your trainer","Snap Cell: understand what a Snap Cell is and why it improves response rates and show rates","Record and send a Snap Cell video — must include your face, filmed in front of the specific car, sent within 5 minutes of first call","Know when to send a walk-around video vs a finance/trust video vs a social proof asset","Deal Sheets: understand when a deal sheet is required, how to complete it correctly, who must sign","Submit a completed test deal sheet to your trainer for review and sign-off","Systems: Qsync — vehicle data sync and stock management tool, understand daily use","Systems: DMS Titan — primary dealership management system, stock entry, documentation, and reporting","Systems: Meta Business Suite — managing RMA Motors social media ads, monitoring lead performance from Facebook and Instagram","Asset creation: create your personal breakout video asset library — intro to you/RMA, 3 FAQs, authority/expert video","Push a Line: understand when a line should be pushed, who to notify, and the prep/workshop/PDI process"] },
  { id:"m5", day:"Day 5 — PPF/SPV, Purchasing", title:"Purchasing & Fundamentals Test", phase:2, defaultUnlocked:false, items:["Morning: half-day with Barry (Purchasing Manager) — stock acquisition strategies and sourcing flow","Understand department workflow: sourcing to after-sales, roles within the Purchasing team","Sourcing process: Seller → Inspect → Negotiate → Buy — understand each stage thoroughly","Product identification: VIN and chassis number verification, model variations, exact trim levels, GCC vs non-GCC specs","Understand pricing structures: purchase pricing, RMA margin requirements, VAT on profit margin vs full VAT","Understand retail vs trade pricing strategies and discounting policies (management approval always required)","Reconditioning costing: how recon cost impacts buying price and required margin","Inspection training with Ricardo: RMA vehicle inspection standards, mechanical assessment (EVC), cosmetic evaluation (paintwork, panel work, accident history), RTA passing requirements","DD Pro: how to run a full vehicle history and market valuation report — used to verify pricing, flag hidden issues, and support price negotiation with customers","Vehicle file creation with Zora: stock entry in Titan DMS within one hour of vehicle arrival, documentation verification","Marketing push process: preparing vehicles for photography, coordination with Marketing team, 24-hour listing goal after recon sign-off","Top sellers by ROI: Cadillac (8 days avg, AED 38,748 profit), Porsche (15 days, AED 31,541), Ford (22 days, AED 23,301)","Age-based discount ladder — 0–14 days: full retail; 75+ days: exit pricing","Afternoon: RMA Fundamentals test — 10 Finance/Admin, 10 CRM, 10 Purchasing. Must pass all 30 to progress to Phase 3",
    "RMA PPF Upsell training: understand the 3 protection packages — Essential, Elite, and Signature",
    "Essential: Full Body PPF — entry-level protection",
    "Elite: Full Body PPF + Interior PPF + Leather & Fabric Coating + Window Tint + Ceramic Coating + Wheel Armour + Windscreen Film. Saves customer over AED 4,000 vs buying separately. 10-year warranty.",
    "Signature: Everything in Elite PLUS Windscreen Protection Film + Panoramic Sunroof Protection + 12 Safe Washes + 5 Panel Replacements in 12 months. Over AED 10,000 in extra value. 10-year warranty.",
    "Pricing — Coupe: Essential AED 14,000 / Elite AED 17,950 / Signature AED 22,950",
    "Pricing — Small SUV/Saloon: Essential AED 14,495 / Elite AED 18,950 / Signature AED 23,950",
    "Pricing — Large SUV: Essential AED 16,950 / Elite AED 20,950 / Signature AED 26,950",
    "Pricing — Hypercar/Exotic: Essential AED 19,000 / Elite AED 23,950 / Signature AED 28,950",
    "Shogun PPF: engineered for the Middle East climate (heat, UV, sand, debris). TPU film from Nagoya, Japan. 10-year warranty on all products.",
    "Gloss films: X8 Plus (SIGNATURE PRODUCT, >90 GU, anti-yellowing), Track (9.7mil, racing), Obsidian Black (stylish black gloss), X7 (quality + affordability)",
    "Matte films: Shogun Matte (<20 GU), Kuro Matte (stealth black), Satin (20–30 GU smooth finish)",
    "Specialist films: Panorama (sunroof, 98% UV rejection), WPF-7 (windshield, shatter-resistant, self-healing)",
    "Key upsell script: 'While you're here, I'd love to show you our RMA PPF options — most buyers add protection to keep the car in showroom condition. The Elite saves over AED 4,000 and comes with a 10-year warranty.' Best price discussed in person only."] },
  { id:"m6", day:"Days 6–10", title:"Shadowing, Role Play & Live Calls", phase:3, defaultUnlocked:false, items:["Day 6: 1-1 with Department Manager to review progress against training plan. Full day shadowing Department Manager workflows — CRM management, team communication, escalation handling","Day 7 morning: sit with Accounts team — understand their role in the sales lifecycle, deal processing, and payment reconciliation","Day 7 afternoon: shadow a Sales Rep selected by the Department Manager — observe live lead handling, call structure, and CRM updates in real time","Day 8 morning: sit with Marketing team — understand lead generation, brand standards, listing process, platform management, and the 'Just Arrived' update process","Day 8 afternoon: shadow a Sales Rep selected by the Department Manager — focus on objection handling and appointment setting technique","Day 9: structured role play sessions coordinated by Department Managers — practise full 8-step setter framework, stall objections, price objections, decision maker objections, BAMFAM sequence, and appointment close","Day 10: supervised live calling under Department Team Leaders — real leads, real conversations, manager monitoring","Day 10 final test: 10 marketing questions + 10 purchasing questions — must pass to receive Shop Floor Ready sign-off","Shop Floor Ready sign-off: Department Manager formally signs off that you have demonstrated CRM proficiency, professional communication standards, and full knowledge of the setter framework","Completion requirements: 30 questions passed on Day 5 + 20 questions passed on Day 10 + supervised live call standard + Department Manager sign-off"] },
];

const CRM_STAGES = [
  { label:"Contacted", color:"#4A90E2", desc:"Initial call made — send personalised Snap Cell video within 5 minutes of completing the first call" },
  { label:"Pending", color:"#F0A030", desc:"Vehicle confirmed, awaiting callback, or appointment date set — continue BAMFAM sequence if no response" },
  { label:"Appt Booked", color:"#22C984", desc:"Physical appointment confirmed — log in CRM calendar immediately. Inform the Closer of the appointment and arrange a seamless handover, keeping the customer fully informed of the process. Send pre-appointment reinforcement the day before." },
  { label:"Appt Kept ✓", color:"#16A865", desc:"Customer physically attended the showroom. REQUIRED: click the 'Attended' button in Eskimo CRM immediately when the customer arrives. Failure to do this means the appointment is not recorded as kept and will not count towards your show rate KPI." },
  { label:"Quoted", color:"#8B6FE8", desc:"Customer attended, identified the car — quote agreed and deal sheet initiated" },
  { label:"Deposit Received", color:"#E07840", desc:"Deal committed — update payment type: Cash, Finance, or Lease to Own (L2O). Hand to F&I with 3 signed deal sheet copies plus a completed finance enquiry form. All paperwork completed on the same day as the deal." },
  { label:"Finance Approved", color:"#4A90E2", desc:"Bank approved — car enters F&I/Accounts SOP" },
  { label:"F&I Clearance", color:"#7A82A0", desc:"Post F&I clearance — enters Handover SOP" },
  { label:"Sale Complete", color:"#22C984", desc:"Handover done — customer enters Aftersales pipeline. Request Google Review and Trustpilot." },
];

const T = {
  bg:"#0D0F14", surf:"#141720", card:"#1A1E2A", cardHov:"#1F2438",
  border:"#252A3A", borderLt:"#2E3448",
  gold:"#C9A84C", goldLt:"#E8C96A", goldDim:"#8A6E2F",
  goldBg:"rgba(201,168,76,0.10)", goldBgLt:"rgba(201,168,76,0.18)",
  text:"#F0F2F8", muted:"#8A90B0", faint:"#454D66",
  green:"#22C984", greenBg:"rgba(34,201,132,0.12)", greenTx:"#22C984",
  red:"#F05454", redBg:"rgba(240,84,84,0.12)", redTx:"#F07070",
  blue:"#4A90E2", blueBg:"rgba(74,144,226,0.12)", blueTx:"#7AB3F0",
  amber:"#F0A030", amberBg:"rgba(240,160,48,0.12)", amberTx:"#F0C060",
  purple:"#8B6FE8", purpleBg:"rgba(139,111,232,0.12)", purpleTx:"#B09CF0",
};

const G = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0D0F14;color:#F0F2F8;font-family:'DM Sans',system-ui,sans-serif}
  :root{color-scheme:dark}
  input,textarea,select{font-family:'DM Sans',system-ui,sans-serif;outline:none;transition:border-color .2s}
  input:focus,textarea:focus,select:focus{border-color:#C9A84C!important}
  input::placeholder,textarea::placeholder{color:#454D66}
  option{background:#1A1E2A}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .fade{animation:fadeUp .3s ease forwards}
  .tab-btn{
    padding:7px 15px;border-radius:8px;font-size:12px;font-weight:700;
    cursor:pointer;border:1px solid #2E3448;
    color:#ffffff!important;background:#1A1E2A;
    transition:all .2s;font-family:'DM Sans',system-ui,sans-serif;
  }
  .tab-btn:hover{background:#2E3448}
  .tab-btn.active{color:#0D0F14!important;background:#C9A84C;border-color:#C9A84C}
  .sub-tab{
    padding:5px 12px;border-radius:6px;font-size:11px;font-weight:700;
    cursor:pointer;border:1px solid #252A3A;
    color:#ffffff!important;background:transparent;
    transition:all .2s;font-family:'DM Sans',system-ui,sans-serif;
  }
  .sub-tab:hover{background:#1A1E2A}
  .sub-tab.active{background:#252A3A;border-color:#2E3448}
  .quiz-opt{transition:all .15s;cursor:pointer}
  .quiz-opt:hover{border-color:#C9A84C!important;background:rgba(201,168,76,.07)!important;color:#F0F2F8!important}
  .primary-btn{
    background:linear-gradient(135deg,#8A6E2F,#C9A84C);
    color:#ffffff!important;border:none;font-weight:800;
    cursor:pointer;border-radius:9px;
    font-family:'DM Sans',system-ui,sans-serif;
    transition:opacity .2s,transform .1s;
  }
  .primary-btn:hover{opacity:.88}
  .primary-btn:active{transform:scale(.98)}
  .primary-btn:disabled{opacity:.35;cursor:not-allowed;transform:none}
  .ghost-btn{
    background:transparent;color:#ffffff!important;
    border:1px solid #252A3A;cursor:pointer;border-radius:8px;
    font-family:'DM Sans',system-ui,sans-serif;
    transition:all .2s;font-weight:600;
  }
  .ghost-btn:hover{background:#1A1E2A;border-color:#2E3448}
  .ghost-btn:disabled{opacity:.4;cursor:not-allowed}
  .mod-card{transition:border-color .2s;cursor:pointer}
  .mod-card:hover{border-color:#2E3448!important}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#252A3A;border-radius:4px}
`;

const RMALogo = ({ size = 24 }) => (
  <div style={{ display:"flex", alignItems:"center", gap:1 }}>
    <span style={{ fontSize:size, fontWeight:900, fontStyle:"italic", color:T.text, letterSpacing:-1, lineHeight:1 }}>RMA</span>
    <span style={{ fontSize:size, fontWeight:300, color:T.text, letterSpacing:2, lineHeight:1 }}>&nbsp;MOTORS</span>
  </div>
);

const Card = ({ children, accent, style={} }) => (
  <div style={{ background:T.card, borderRadius:12, marginBottom:8, border:`1px solid ${accent||T.border}`, borderLeft:accent?`3px solid ${accent}`:`1px solid ${T.border}`, borderTopLeftRadius:accent?0:12, borderBottomLeftRadius:accent?0:12, padding:"1rem 1.25rem", ...style }}>{children}</div>
);

const SectionLabel = ({ children, style={} }) => (
  <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:T.faint, margin:"1.25rem 0 8px", ...style }}>{children}</div>
);

const InfoRow = ({ label, value, last }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:last?"none":`1px solid ${T.border}`, gap:12 }}>
    <span style={{ fontSize:13, color:T.muted }}>{label}</span>
    <span style={{ fontSize:13, fontWeight:600, color:T.text, textAlign:"right" }}>{value}</span>
  </div>
);

const StepBlock = ({ n, title, desc, accent=T.gold }) => (
  <div style={{ background:T.surf, borderRadius:10, padding:"0.85rem 1rem", marginBottom:6, borderLeft:`2px solid ${accent}`, borderTopLeftRadius:0, borderBottomLeftRadius:0 }}>
    {n && <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.08em" }}>{n}</div>}
    <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:3 }}>{title}</div>
    <div style={{ fontSize:12, color:T.muted, lineHeight:1.65 }}>{desc}</div>
  </div>
);

const Alert = ({ children, variant="info" }) => {
  const s = { info:{bg:T.blueBg,bd:T.blue,c:T.blueTx}, warn:{bg:T.amberBg,bd:T.amber,c:T.amberTx}, ok:{bg:T.greenBg,bd:T.green,c:T.greenTx}, danger:{bg:T.redBg,bd:T.red,c:T.redTx}, gold:{bg:T.goldBg,bd:T.goldDim,c:T.gold} }[variant];
  return <div style={{ background:s.bg, border:`1px solid ${s.bd}`, borderRadius:8, padding:"10px 14px", fontSize:13, color:s.c, lineHeight:1.55, marginBottom:8 }}>{children}</div>;
};

const Avatar = ({ initials, size=40 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${T.goldDim},${T.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size>44?16:12, fontWeight:800, color:"#0D0F14", flexShrink:0 }}>{initials}</div>
);

const ProgressBar = ({ pct, height=5 }) => (
  <div style={{ background:T.border, borderRadius:99, height, overflow:"hidden" }}>
    <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg,${T.goldDim},${T.gold})`, borderRadius:99, transition:"width .6s" }} />
  </div>
);

const Btn = ({ children, onClick, primary, small, disabled, full, style={} }) => primary
  ? <button className="primary-btn" onClick={onClick} disabled={disabled} style={{ padding:small?"7px 18px":"10px 24px", fontSize:small?12:14, width:full?"100%":undefined, ...style }}>{children}</button>
  : <button className="ghost-btn" onClick={onClick} disabled={disabled} style={{ padding:small?"5px 14px":"8px 18px", fontSize:small?12:13, width:full?"100%":undefined, opacity:disabled?.4:1, cursor:disabled?"not-allowed":"pointer", ...style }}>{children}</button>;

const Input = ({ value, onChange, onKeyDown, placeholder, type="text", style={} }) => (
  <input type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
    style={{ width:"100%", background:T.surf, border:`1px solid ${T.border}`, color:T.text, borderRadius:9, padding:"11px 14px", fontSize:14, ...style }} />
);

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [role, setRole] = useState(null);
  const [setterId, setSetterId] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [mgmtSetters, setMgmtSetters] = useState([]);
  const [mgmtLoading, setMgmtLoading] = useState(false);
  const [mgmtTab, setMgmtTab] = useState("overview");
  const [mgmtAuth, setMgmtAuth] = useState(false);
  const [mgmtPassword, setMgmtPassword] = useState("");
  const [mgmtAuthError, setMgmtAuthError] = useState(false);
  const [fbTarget, setFbTarget] = useState("");
  const [fbType, setFbType] = useState("General coaching");
  const [fbText, setFbText] = useState("");
  const [fbSent, setFbSent] = useState(false);
  const [resetTarget, setResetTarget] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [expandedSetter, setExpandedSetter] = useState(null);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [genPassword, setGenPassword] = useState("");
  const [genLink, setGenLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [expandedMod, setExpandedMod] = useState(null);
  const [activeSop, setActiveSop] = useState("sales");
  const [openStep, setOpenStep] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState("sales");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [shuffledOpts, setShuffledOpts] = useState({});

  const getShuffled = (quizId, qi, opts) => {
    const key = `${quizId}-${qi}`;
    if (!shuffledOpts[key]) {
      const indices = opts.map((_,i)=>i);
      for (let i = indices.length-1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [indices[i],indices[j]] = [indices[j],indices[i]];
      }
      const newShuffled = {...shuffledOpts, [key]: indices};
      setShuffledOpts(newShuffled);
      return indices;
    }
    return shuffledOpts[key];
  };
  const [quizAttempts, setQuizAttempts] = useState({});
  const [quizBlocked, setQuizBlocked] = useState({});

  const loadSetter = async (id) => {
    // Just show the login screen — actual lookup happens by name on login
    setScreen("login");
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = G;
    document.head.appendChild(style);
    const hash = window.location.hash.replace("#","");
    if (hash === "mgmt") { setScreen("mgmt"); return; }
    if (hash?.startsWith("setter") || hash === "login") { setScreen("login"); }
    else { setScreen("mgmt"); }
  }, []);

  const loadMgmt = async () => {
    setMgmtLoading(true);
    const keys = await sList("setter-");
    const all = [];
    for (const k of keys) { const d = await sGet(k); if (d) all.push({id:k,...d}); }
    setMgmtSetters(all);
    setMgmtLoading(false);
  };

  const handleMgmtLogin = () => {
    if (mgmtPassword === MGMT_PASSWORD) { setMgmtAuth(true); setMgmtAuthError(false); setMgmtPassword(""); loadMgmt(); }
    else { setMgmtAuthError(true); setMgmtPassword(""); }
  };

  const saveData = async (updated) => {
    const id = setterId || `setter-demo-${Date.now()}`;
    await sSet(id, updated);
    setSetterData(updated);
  };

  const handleLogin = async () => {
    if (!nameInput.trim() || !passwordInput.trim()) return;
    setLoginLoading(true);
    setLoginError(false);
    // Look up by name — no longer depends on URL ID
    const result = await sGetByName(nameInput.trim());
    setLoginLoading(false);
    if (!result) { setLoginError("account_not_found"); return; }
    if (result.password !== passwordInput.trim()) { setLoginError("wrong_password"); return; }
    setLoginError(false);
    const id = result._key;
    setSetterId(id);
    setSetterData(result);
    setQuizAnswers(result.quizAnswers||{});
    setQuizAttempts(result.quizAttempts||{});
    setQuizBlocked(result.quizBlocked||{});
    if (result.role) { setRole(result.role); setScreen("setter"); }
    else setScreen("role_select");
  };

  const toggleModule = async (mid) => {
    if (!setterData) return;
    const modules = setterData.completedModules || [];
    const already = modules.includes(mid);
    const updated = { ...setterData, completedModules: already ? modules.filter(m=>m!==mid) : [...modules, mid] };
    await saveData(updated);
  };

  const handleQuizAnswer = async (qi, oi) => {
    const key = `${activeQuiz}-${qi}`;
    if (quizAnswers[key] !== undefined) return;
    if (quizBlocked[activeQuiz]) return;
    const correct = QUIZZES[activeQuiz].questions[qi].correct === oi;
    const newA = { ...quizAnswers, [key]:{ chosen:oi, correct } };
    setQuizAnswers(newA);
    const total = QUIZZES[activeQuiz].questions.length;
    const allDone = Array.from({length:total},(_,i)=>newA[`${activeQuiz}-${i}`]).every(Boolean);
    let updated = { ...setterData, quizAnswers:newA };
    if (allDone) {
      const score = Math.round((Array.from({length:total},(_,i)=>newA[`${activeQuiz}-${i}`].correct).filter(Boolean).length/total)*100);
      updated = { ...updated, quizScores:{ ...setterData.quizScores, [activeQuiz]:score } };
      const passed = score >= 90;
      if (!passed) {
        const currentAttempts = (setterData.quizAttempts?.[activeQuiz] || 0) + 1;
        const newAttempts = { ...(setterData.quizAttempts||{}), [activeQuiz]: currentAttempts };
        const newBlocked = { ...(setterData.quizBlocked||{}) };
        if (currentAttempts >= 3) { newBlocked[activeQuiz] = true; }
        updated = { ...updated, quizAttempts: newAttempts, quizBlocked: newBlocked };
        setQuizAttempts(newAttempts);
        setQuizBlocked(newBlocked);
      }
    }
    await saveData(updated);
  };

  const handleUnblockQuiz = async (setterId, quizId) => {
    const d = await sGet(setterId);
    if (!d) return;
    const newBlocked = { ...(d.quizBlocked||{}) };
    const newAttempts = { ...(d.quizAttempts||{}) };
    delete newBlocked[quizId];
    delete newAttempts[quizId];
    await sSet(setterId, { ...d, quizBlocked: newBlocked, quizAttempts: newAttempts, quizAnswers: { ...(d.quizAnswers||{}), ...Object.fromEntries(Object.keys(d.quizAnswers||{}).filter(k=>k.startsWith(quizId+'-')).map(k=>[k,undefined])) } });
    loadMgmt();
  };

  const sendFeedback = async () => {
    if (!fbText.trim() || !fbTarget) return;
    const target = mgmtSetters.find(s=>s.name===fbTarget);
    if (!target) return;
    const d = await sGet(target.id);
    if (!d) return;
    const fb = { from:"Management", type:fbType, message:fbText.trim(), date:new Date().toISOString().split("T")[0] };
    await sSet(target.id, { ...d, feedback:[...(d.feedback||[]), fb] });
    setFbSent(true); setFbText("");
    setTimeout(()=>setFbSent(false), 3000);
    loadMgmt();
  };

  const generateLink = async () => {
    if (!newName.trim() || !newPassword.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");
    const id = `setter_${slug}_${Math.floor(1000+Math.random()*9000)}`;
    const initials = newName.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
    const setterRecord = {
      name: newName.trim(), initials, password: newPassword.trim(),
      startDate: new Date().toISOString().split("T")[0],
      completedModules:[], quizScores:{}, quizAnswers:{}, feedback:[], setterId:id
    };
    await sSet(id, setterRecord);
    const url = `${window.location.href.split("#")[0]}#login`;
    setGenLink(url);
    setGenPassword(newPassword.trim());
    loadMgmt();
  };



  const handleDeleteAccount = async (setterId) => {
    await sDelete(setterId);
    setDeleteConfirm("");
    loadMgmt();
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPassword.trim()) return;
    const target = mgmtSetters.find(s=>s.name===resetTarget);
    if (!target) return;
    const d = await sGet(target.id);
    if (!d) return;
    await sSet(target.id, { ...d, password: resetPassword.trim() });
    setResetDone(true);
    setResetPassword("");
    setTimeout(()=>setResetDone(false), 3000);
    loadMgmt();
  };

  const activeModules = role==="closer" ? CLOSER_MODULES : MODULES;
  const activeQuizzes = role==="closer" ? CLOSER_QUIZZES : QUIZZES;
  const safeModuleCount = (s) => s?.role==="closer" ? CLOSER_MODULES.length : MODULES.length;
  const completionPct = (d) => { if (!d) return 0; const mods = d.role==="closer" ? CLOSER_MODULES : MODULES; const qzs = d.role==="closer" ? CLOSER_QUIZZES : QUIZZES; const total = mods.length + Object.keys(qzs).length; return total > 0 ? Math.round(((d.completedModules?.length||0)+Object.keys(d.quizScores||{}).length)/total*100) : 0; };
  const avgScore = (d) => { const s = Object.values(d?.quizScores||{}); return s.length ? Math.round(s.reduce((a,b)=>a+b,0)/s.length) : null; };
  const isUnlocked = (mod, done=[]) => {
    if (mod.defaultUnlocked) return true;
    const order = ["m1","m2","m3","m4","m5","m6"];
    const idx = order.indexOf(mod.id);
    return idx > 0 && done.includes(order[idx-1]);
  };


  if (screen==="role_select") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem", background:T.bg }} className="fade">
      <div style={{ width:"100%", maxWidth:480 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}><RMALogo size={28} /></div>
        <div style={{ background:T.card, borderRadius:16, border:`1px solid ${T.border}`, padding:"2rem", boxShadow:"0 0 40px rgba(201,168,76,0.06)" }}>
          <div style={{ fontSize:20, fontWeight:800, color:T.text, marginBottom:6 }}>Welcome, {setterData?.name}.</div>
          <div style={{ fontSize:13, color:T.muted, marginBottom:"1.75rem", lineHeight:1.65 }}>Please select your role to load the correct training programme, KPIs, and assessments.</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              { r:"setter", label:"Setter", icon:"⚡", desc:"Lead response, appointment setting, CRM management" },
              { r:"closer", label:"Closer", icon:"🤝", desc:"Appointment closing, deposit, handover, post-sale" },
            ].map(({r, label, icon, desc})=>(
              <button key={r} onClick={async ()=>{
                const updated = { ...setterData, role: r };
                await saveData(updated);
                setRole(r);
                setScreen("setter");
              }} style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:12, padding:"1.25rem 1rem", cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',system-ui,sans-serif", transition:"border-color .2s, background .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.background=T.goldBg;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.surf;}}>
                <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:11, color:T.muted, lineHeight:1.5 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (screen==="invalid") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem", background:T.bg }} className="fade">
      <div style={{ width:"100%", maxWidth:420, textAlign:"center" }}>
        <RMALogo size={28} />
        <div style={{ marginTop:"2rem", background:T.card, borderRadius:16, border:`1px solid ${T.border}`, padding:"2rem" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
          <div style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:8 }}>Invalid link</div>
          <div style={{ fontSize:13, color:T.muted, lineHeight:1.65 }}>This link is not valid or has not been set up yet. Please contact your manager to get your correct onboarding link.</div>
        </div>
      </div>
    </div>
  );

  if (screen==="loading") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:400, flexDirection:"column", gap:16 }}>
      <style>{G}</style>
      <div style={{ width:36,height:36,border:`2px solid ${T.border}`,borderTop:`2px solid ${T.gold}`,borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />
      <div style={{ fontSize:13, color:T.muted }}>Loading...</div>
    </div>
  );

  if (screen==="login") return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem", background:T.bg }} className="fade">
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <RMALogo size={30} />
          <div style={{ marginTop:12, fontSize:11, fontWeight:700, letterSpacing:"0.18em", color:T.muted, textTransform:"uppercase" }}>Setter Onboarding Platform</div>
        </div>
        <div style={{ background:T.card, borderRadius:16, border:`1px solid ${T.border}`, padding:"2rem", boxShadow:"0 0 40px rgba(201,168,76,0.06)" }}>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:6, color:T.text }}>Welcome to the team.</div>
          <div style={{ fontSize:13, color:T.muted, marginBottom:"1.5rem", lineHeight:1.65 }}>Sign in using the credentials sent to you by your manager.</div>
          {loginError==="account_not_found" && <Alert variant="danger" style={{ marginBottom:12 }}>Account not found. Your manager may need to recreate your account — ask them to delete and recreate it from the management dashboard.</Alert>}
          {loginError==="wrong_password" && <Alert variant="danger" style={{ marginBottom:12 }}>Incorrect password. Please check with your manager.</Alert>}
          {loginError==="firebase_error" && <Alert variant="danger" style={{ marginBottom:12 }}>Connection error. Please check your internet connection and try again. If the problem persists, ask your manager.</Alert>}
          <label style={{ fontSize:11, fontWeight:700, color:T.faint, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Your full name</label>
          <Input value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="e.g. Jordan Smith" style={{ marginBottom:"1rem" }} />
          <label style={{ fontSize:11, fontWeight:700, color:T.faint, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Password</label>
          <Input type="password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Enter your password" style={{ marginBottom:"1.25rem" }} />
          <Btn primary full onClick={handleLogin} disabled={!nameInput.trim()||!passwordInput.trim()||loginLoading} style={{ fontSize:14, padding:12 }}>{loginLoading?"Signing in...":"Sign in →"}</Btn>
        </div>
        <div style={{ textAlign:"center", marginTop:16 }}>
          {!setterId && <button onClick={()=>{ window.location.hash="mgmt"; setScreen("mgmt"); }} style={{ fontSize:12, color:T.faint, background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',system-ui,sans-serif" }}>Management access →</button>}
          {setterId && <div style={{ fontSize:12, color:T.faint }}>Need help? Contact your manager.</div>}
        </div>
      </div>
    </div>
  );

  if (screen==="mgmt" && !mgmtAuth) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem", background:T.bg }} className="fade">
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <RMALogo size={30} />
          <div style={{ marginTop:12, fontSize:11, fontWeight:700, letterSpacing:"0.18em", color:T.muted, textTransform:"uppercase" }}>Management Access</div>
        </div>
        <div style={{ background:T.card, borderRadius:16, border:`1px solid ${T.border}`, padding:"1.75rem" }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:6, color:T.text }}>Manager sign in</div>
          <div style={{ fontSize:13, color:T.muted, marginBottom:"1.25rem", lineHeight:1.6 }}>Enter the management password to access the dashboard.</div>
          {mgmtAuthError && <Alert variant="danger" style={{ marginBottom:12 }}>Incorrect password. Please try again.</Alert>}
          <label style={{ fontSize:11, fontWeight:700, color:T.faint, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Password</label>
          <Input type="password" value={mgmtPassword} onChange={e=>setMgmtPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleMgmtLogin()} placeholder="Enter management password" style={{ marginBottom:"1.25rem" }} />
          <Btn primary full onClick={handleMgmtLogin} disabled={!mgmtPassword.trim()} style={{ fontSize:14, padding:12 }}>Sign in →</Btn>
        </div>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button onClick={()=>{ window.location.hash=""; setScreen("login"); }} style={{ fontSize:12, color:T.faint, background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',system-ui,sans-serif" }}>← Setter login</button>
        </div>
      </div>
    </div>
  );

  if (screen==="mgmt" && mgmtAuth) {
    const avgComp = mgmtSetters.length ? Math.round(mgmtSetters.reduce((a,s)=>a+completionPct(s),0)/mgmtSetters.length) : 0;
    const passed = mgmtSetters.reduce((total, s) => total + Object.values(s.quizScores||{}).filter(score=>score>=90).length, 0);
    return (
      <div style={{ padding:"2rem", maxWidth:1000, margin:"0 auto", background:T.bg, minHeight:"100vh" }} className="fade">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.75rem", flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <RMALogo size={22} />
            <div style={{ width:1, height:24, background:T.border }} />
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:T.text }}>Management Dashboard</div>
              <div style={{ fontSize:11, color:T.muted }}>Setter onboarding tracker</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn small onClick={loadMgmt}>↻ Refresh</Btn>
            <Btn small primary onClick={()=>setMgmtTab(mgmtTab==="links"?"overview":"links")}>{mgmtTab==="links"?"← Overview":"+ New setter link"}</Btn>
            <Btn small onClick={()=>{ setMgmtAuth(false); setMgmtPassword(""); }}>Sign out</Btn>
          </div>
        </div>
        {mgmtTab==="links" ? (
          <Card>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6, color:T.text }}>Create a new setter account</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:"1.25rem", lineHeight:1.65 }}>Enter the setter's name and set a password for them. Send them their unique link and password — they will need both to sign in.</div>
            <label style={{ fontSize:11, fontWeight:700, color:T.faint, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Setter's full name</label>
            <Input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Alex Mitchell" style={{ marginBottom:10 }} />
            <label style={{ fontSize:11, fontWeight:700, color:T.faint, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Set their password</label>
            <Input value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="e.g. RMA2024Alex" style={{ marginBottom:14 }} />
            <Btn primary small onClick={generateLink} disabled={!newName.trim()||!newPassword.trim()}>Create setter account →</Btn>
            {genLink && (
              <div style={{ marginTop:14, background:T.surf, borderRadius:10, padding:"14px 16px", border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.greenTx, marginBottom:10 }}>✓ Setter account created — share these details with {newName}</div>
                <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.1em" }}>Their unique link</div>
                <div style={{ fontSize:12, color:T.gold, wordBreak:"break-all", marginBottom:10, fontFamily:"monospace", background:T.bg, padding:"8px 10px", borderRadius:6 }}>{genLink}</div>
                <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.1em" }}>Their password</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text, fontFamily:"monospace", background:T.bg, padding:"8px 10px", borderRadius:6, marginBottom:12 }}>{genPassword}</div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn small primary onClick={()=>{ navigator.clipboard?.writeText(`Link: ${genLink}\nPassword: ${genPassword}`); setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2000); }}>{linkCopied?"✓ Copied!":"Copy both to clipboard"}</Btn>
                  <Btn small onClick={()=>{ setGenLink(""); setGenPassword(""); setNewName(""); setNewPassword(""); }}>Create another</Btn>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:"1.75rem" }}>
              {[["Active setters",mgmtSetters.length],["Avg completion",`${avgComp}%`],["Quizzes passed",`${passed}`,],["Shop floor ready",mgmtSetters.filter(s=>completionPct(s)>=90).length]].map(([l,v])=>(
                <div key={l} style={{ background:T.surf, borderRadius:10, padding:"1rem", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>{l}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:T.text }}>{v}</div>
                </div>
              ))}
            </div>
            <SectionLabel style={{ marginTop:0 }}>Setter progress</SectionLabel>
            {mgmtLoading ? <Alert variant="info">Loading setter data...</Alert>
            : mgmtSetters.length===0 ? <Alert variant="gold">No setters have logged in yet. Generate a unique link above and share it with your new hires.</Alert>
            : (
              <Card style={{ padding:"0.75rem 1.25rem" }}>
                {mgmtSetters.map((s,i)=>{
                  const pct=completionPct(s), avg=avgScore(s), good=avg!==null&&avg>=90;
                  const isExpanded = expandedSetter === s.id;
                  const lockedQuizzes = Object.entries(activeQuizzes).filter(([k])=>s.quizBlocked?.[k]);
                  const hasLocked = lockedQuizzes.length > 0;
                  return (
                    <div key={s.id} style={{ borderBottom:i<mgmtSetters.length-1?`1px solid ${T.border}`:"none", borderLeft:hasLocked?`3px solid ${T.red}`:"3px solid transparent", borderTopLeftRadius:0, borderBottomLeftRadius:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", flexWrap:"wrap", cursor:"pointer" }} onClick={()=>setExpandedSetter(isExpanded?null:s.id)}>
                        <Avatar initials={s.initials} size={36} />
                        <div style={{ flex:1, minWidth:100 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{s.name}</div>
                            {s.role && <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:99, background:s.role==="closer"?T.purpleBg:T.goldBg, color:s.role==="closer"?T.purpleTx:T.gold, textTransform:"uppercase" }}>{s.role}</span>}
                          </div>
                          <div style={{ fontSize:11, color:T.muted }}>Started {s.startDate} · {s.completedModules?.length||0}/{safeModuleCount(s)} modules</div>
                        </div>
                        {hasLocked && (
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:T.redBg, color:T.redTx }}>
                            🔒 {lockedQuizzes.length} assessment{lockedQuizzes.length>1?"s":""} locked
                          </span>
                        )}
                        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:avg===null?"rgba(122,130,160,0.1)":good?T.greenBg:T.redBg, color:avg===null?T.faint:good?T.greenTx:T.redTx }}>
                          {avg!==null?`Avg: ${avg}%`:"No quizzes yet"}
                        </span>
                        <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:80 }}>
                          <ProgressBar pct={pct} />
                          <div style={{ fontSize:10, color:T.faint, textAlign:"right" }}>{pct}%</div>
                        </div>
                        <div style={{ color:T.faint, fontSize:11, transition:"transform .2s", transform:isExpanded?"rotate(180deg)":"none" }}>▾</div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding:"12px 0 16px", borderTop:`1px solid ${T.border}` }}>
                          {hasLocked && (
                            <div style={{ background:T.redBg, border:`1px solid ${T.red}`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:T.redTx, marginBottom:8 }}>🔒 Locked assessments — click to unlock and reset attempts</div>
                              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                                {lockedQuizzes.map(([k,q])=>(
                                  <button key={k} onClick={()=>handleUnblockQuiz(s.id, k)}
                                    style={{ padding:"6px 14px", background:T.red, color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
                                    Unlock {q.icon} {q.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8, marginBottom:12 }}>
                            <div style={{ background:T.surf, borderRadius:8, padding:"8px 12px" }}>
                              <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.08em" }}>Full name</div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{s.name}</div>
                            </div>
                            <div style={{ background:T.surf, borderRadius:8, padding:"8px 12px" }}>
                              <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.08em" }}>Start date</div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{s.startDate}</div>
                            </div>
                            <div style={{ background:T.surf, borderRadius:8, padding:"8px 12px" }}>
                              <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.08em" }}>Current password</div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.gold, fontFamily:"monospace" }}>{s.password || "—"}</div>
                            </div>
                            <div style={{ background:T.surf, borderRadius:8, padding:"8px 12px" }}>
                              <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.08em" }}>Unique link</div>
                              <div style={{ fontSize:10, color:T.blueTx, wordBreak:"break-all", fontFamily:"monospace" }}>{window.location.href.split("#")[0]}#{s.setterId||s.id}</div>
                            </div>
                            <div style={{ background:T.surf, borderRadius:8, padding:"8px 12px" }}>
                              <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.08em" }}>Modules completed</div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{s.completedModules?.length||0} / {MODULES.length}</div>
                            </div>
                            <div style={{ background:T.surf, borderRadius:8, padding:"8px 12px" }}>
                              <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.08em" }}>Quiz average</div>
                              <div style={{ fontSize:13, fontWeight:600, color:avg!==null?(good?T.greenTx:T.redTx):T.faint }}>{avg!==null?`${avg}%`:"No quizzes taken"}</div>
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                            <Btn small onClick={()=>{ navigator.clipboard?.writeText(`${window.location.href.split("#")[0]}#${s.setterId||s.id}`); }}>Copy link</Btn>
                            <Btn small onClick={()=>{ navigator.clipboard?.writeText(s.password||""); }}>Copy password</Btn>
                            {deleteConfirm===s.id ? (
                              <>
                                <span style={{ fontSize:12, color:T.redTx, fontWeight:600 }}>Are you sure? This cannot be undone.</span>
                                <Btn small onClick={()=>handleDeleteAccount(s.id)} style={{ background:T.red, color:"#fff", border:"none" }}>Yes, delete</Btn>
                                <Btn small onClick={()=>setDeleteConfirm("")}>Cancel</Btn>
                              </>
                            ) : (
                              <Btn small onClick={()=>setDeleteConfirm(s.id)} style={{ color:T.redTx, borderColor:T.red }}>Delete account</Btn>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            )}
            {mgmtSetters.map(s => (
              <div key={s.id} style={{ marginTop:"1.25rem" }}>
                <SectionLabel style={{ marginTop:0 }}>{s.name} — quiz scores</SectionLabel>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:8, marginBottom:10 }}>
                  {Object.entries(QUIZZES).map(([k,q])=>{
                    const score=s.quizScores?.[k], good=score!==undefined&&score>=90;
                    return (
                      <div key={k} style={{ background:T.surf, borderRadius:10, padding:"0.85rem 1rem", border:`1px solid ${score!==undefined?(good?T.green:T.red):T.border}` }}>
                        <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>{q.icon} {q.label}</div>
                        <div style={{ fontSize:22, fontWeight:800, color:score===undefined?T.border:good?T.greenTx:T.redTx }}>{score!==undefined?`${score}%`:"—"}</div>
                      </div>
                    );
                  })}
                </div>
                {(s.feedback||[]).map((fb,i)=>(
                  <div key={i} style={{ background:T.purpleBg, border:`1px solid ${T.purple}`, borderRadius:8, padding:"8px 12px", fontSize:12, marginBottom:4, color:T.purpleTx }}>
                    <strong>{fb.type}</strong> ({fb.date}): {fb.message}
                  </div>
                ))}
              </div>
            ))}
            {mgmtSetters.length>0 && (
              <>
                <SectionLabel>Send coaching feedback</SectionLabel>
                <Card>
                  <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                    <select value={fbTarget} onChange={e=>setFbTarget(e.target.value)} style={{ background:T.surf, border:`1px solid ${T.border}`, color:T.text, padding:"8px 12px", fontSize:13, borderRadius:8, flex:1, minWidth:140 }}>
                      <option value="">Select setter...</option>
                      {mgmtSetters.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <select value={fbType} onChange={e=>setFbType(e.target.value)} style={{ background:T.surf, border:`1px solid ${T.border}`, color:T.text, padding:"8px 12px", fontSize:13, borderRadius:8, flex:1, minWidth:160 }}>
                      {["General coaching","KPI concern","Great performance","Needs re-training"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <textarea value={fbText} onChange={e=>setFbText(e.target.value)} placeholder="Add your coaching note or feedback..."
                    style={{ width:"100%", background:T.surf, border:`1px solid ${T.border}`, color:T.text, padding:"10px 12px", fontSize:13, borderRadius:8, resize:"vertical", minHeight:80, marginBottom:10 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn primary small onClick={sendFeedback} disabled={!fbText.trim()||!fbTarget}>Send feedback</Btn>
                    <Btn small onClick={()=>setFbText("")}>Clear</Btn>
                  </div>
                  {fbSent && <Alert variant="ok" style={{ marginTop:10 }}>✓ Feedback sent and saved to setter's profile.</Alert>}
                </Card>
                <SectionLabel>Reset setter password</SectionLabel>
                <Card>
                  <div style={{ fontSize:13, color:T.muted, marginBottom:"1rem", lineHeight:1.65 }}>Update a setter's password without affecting their progress, quiz scores, or module completions.</div>
                  <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                    <select value={resetTarget} onChange={e=>setResetTarget(e.target.value)} style={{ background:T.surf, border:`1px solid ${T.border}`, color:T.text, padding:"8px 12px", fontSize:13, borderRadius:8, flex:1, minWidth:140 }}>
                      <option value="">Select setter...</option>
                      {mgmtSetters.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <label style={{ fontSize:11, fontWeight:700, color:T.faint, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>New password</label>
                  <Input value={resetPassword} onChange={e=>setResetPassword(e.target.value)} placeholder="Enter new password" style={{ marginBottom:10 }} />
                  <Btn primary small onClick={handleResetPassword} disabled={!resetPassword.trim()||!resetTarget}>Reset password</Btn>
                  {resetDone && <Alert variant="ok" style={{ marginTop:10 }}>✓ Password updated. The setter can now log in with their new password.</Alert>}
                </Card>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  const TABS = [{id:"home",label:"Home"},{id:"training",label:"Training"},{id:"scripts",label:"Scripts"},{id:"sops",label:"SOPs"},{id:"kpis",label:"KPIs"},{id:"assessments",label:"Assessments"}];
  const totalItems = role==="closer" ? (CLOSER_MODULES.length + Object.keys(CLOSER_QUIZZES).length) : (MODULES.length + Object.keys(QUIZZES).length);
  const doneItems = (setterData?.completedModules?.length||0)+Object.keys(setterData?.quizScores||{}).length;
  const pct = totalItems > 0 ? Math.round((doneItems/totalItems)*100) : 0;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:"1.5rem 2rem" }} className="fade">
      <div style={{ maxWidth:1000, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, paddingBottom:"1.25rem", borderBottom:`1px solid ${T.border}`, marginBottom:"1.5rem", flexWrap:"wrap" }}>
          <RMALogo size={20} />
          <div style={{ width:1, height:20, background:T.border, flexShrink:0 }} />
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
            {TABS.map(t=>(
              <button key={t.id} className={`tab-btn ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:"auto" }}>
            <button
              onClick={()=>{ window.location.hash="mgmt"; setScreen("mgmt"); }}
              title="Management access"
              style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:T.faint, fontSize:15, transition:"all .2s", flexShrink:0 }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.color=T.gold; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.faint; }}
            >🔒</button>
            <button onClick={()=>setScreen("role_select")} style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, background:role==="closer"?T.purpleBg:T.goldBg, color:role==="closer"?T.purpleTx:T.gold, border:"none", cursor:"pointer", fontFamily:"'DM Sans',system-ui,sans-serif" }}>{role==="closer"?"🤝 Closer":"⚡ Setter"}</button>
            <Avatar initials={setterData?.initials} size={30} />
            <div style={{ fontSize:12, fontWeight:600, color:T.muted }}>{setterData?.name}</div>
          </div>
        </div>

        {activeTab==="home" && (
          <div>
            <div style={{ background:`linear-gradient(135deg,${T.card},#1E2335)`, borderRadius:16, border:`1px solid ${T.border}`, padding:"1.75rem", marginBottom:"1.25rem", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:T.goldBg, filter:"blur(40px)", pointerEvents:"none" }} />
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:"1.25rem" }}>
                <Avatar initials={setterData?.initials} size={52} />
                <div>
                  <div style={{ fontSize:20, fontWeight:800, color:T.text }}>Welcome, {setterData?.name?.split(" ")[0]}.</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{role==="closer"?"Sales Closer Onboarding · 9-Module Programme":"Sales Setter Onboarding · 10-Day Programme"}</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:T.muted, fontWeight:600 }}>Overall progress</span>
                <span style={{ fontSize:13, fontWeight:800, color:T.gold }}>{pct}%</span>
              </div>
              <ProgressBar pct={pct} height={6} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:8, marginBottom:"1.5rem" }}>
              {[["Programme","10 days","3 phases"],[`Modules`,`${setterData?.completedModules?.length||0}/${MODULES.length}`,"completed"],[`Quizzes`,`${Object.values(setterData?.quizScores||{}).filter(s=>s>=90).length}/${Object.keys(activeQuizzes).length}`,"passed"],["Score",avgScore(setterData)!==null?`${avgScore(setterData)}%`:"—","avg"]].map(([l,v,s])=>(
                <div key={l} style={{ background:T.surf, borderRadius:10, padding:"0.9rem 1rem", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.faint, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:T.text }}>{v}</div>
                  <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{s}</div>
                </div>
              ))}
            </div>
            <SectionLabel style={{ marginTop:0 }}>Role overview</SectionLabel>
            <Card>
              {[["Position","Sales Executive (Setter Role)"],["Location","Showroom 3, Speedex Centre, DIP 1, Dubai"],["Reports to","Sales Manager"],["Shifts","06:00–15:00 or 15:00–00:00"],["Probation","6 months"],["Lead handover","To Closer after 72 hours"],["3-month review","Pathway to Closer assessed"]].map(([l,v],i,a)=>(
                <InfoRow key={l} label={l} value={v} last={i===a.length-1} />
              ))}
            </Card>
            {setterData?.feedback?.length>0 && (
              <>
                <SectionLabel>Feedback from management</SectionLabel>
                {setterData.feedback.map((fb,i)=>(
                  <div key={i} style={{ background:T.purpleBg, border:`1px solid ${T.purple}`, borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:6, color:T.purpleTx }}>
                    <strong>{fb.type}</strong> <span style={{ color:T.muted }}>({fb.date})</span> — {fb.message}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab==="training" && (
          <div>
            {[1,2,3].map(phase=>{
              const labels=["Phase 1 — Foundation","Phase 2 — CRM Mastery","Phase 3 — Live Operations"];
              return (
                <div key={phase}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, margin:phase===1?"0 0 10px":"1.5rem 0 10px" }}>
                    <div style={{ width:2, height:14, background:T.gold, borderRadius:1 }} />
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:T.gold, textTransform:"uppercase" }}>{labels[phase-1]}</div>
                  </div>
                  {MODULES.filter(m=>m.phase===phase).map(mod=>{
                    const done=setterData?.completedModules?.includes(mod.id), unlocked=isUnlocked(mod,setterData?.completedModules||[]), open=expandedMod===mod.id;
                    return (
                      <div key={mod.id} className="mod-card" style={{ background:T.card, borderRadius:12, marginBottom:8, border:`1px solid ${open?T.borderLt:T.border}`, borderLeft:`3px solid ${done?T.green:open?T.gold:T.border}`, borderTopLeftRadius:0, borderBottomLeftRadius:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0.9rem 1.1rem" }} onClick={()=>setExpandedMod(open?null:mod.id)}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{mod.day} — {mod.title}</div>
                            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{mod.items.length} checklist items</div>
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:done?T.greenBg:!unlocked?"rgba(122,130,160,0.1)":T.goldBg, color:done?T.greenTx:!unlocked?T.faint:T.gold }}>
                            {done?"✓ Complete":!unlocked?"🔒 Locked":"In progress"}
                          </span>
                          <div style={{ color:T.faint, fontSize:12, transition:"transform .2s", transform:open?"rotate(180deg)":"none" }}>▾</div>
                        </div>
                        {open && (
                          <div style={{ padding:"0 1.1rem 1rem", borderTop:`1px solid ${T.border}`, paddingTop:"0.85rem" }}>
                            <ul style={{ listStyle:"none", padding:0, margin:0, marginBottom:12 }}>
                              {mod.items.map((item,i)=>(
                                <li key={i} style={{ display:"flex", gap:10, fontSize:12, padding:"5px 0", borderBottom:`1px solid ${T.border}`, color:T.muted, lineHeight:1.55, alignItems:"flex-start" }}>
                                  <span style={{ color:done?T.green:T.faint, flexShrink:0, marginTop:1, fontWeight:700 }}>{done?"✓":"·"}</span>
                                  <span style={{ color:done?T.text:T.muted }}>{item}</span>
                                </li>
                              ))}
                            </ul>
                            {unlocked ? <Btn small primary={!done} onClick={()=>toggleModule(mod.id)}>{done?"Mark incomplete":"Mark as complete ✓"}</Btn>
                            : <div style={{ fontSize:12, color:T.faint, fontStyle:"italic" }}>Complete the previous module to unlock.</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {activeTab==="scripts" && (
          <div>
            <div style={{ background:T.goldBg, border:`1px solid ${T.goldDim}`, borderRadius:10, padding:"12px 16px", marginBottom:"1.25rem" }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.gold, marginBottom:4 }}>📹 Training videos</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:10, lineHeight:1.6 }}>Paste a YouTube or Vimeo URL to add training videos to this section. Videos are added by your manager — ask them to update the platform when new videos are available.</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {[{label:"Setter Framework walkthrough",url:""},{label:"Objection handling masterclass",url:""},{label:"CRM live demo",url:""},{label:"BAMFAM sequence explained",url:""}].map(v=>(
                <div key={v.label} style={{ background:T.surf, borderRadius:8, padding:"10px 14px", border:`1px solid ${T.border}`, flex:"1 1 200px" }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.muted, marginBottom:6 }}>📽 {v.label}</div>
                  {v.url ? (
                    <iframe src={v.url.replace("watch?v=","embed/").replace("youtu.be/","youtube.com/embed/")} style={{ width:"100%", aspectRatio:"16/9", border:"none", borderRadius:6 }} allowFullScreen title={v.label} />
                  ) : (
                    <div style={{ background:T.bg, borderRadius:6, padding:"20px", textAlign:"center", fontSize:11, color:T.faint }}>Video not yet uploaded — check with your manager</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:T.redBg, border:`1px solid ${T.red}`, borderRadius:10, padding:"12px 16px", marginBottom:"1.25rem" }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.redTx, marginBottom:4 }}>⚠️ Setter rule — pricing</div>
            <div style={{ fontSize:13, color:T.text, lineHeight:1.65 }}>The <strong>best price will only be discussed in person</strong>. Your job as a setter is to build maximum value, get the appointment booked, and hand over to the Closer. The Closer works with the Sales Manager to get the customer the best deal on the day. Do not quote final prices or negotiate over the phone.</div>
          </div>
          <SectionLabel style={{ marginTop:0 }}>8-step setter framework — full conversational examples</SectionLabel>
            {[
              ["Step 1 — Connection","Open with energy. Confirm who they are and what they enquired about.",
`Setter: "Yeah hi [Name], this is [Your Name] from RMA Motors — you reached out about the [Car Model] earlier, right?"
Customer: "Yeah that's me."
Setter: "Perfect, glad I caught you. I've actually just been standing in front of the car — it's a great spec. Got a couple of minutes so I can tell you more about it?"`],
              ["Step 2 — Clarify interest","Find out specifically what drew them to this car. Do not assume.",
`Setter: "Just so I understand properly — what was it about the [Car Model] that caught your eye? The spec, the mileage, the price?"
Customer: "Mainly the price and mileage to be honest."
Setter: "That makes sense — it's one of the best-priced options we've had for that spec. The mileage is really clean too. How long have you been looking?"`],
              ["Step 3 — Discovery","Qualify on budget, timeline, current car, and priorities. Listen more than you talk.",
`Setter: "What are you driving at the moment?"
Customer: "A 2019 Camry."
Setter: "Are you looking to sell it or keeping it? And timing-wise — actively looking in the next couple of weeks or more of a right-deal-comes-along situation?"
Customer: "Actively looking if the right car comes up."
Setter: "Perfect. And budget — cash or would you explore finance?"`],
              ["Step 4 — Position RMA","Build trust. Be transparent before they even ask.",
`Setter: "One thing that matters to a lot of our buyers — we're fully upfront about the car's history before you even come in. Every car is inspected before we list it. No surprises when you arrive. That's the RMA difference."`],
              ["Step 5 — Sell the appointment","Sell the visit, not the car.",
`Setter: "Here's what I'd suggest — come in, have a proper look, go through the history with me, see how it feels in person. We can also run through finance options and talk about our RMA PPF paint protection — most of our customers add it to keep the car in showroom condition. Takes about 45 minutes and you'll know exactly where you stand."
Customer: "Yeah that works."
Setter: "Great — let's get that locked in."`],
              ["Step 6 — Verbal commitment","Get their word. This is the single biggest lever for improving show rates.",
`Setter: "Before I put it in the diary — can I get your word that you'll show up? I ask everyone this because I want to hold that slot for you and not show the car to anyone else at that time. If anything comes up, just message me and we'll move it. But I need that commitment."
Customer: "Yes, I'll be there."
Setter: "Perfect — I appreciate that."`],
              ["Step 7 — Confirmation","Lock in all details and update CRM immediately.",
`Setter: "So we're confirmed — [Day] at [Time], Showroom 3, Speedex Centre, DIP 1. I'll send you the location on WhatsApp now. Car will be ready and waiting. Any questions before then, message me directly on this number."
→ Update CRM to 'Appointment Booked' immediately. Set reminder for pre-appointment message.`],
              ["Step 8 — Pre-appointment reinforcement","Send the day before. Video is more personal than text.",
`"Hey [Name] — just confirming we're on for tomorrow at [time]. The [Car Model] is ready for you. You mentioned [what they said] — I think you'll like it. See you tomorrow. Any issues, message me here."
→ Send as a Snap Cell video filmed in front of the car if possible.`]
            ].map(([l,sub,t])=>(
              <div key={l} style={{ borderLeft:`2px solid ${T.gold}`, padding:"0.9rem 0.9rem 0.9rem 1rem", marginBottom:8, borderRadius:"0 8px 8px 0", background:T.goldBg, border:`1px solid ${T.goldDim}`, borderLeftWidth:2 }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.gold, marginBottom:2, textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
                <div style={{ fontSize:11, color:T.goldLt, marginBottom:6, fontWeight:500 }}>{sub}</div>
                <div style={{ fontSize:12, color:T.muted, lineHeight:1.75, fontFamily:"monospace", whiteSpace:"pre-line", background:T.bg, padding:"8px 10px", borderRadius:6 }}>{t}</div>
              </div>
            ))}
            <SectionLabel>BAMFAM follow-up sequence — no answer</SectionLabel>
            <div style={{ fontSize:12, color:T.muted, marginBottom:12, lineHeight:1.65 }}>When a lead does not answer after x2 double dial, send these messages in sequence over 15 days. Space them out — do not send all at once.</div>
            {[
              ["Message 1 — Intro (send immediately) + Snap Cell","Send a personalised Snap Cell video immediately alongside this message.",
`"Hi [Name], tried giving you a quick call because I saw you reached out about the [Car Model]. I've got a few minutes now, or later today if that works? If you have any questions, just message me here."

→ Send a personalised Snap Cell video immediately — filmed in front of the specific car they enquired about, face visible. This significantly increases the chance of a callback.`],
              ["Message 2 — Education (Day 2)","Send your intro/process video asset.",
`"Hi [Name], [Your Name] from RMA Motors. Thought this might be useful — shows you how we do business here and the process of buying a car with us. [INSERT ASSET VIDEO]"`],
              ["Message 3 — Authority (Day 4)","Send your 'avoid costly mistakes' video.",
`"The video explains how to avoid costly mistakes when buying a car in the UAE. This usually comes down to dealerships not being fully transparent about the car's history. Put together a short video showing what to look out for. [INSERT ASSET VIDEO]"`],
              ["Message 4 — FAQ (Day 7)","Answer questions they haven't asked yet.",
`"Some of the most common questions buyers have here at RMA:
'What should I check when buying this model?'
'How does financing normally work?'
'What affects resale value?'
Short answer: [Insert answer]. Quick video explains it in more detail. [SEND VIDEO]"`],
              ["Message 5 — Product (Day 10)","Present a relevant vehicle.",
`"This just came across my desk. Thought it would help if you haven't found what you're looking for.

[Car Model] [Year]
KM: [Mileage]
AED [Price]
[INSERT LINK — let it load for image preview]"`],
              ["Message 6 — Final reopener (Day 15)","Keep it short.",
`"Hi [Name], tried contacting you but didn't hear back… Where should we go from here?"`],
              ["Manager close — if still no response","A manager stepping in creates a fresh conversation.",
`"Hi [Name], [Sales Rep] looped me in. What do we need to do on our side to get this deal wrapped up for you? — [Manager Name]"

Alternative: "Hi [Name], what would need to happen for us to get this sorted for you in the best way possible? — [Manager Name]"`]
            ].map(([l,sub,t])=>(
              <div key={l} style={{ borderLeft:`2px solid ${T.purple}`, padding:"0.9rem 0.9rem 0.9rem 1rem", marginBottom:8, borderRadius:"0 8px 8px 0", background:T.purpleBg, border:`1px solid ${T.purple}`, borderLeftWidth:2 }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.purpleTx, marginBottom:2, textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
                {sub && <div style={{ fontSize:11, color:T.muted, marginBottom:6, fontWeight:500 }}>{sub}</div>}
                <div style={{ fontSize:12, color:T.muted, lineHeight:1.75, fontFamily:"monospace", whiteSpace:"pre-line", background:T.bg, padding:"8px 10px", borderRadius:6 }}>{t}</div>
              </div>
            ))}
            <SectionLabel>Objection handling — conversational examples</SectionLabel>
            {[
              [T.amber,T.amberBg,T.amberTx,"Stall — 'I need to think about it'","Find what they're actually thinking about. Goal is clarity, not pressure.",
`Customer: "I just need to think about it."
Setter: "Of course — do you mind if I ask what part specifically? Is it the car itself, the price, the timing?"
Customer: "Mainly the price."
Setter: "Makes sense. Is it that it's over budget, or more that you want to make sure you're getting the best value?"
→ Now you have the real objection. Handle that specifically.

Also try: "If everything felt right with the car and the price was where you needed it — would you move forward?"`],
              [T.amber,T.amberBg,T.amberTx,"Price — 'It's too expensive' or 'Found it cheaper'","Never drop price without manager approval. Anchor value first.",
`Customer: "I've seen the same car cheaper elsewhere."
Setter: "Same year, spec, and mileage?"
Customer: "Pretty similar."
Setter: "Can I ask — if the prices were the same, which would you choose?"
Customer: "Probably yours to be honest."
Setter: "So the question is whether the difference is worth the peace of mind. Here's what's included with ours... [history, inspection, warranty]."

Also try: "That company is cheaper — what's stopping you from just buying from them?"

DD Pro angle: "I can actually pull up that car's full history right now. [Run DD Pro report] — that car has been in stock for X days compared to ours which has only been here X days. When a car sits that long it usually means something is putting buyers off — could be a hidden issue, could be an overpriced spec. Ours is fresh stock for a reason."`],
              [T.amber,T.amberBg,T.amberTx,"Decision maker — 'Need to speak to my wife/husband'","Include them, don't fight them.",
`Customer: "I need to run it past my wife first."
Setter: "Totally understand — big purchase. Would it help if I sent a quick video so she can see exactly what you're looking at?"
Customer: "Yeah that could work."
Setter: "And would you want to bring her in when you come? Or a WhatsApp group with the three of us so she can ask questions directly?"
Goal: keep the conversation alive and include the decision maker.

Luxury item approach:
Setter: "That's a nice watch/bag — did your husband/wife know you were going to buy that?"
Customer: "Yes actually."
Setter: "So if she trusted you to make that purchase, it's fair to assume she trusts you to make this one too — especially since you clearly have great taste." [smile]
Customer: "Ha — fair point."
→ Use warmly and with humour. Works well when the customer is clearly confident and the spouse objection feels like an excuse.`],
              [T.green,T.greenBg,T.greenTx,"Show rate — 'I'll try to make it'","'Try' means no commitment. Push for a real yes.",
`Customer: "Yeah I'll try to come in Thursday."
Setter: "Okay great — Thursday is actually my day off but I will make sure I am here at [time] to show you the car personally and make sure you get the best deal. Can I get your word you'll be there? I'll have the car ready and won't show it to anyone else at that time. If anything comes up just message me — but I need that commitment."
Customer: "Yes, I'll be there."
Setter: "Perfect — you're confirmed for Thursday at [time]."`],
              [T.green,T.greenBg,T.greenTx,"Where did we lose you? — re-engagement","When a customer goes silent after showing interest.",
`"Hi [Name], if you're not opposed — could you send me 1-2 sentences on where we lost you? I'd appreciate it so we can improve. Thank you — [Your Name]"

If they reply with an objection:
"That makes sense. The way we usually handle that is [answer clearly]. Would it be worth a quick 5-minute call to walk through it?"`]
            ].map(([acc,bg,tc,l,sub,t])=>(
              <div key={l} style={{ borderLeft:`2px solid ${acc}`, padding:"0.9rem 0.9rem 0.9rem 1rem", marginBottom:8, borderRadius:"0 8px 8px 0", background:bg, border:`1px solid ${acc}`, borderLeftWidth:2 }}>
                <div style={{ fontSize:10, fontWeight:700, color:tc, marginBottom:2, textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:6, fontWeight:500 }}>{sub}</div>
                <div style={{ fontSize:12, color:T.muted, lineHeight:1.75, fontFamily:"monospace", whiteSpace:"pre-line", background:T.bg, padding:"8px 10px", borderRadius:6 }}>{t}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab==="sops" && (
          <div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"0.75rem" }}>
              {[["sales","Sales process"],["crm","CRM stages"],["fi","Finance & admin"],["handover","Handover"],["stock","Stock & pricing"],["marketing","Marketing"],["ppf","RMA PPF"],["disciplinary","Disciplinary"]].map(([id,label])=>(
                <button key={id} className={`sub-tab ${activeSop===id?"active":""}`} onClick={()=>setActiveSop(id)}>{label}</button>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:"1.25rem", padding:"10px 12px", background:T.goldBg, borderRadius:8, border:`1px solid ${T.goldDim}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.gold, width:"100%", marginBottom:4 }}>📄 Download SOP documents — open, save, and print</div>
              {[
                ["Sales Process","RMA-Motors-Sales-Process-SOP.docx"],["RMA PPF Upsell","RMA-Motors-PPF-Upsell-SOP.docx"],
                ["CRM Stages","RMA-Motors-CRM-Stages-SOP.docx"],
                ["Finance & Admin","RMA-Motors-Finance-Admin-SOP.docx"],
                ["Handover","RMA-Motors-Vehicle-Handover-SOP.docx"],
                ["Stock & Pricing","RMA-Motors-Stock-Pricing-SOP.docx"],
                ["Marketing","RMA-Motors-Marketing-SOP.docx"],
              ].map(([label, file])=>(
                <a key={label} href={`/${file}`} download={file}
                  style={{ fontSize:11, fontWeight:600, padding:"5px 12px", borderRadius:6, background:T.card, border:`1px solid ${T.goldDim}`, color:T.gold, textDecoration:"none", display:"flex", alignItems:"center", gap:5 }}>
                  ↓ {label}
                </a>
              ))}
            </div>
            {activeSop==="sales" && (<div>
              {[
                { n:"Step 1", title:"Lead entry & data integrity", points:[
                  "ALL leads must be entered into Eskimo CRM immediately upon receipt.",
                  "Full contact details, enquiry source, and vehicle interest are required.",
                  "The original lead source must NEVER be changed once entered.",
                  "If the source is unknown, ask the customer during first contact and update immediately.",
                  "100% CRM hygiene is a KPI — every note, task, and pipeline stage must be updated accurately and in real time.",
                ]},
                { n:"Step 2", title:"Rapid lead response — 60 seconds", points:[
                  "Respond to ALL new inbound leads within 60 seconds during your assigned coverage shift.",
                  "For overnight or out-of-shift leads: contact within 30 minutes of the start of your next shift.",
                  "Use approved sales messaging frameworks across WhatsApp, phone, and social media.",
                  "Send a personalised Snap Cell video within 5 minutes of the first call — filmed in front of the specific car, face visible.",
                ]},
                { n:"Step 3", title:"Qualification & discovery", points:[
                  "Follow the setter framework: respond within 60 seconds, send a personalised Snap Cell and intro message immediately.",
                  "Work the lead using the 8-step framework — qualify, build rapport, and book the appointment.",
                  "Send the customer a WhatsApp poll with 3–4 specific day and time options (e.g. Tuesday 2:15pm, Wednesday 3:40pm, Thursday 4:20pm) — this removes back-and-forth and makes it easy for the customer to commit.",
                  "Use the BAMFAM follow-up sequence if there is no immediate response.",
                  "If there is still no conversion after 72 hours, pass the lead cleanly to a Closer or Sweeper.",
                  "Ensure all CRM notes are fully updated before handover.",
                  "Conversion target: minimum 33% of responded leads result in a booked appointment.",
                ]},
                { n:"Step 4", title:"Appointment setting & show rate", points:[
                  "Convert leads into showroom or video appointments.",
                  "Always book at a specific, unusual time — e.g. 2:15pm, 3:20pm, 4:40pm — never on the hour. This makes the appointment feel more deliberate and personal.",
                  "Once a time is agreed, create a WhatsApp Event in the group chat — set the title (e.g. 'Your RMA Motors Appointment'), date, time, and location. The customer can RSVP directly, which dramatically increases accountability.",
                  "Secure verbal commitment: 'Can I get your word that you will show up? If anything changes, just message me and we will reschedule.'",
                  "Send pre-appointment reinforcement the day before — video or text.",
                  "Target: minimum 66% appointment show rate.",
                ]},
                { n:"Step 5", title:"No answer — BAMFAM follow-up sequence", points:[
                  "After x2 double dial with no answer: send SMS intro immediately.",
                  "Follow the structured 6-message sequence over 15 days: educational video, authority/expert video, FAQ video, product with link, social proof, and final reopener.",
                  "BAMFAM = Book A Meeting From A Meeting.",
                  "Every interaction must end with a confirmed next step.",
                  "See the Scripts tab for full message templates.",
                ]},
              ].map(({n, title, points}) => {
                const key = n;
                const isOpen = openStep === key;
                return (
                  <div key={key} style={{ background:T.surf, borderRadius:10, marginBottom:6, borderLeft:`2px solid ${isOpen?T.gold:T.border}`, borderTopLeftRadius:0, borderBottomLeftRadius:0, transition:"border-color .2s" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0.85rem 1rem", cursor:"pointer" }} onClick={()=>setOpenStep(isOpen?null:key)}>
                      <div style={{ fontSize:9, fontWeight:700, color:T.faint, textTransform:"uppercase", letterSpacing:"0.08em", width:44, flexShrink:0 }}>{n}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text, flex:1 }}>{title}</div>
                      <div style={{ color:T.faint, fontSize:11, transition:"transform .2s", transform:isOpen?"rotate(180deg)":"none" }}>▾</div>
                    </div>
                    {isOpen && (
                      <div style={{ padding:"0 1rem 0.85rem", borderTop:`1px solid ${T.border}` }}>
                        <ul style={{ listStyle:"none", padding:0, margin:"0.75rem 0 0" }}>
                          {points.map((pt,i)=>(
                            <li key={i} style={{ display:"flex", gap:8, fontSize:12, padding:"5px 0", borderBottom:i<points.length-1?`1px solid ${T.border}`:"none", color:T.muted, lineHeight:1.6, alignItems:"flex-start" }}>
                              <span style={{ color:T.gold, flexShrink:0, fontWeight:700, marginTop:1 }}>→</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
              {[
                { n:"Step 6", title:"Lead handover to Closer", points:[
                  "Brief the Closer fully before any customer contact — share the customer's name, vehicle interest, objections raised, any commitments made, and the full CRM note history.",
                  "Create a WhatsApp group with the Closer, the Setter, and the customer. The Setter introduces the Closer personally — this keeps the relationship warm.",
                  "Warm introduction script: 'Hi [Customer Name], I wanted to personally introduce you to [Closer Name] who is going to be taking great care of you from here. [Closer], meet [Customer] — they've been looking at the [Car Model] and are a great fit.' Never do a cold handover.",
                  "Let the customer know the next steps: 'From here, [Closer Name] will be your main point of contact. They'll walk you through everything — the car, any finance options, and getting you the best possible deal.'",
                  "The Closer sends a personalised video message to the customer — filmed in front of the car. Covering: warm intro, quick walkthrough, confirmation of next steps, and how to reach them directly.",
                ]},
                { n:"Step 7", title:"Post-sale & aftersales", points:[
                  "24-hour follow-up call after handover — check in with the Closer to understand how the experience went.",
                  "Confirm the customer is fully satisfied before requesting any reviews.",
                  "Request a Google Review and Trustpilot review.",
                  "Customer enters the aftersales pipeline: 6, 12, 18, and 24-month check-ins.",
                ]},
              ].map(({n, title, points}) => {
                const isOpen = openStep === n;
                return (
                  <div key={n} style={{ background:T.surf, borderRadius:10, marginBottom:6, borderLeft:`2px solid ${isOpen?T.gold:T.border}`, borderTopLeftRadius:0, borderBottomLeftRadius:0, transition:"border-color .2s" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0.85rem 1rem", cursor:"pointer" }} onClick={()=>setOpenStep(isOpen?null:n)}>
                      <div style={{ fontSize:9, fontWeight:700, color:T.faint, textTransform:"uppercase", letterSpacing:"0.08em", width:44, flexShrink:0 }}>{n}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text, flex:1 }}>{title}</div>
                      <div style={{ color:T.faint, fontSize:11, transition:"transform .2s", transform:isOpen?"rotate(180deg)":"none" }}>▾</div>
                    </div>
                    {isOpen && (
                      <div style={{ padding:"0 1rem 0.85rem", borderTop:`1px solid ${T.border}` }}>
                        <ul style={{ listStyle:"none", padding:0, margin:"0.75rem 0 0" }}>
                          {points.map((pt,i)=>(
                            <li key={i} style={{ display:"flex", gap:8, fontSize:12, padding:"5px 0", borderBottom:i<points.length-1?`1px solid ${T.border}`:"none", color:T.muted, lineHeight:1.6, alignItems:"flex-start" }}>
                              <span style={{ color:T.gold, flexShrink:0, fontWeight:700, marginTop:1 }}>→</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
              <Alert variant="warn">⚠️ All discounts must be authorised by GM/Naz (Directors) only. No verbal approvals are valid under any circumstances.</Alert>
              <Alert variant="info">📞 Answer all incoming calls within 3 rings. Complete a minimum of 40 connected outbound calls per day, each lasting at least 1 minute.</Alert>
              <div style={{ marginTop:"1rem" }}>
                <SectionLabel style={{ marginTop:0 }}>AI Call Scoring — Inbound Leads</SectionLabel>
                <div style={{ fontSize:13, color:T.muted, marginBottom:10, lineHeight:1.65 }}>Every inbound call is monitored and scored by the CallGear AI system. You must maintain an average score of <strong style={{ color:T.gold }}>80% or above</strong>. The AI tracks the following 10 key points on every inbound lead call:</div>
                <div style={{ background:T.surf, borderRadius:10, padding:"1rem", border:`1px solid ${T.border}`, marginBottom:10 }}>
                  {[
                    ["1","Employee Introduction","Introduced yourself by time of day (morning, afternoon, or evening), stated the business name, and gave your name."],
                    ["2","Establish Customer Name","The customer's name is clearly established and used appropriately throughout the call."],
                    ["3","Build Rapport — Get to Know the Customer","Found out information about the customer — where they are from, location (Dubai, Abu Dhabi, etc.), what they do for work, and general conversation to build rapport."],
                    ["4","Part Exchange & Finance","Found out if there is a part exchange and whether the customer requires finance or not."],
                    ["5","Lead Source","Asked the customer where they saw RMA Motors advertised — which platform or source brought them to us."],
                    ["6","Vehicle of Interest","Identified the specific car the customer is interested in. If that vehicle is unavailable, offered a suitable alternative."],
                    ["7","Book the Appointment","Asked for the appointment — the setter books and sets the appointment. The sales person is responsible for confirming and managing it."],
                    ["8","Offered a Video Walkthrough","Offered the customer a full video walk-through of the car to build excitement and engagement before the visit."],
                    ["9","Sent the Location","Sent the customer the showroom location details — Showroom 3, Speedex Centre, DIP 1, Dubai."],
                    ["10","Qualify and Reserve","If the customer is qualified, asked if they would like to reserve the car and leave a deposit to secure it."],
                  ].map(([n,title,desc])=>(
                    <div key={n} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", background:T.goldBg, color:T.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, color:T.text, marginBottom:2 }}>{title}</div>
                        <div style={{ color:T.muted, lineHeight:1.55 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Alert variant="gold">Your Communication Score is calculated from these 10 points and reviewed by management. Scores below 80% average will trigger coaching and retraining.</Alert>
              </div>
            </div>)}
            {activeSop==="crm" && (<div><Card style={{ padding:"0.75rem 1.25rem" }}>{CRM_STAGES.map((s,i)=>(<div key={i} style={{ display:"flex", gap:12, padding:"9px 0", borderBottom:i<CRM_STAGES.length-1?`1px solid ${T.border}`:"none", alignItems:"flex-start" }}><div style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0, marginTop:4 }} /><div style={{ width:145, flexShrink:0 }}><span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.label}</span></div><div style={{ fontSize:12, color:T.muted, lineHeight:1.5 }}>{s.desc}</div></div>))}</Card><Alert variant="info">Update CRM stages immediately and accurately. 100% CRM hygiene is a measured KPI.</Alert></div>)}
            {activeSop==="fi" && (<div><StepBlock n="Step 1" title="Deal handover — Sales to F&I" accent={T.blue} desc="3 signed deal sheet copies (customer, F&I, Accounts) + customer Emirates ID + Visa copy + completed finance enquiry form. All must be completed on the same day as the deal. Must be complete before F&I submission." /><StepBlock n="Steps 2–3" title="Bank quotation & approval" accent={T.blue} desc="F&I prepares quotation exactly as per deal sheet, emails banker. Once approved, F&I applies for insurance." /><StepBlock n="Step 4" title="LPO received → upsell + agreements" accent={T.blue} desc="LPO triggers agreed upsell works: PPF, extended warranty, window tints, ceramic coating — all agreed additional works initiated now. F&I prepares the Sales Agreement (consignment) or Hayaza mortgage request (RMA-owned)." /><StepBlock n="Steps 5–12" title="RTA → PDI → Car Care → E-Cert → Notify" accent={T.blue} desc="Vehicle sent for RTA inspection first, then PDI. F&I coordinates Car Care (PPF, ceramics, tints, detailing). Creates E-Certificate in RTA portal. Notifies Sales Rep and customer once registration complete." /></div>)}
            {activeSop==="handover" && (<div><StepBlock title="Vehicle preparation" desc="Full valet · PDI completed · no warning lights · AC working · min ¼ tank fuel · no paired Bluetooth · no saved driver profiles · no stored satnav locations · no saved radio stations · clean to showroom standard." /><StepBlock title="Scheduling" desc="ONE customer per hour maximum. Confirm readiness with Car Care. Keep the Marketing team updated and ensure they are available for the handover — they must be present for photos and video. Park in designated handover bay 30 minutes before." /><StepBlock title="The reveal" desc="Marketing present for photos and video content. Keys and gift handed over. Manager delivers formal 'Thank you'. Sales Representative must ask for referrals at this stage — friends, family, or colleagues who may be looking for a vehicle. This is a warm introduction opportunity. Handover sheet signed off by the Department Manager." /><StepBlock title="Post-handover" desc="Call or message within 48 hours. Check in with the Closer on how the experience went. Confirm customer satisfaction. Request Google Review and Trustpilot review. Customer enters 6/12/18/24-month check-in pipeline." /></div>)}
            {activeSop==="stock" && (<div><SectionLabel style={{ marginTop:0 }}>Age-based discount ladder</SectionLabel><Card style={{ padding:"0.75rem 1.25rem", marginBottom:"1rem" }}>{[["0–14 days","Full retail — 0–1% max",T.green],["15–30 days","Soft adjust — 1–2%",T.green],["31–45 days","Tactical — 2–3%",T.amber],["46–60 days","Defensive — 3–5% (must sell soon)",T.amber],["61–75 days","Aggressive — 5–7%",T.red],["75–90 days","Aggressive — 5–7% (capital risk high)",T.red],
              ["90+ days","Exit — whatever clears. Auction, trade, or wholesale.",T.red]].map(([d,a,c])=>(<div key={d} style={{ display:"flex", gap:10, padding:"7px 0", borderBottom:`1px solid ${T.border}`, fontSize:12 }}><div style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0, marginTop:3 }} /><div style={{ width:90, fontWeight:700, color:T.text, flexShrink:0 }}>{d}</div><div style={{ color:T.muted }}>{a}</div></div>))}</Card><Alert variant="warn">⚠️ Never discount below minimum GP without written approval from the Purchasing Manager or General Manager.</Alert></div>)}
            {activeSop==="ppf" && (<div>
              <div style={{ background:T.goldBg, border:`1px solid ${T.goldDim}`, borderRadius:10, padding:"12px 16px", marginBottom:"1rem" }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.gold, marginBottom:4 }}>RMA PPF — Paint Protection Film</div>
                <div style={{ fontSize:12, color:T.muted, lineHeight:1.65 }}>RMA PPF is a key upsell/SPV opportunity on every vehicle sale. Introduce it during every appointment as part of the handover and closing conversation. Best price discussed in person only.</div>
              </div>
              <SectionLabel style={{ marginTop:0 }}>Protection packages</SectionLabel>
              <Card style={{ padding:"0.75rem 1.25rem", marginBottom:10 }}>
                {[
                  ["Essential","Full Body PPF only. Entry-level protection for budget-conscious buyers.","—","—"],
                  ["Elite","Full Body PPF + Interior PPF + Leather & Fabric Coating + Window Tint + Halo Ceramic + Glass Ceramic + Wheel Armour + 0% Windscreen Film.","Saves AED 4,000+","10 years"],
                  ["Signature","Everything in Elite + Windscreen Protection Film + Panoramic Sunroof Protection + 12 Safe Washes + 5 Panel Replacements in 12 months.","Saves AED 10,000+","10 years"],
                ].map(([pkg,desc,saving,warranty],i,a)=>(
                  <div key={pkg} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:i<a.length-1?`1px solid ${T.border}`:"none", alignItems:"flex-start" }}>
                    <div style={{ width:90, fontWeight:700, color:T.gold, fontSize:12, flexShrink:0 }}>{pkg}</div>
                    <div style={{ flex:1, fontSize:12, color:T.muted, lineHeight:1.55 }}>{desc}</div>
                    <div style={{ width:110, fontSize:11, color:T.greenTx, fontWeight:600, flexShrink:0, textAlign:"right" }}>{saving}</div>
                    <div style={{ width:60, fontSize:11, color:T.muted, flexShrink:0, textAlign:"right" }}>{warranty}</div>
                  </div>
                ))}
              </Card>
              <SectionLabel>Pricing by vehicle type</SectionLabel>
              <Card style={{ padding:"0.75rem 1.25rem", marginBottom:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8, marginBottom:6 }}>
                  {["Vehicle","Essential","Elite","Signature"].map(h=><div key={h} style={{ fontSize:11, fontWeight:700, color:T.faint, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</div>)}
                </div>
                {[
                  ["Coupe","AED 14,000","AED 17,950","AED 22,950"],
                  ["Small SUV / Saloon","AED 14,495","AED 18,950","AED 23,950"],
                  ["Large SUV","AED 16,950","AED 20,950","AED 26,950"],
                  ["Hypercar / Exotic","AED 19,000","AED 23,950","AED 28,950"],
                ].map(([v,e,el,s],i,a)=>(
                  <div key={v} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8, padding:"7px 0", borderTop:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{v}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{e}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{el}</div>
                    <div style={{ fontSize:12, color:T.gold, fontWeight:600 }}>{s}</div>
                  </div>
                ))}
              </Card>
              <SectionLabel>Shogun PPF product range</SectionLabel>
              <StepBlock title="Gloss Films" desc="X8 Plus — SIGNATURE PRODUCT. Engineered for Middle East climate. Over 90 GU gloss, anti-yellowing, 10-year warranty. Track — racing-grade, 9.7mil thick. Obsidian Black — stylish black gloss. X7 — quality and affordability." />
              <StepBlock title="Matte Films" accent={T.purple} desc="Shogun Matte — pure matte, under 20 GU. Kuro Matte — stealth black, under 20 GU. Satin — smooth finish, 20 to 30 GU." />
              <StepBlock title="Specialist Films" accent={T.blue} desc="Panorama — glass sunroof protection, 98% UV rejection, 95% IR rejection, self-healing. WPF-7 — windshield protection, shatter-resistant and self-healing." />
              <Alert variant="info">All Shogun PPF: 10-year warranty against fading, bubbling, discolouration, cracking, peeling, and adhesion failure. All films tested for chemical and stain resistance. TPU film manufactured in Nagoya, Japan.</Alert>
              <SectionLabel>Upsell process</SectionLabel>
              <StepBlock n="Step 1" title="Introduce PPF during the appointment" desc="After building rapport and before or during the test drive, introduce the RMA PPF concept: most buyers add protection to keep the car in showroom condition long-term." />
              <StepBlock n="Step 2" title="Recommend the Elite package first" desc="The Elite is the most popular — it saves the customer over AED 4,000 compared to buying services separately and comes with a 10-year warranty. Describe what is included: full body PPF, interior protection, tints, ceramic coating." />
              <StepBlock n="Step 3" title="Mention the Signature for high-value vehicles" desc="For Hypercars, Exotics, and premium SUVs: the Signature package adds 5 panel replacements and 12 professional safe washes — over AED 10,000 in extra value. Well suited to buyers who want complete peace of mind." />
              <StepBlock n="Step 4" title="Hand to the PPF team for consultation" desc="Never quote a final price over the phone or without the PPF team present. Hand the customer to the PPF team for a full in-person consultation, colour/finish selection, and formal quote." />
              <Alert variant="warn">The best price will only be discussed in person. Never give final PPF pricing over the phone or before the PPF team consultation.</Alert>
            </div>)}
            {activeSop==="disciplinary" && (<div>
              <StepBlock n="Stage 1" title="Verbal Warning" desc="Trigger: 1st offence or 1st-month performance review identifying sub-standard KPI output. Action: Department Manager and Witnessing Manager arrange a formal meeting. Outcome: Verbal Warning issued and documented in employee file. Training needs identified immediately and a formal training plan put in place." />
              <StepBlock n="Stage 2" title="Formal Written Warning" accent={T.amber} desc="Trigger: 2nd offence or 2nd month of underperformance. Action: Department Manager requests a formal Written Warning letter from HR. The letter details data-driven underperformance and is signed by the Department Manager, Witnessing Manager, and the employee. Two copies produced — one for the employee, one for HR. Active on record for 6 months." />
              <StepBlock n="Stage 3" title="Final Written Warning" accent={T.red} desc="Trigger: 3rd offence or 3rd month of underperformance. A Final Written Warning is issued, signed by all parties. Retention: 6 months active. Final review of training needs and a final recovery plan implemented." />
              <StepBlock n="Stage 4" title="Termination of Employment" accent={T.red} desc="Trigger: Further offence, continued underperformance after Final Written Warning, or 4th month of underperformance. A Letter of Termination is issued by HR. Employee must immediately return all company property — devices, IDs, keys. Passwords and PINs must be provided. Employee is escorted from the premises." />
              <Alert variant="warn">Non-gross misconduct examples: repeated lateness, unauthorised absence, poor call quality, failure to meet call KPIs.</Alert>
              <Alert variant="danger">Gross misconduct (immediate investigation): loss of company money due to negligence, aggressive behaviour, insubordination, bringing the company into disrepute, or breaches of UAE PDPL (Personal Data Protection Law).</Alert>
            </div>)}
            {activeSop==="marketing" && (<div>
              <SectionLabel style={{ marginTop:0 }}>1. Vehicle listing & inventory management</SectionLabel>
              <StepBlock n="Goal" title="All vehicles live within 24 hours of reconditioning sign-off" accent={T.purple} desc="Every new vehicle must be advertised across all designated platforms within 24 hours. Photography is requested by the Purchaser immediately on vehicle arrival." />
              <StepBlock title="Platform management" accent={T.purple} desc="Listings managed across: RMA Website, Dubizzle, Yalla Motors, and DubiCars. Premium and Featured ads managed on Dubizzle and Yalla for maximum visibility." />
              <StepBlock title="Ad content workflow" accent={T.purple} desc="Sales Team members provide ad content via the 'ADS ONLY' group by midday. Marketing approves or rejects with comments. Approved content is then listed across all platforms." />
              <Alert variant="warn">Car sold or status changes → ALL listings updated or removed immediately across every platform. No delay whatsoever — this is non-negotiable.</Alert>

              <SectionLabel>2. Content creation — photography & video</SectionLabel>
              <StepBlock title="Photography standards" accent={T.purple} desc="Minimum of 15 high-quality photos per vehicle using company-standard angles. Vehicles must be staged and positioned correctly in the photo bay in the Car Care Showroom before photography begins." />
              <StepBlock title="Editing workflow" accent={T.purple} desc="Photos uploaded to the shared network drive. Marketing coordinates with the external photo editor. Final images reviewed before going live." />
              <StepBlock title="Video content" accent={T.purple} desc="30-second video tour per car — ideally filmed with a Sales Rep and used to send to potential customers. Also used for 'Just Arrived' social posts and BAMFAM follow-up sequences." />
              <StepBlock title="Milanote" accent={T.purple} desc="Used for mood boards, campaign storyboards, and organising visual assets. All campaign ideas presented weekly in the Marketing Team meeting." />

              <SectionLabel>3. Pricing, reservations & status updates</SectionLabel>
              <StepBlock title="Change request process" accent={T.blue} desc="All platform amendments must go through the mandatory 'Website/Platform Change Requests' form. No informal requests accepted." />
              {[
                ["Price changes","Directed by Purchasing and Management. Update all platforms immediately."],
                ["Vehicle reservations","Update reserved/viewing status across all platforms immediately when status changes."],
                ["Bombed deals","Remove vehicles from all platforms immediately if a deal falls through or status changes."],
                ["Sold vehicles","Immediate removal across every platform — no exceptions and no delays."],
              ].map(([t,d])=>(
                <div key={t} style={{ display:"flex", gap:12, padding:"7px 0", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                  <div style={{ width:160, fontWeight:700, color:T.amber, flexShrink:0 }}>{t}</div>
                  <div style={{ color:T.muted, lineHeight:1.5 }}>{d}</div>
                </div>
              ))}
              <div style={{ height:8 }} />

              <SectionLabel>4. Social media & organic growth</SectionLabel>
              <StepBlock title="Daily 'Just Arrived' content" accent={T.purple} desc="Request three vehicles from the Purchasing Team daily to feature on social media stories and groups. Post across Instagram, Facebook, and TikTok." />
              <StepBlock title="Platform content" accent={T.purple} desc="Instagram and Facebook: high-volume behind-the-scenes content, vehicle reveals, testimonials. TikTok: short-form engaging content. All scheduled and managed via Meta Business Suite." />
              <StepBlock title="Testimonials" accent={T.purple} desc="Capture and format customer reviews and testimonials at the point of handover. Use to build brand trust across all platforms and in the BAMFAM follow-up sequence." />

              <SectionLabel>5. Ad campaigns & lead generation</SectionLabel>
              <StepBlock title="Ad strategy" accent={T.blue} desc="Bi-weekly campaign meetings with Calum Siddons and Dean Frost. Two key campaign types: 'Buy your car' and 'Sell your car' lead generation." />
              <StepBlock title="Google Ads & reviews" accent={T.blue} desc="Google Search and Display ads drive inbound buyer and seller leads. High-volume Google Reviews are critical to ad performance and organic visibility. Every setter and sales rep must request a Google Review at the point of handover." />

              <SectionLabel>6. Your personal asset library (required)</SectionLabel>
              <div style={{ fontSize:12, color:T.muted, marginBottom:10, lineHeight:1.65 }}>Build and maintain your personal asset library in your first week. These assets are sent throughout the BAMFAM sequence and directly improve engagement rates and show rates.</div>
              {["Intro to you and RMA Motors video","3 FAQ videos — answering the most common buyer questions","Authority/expert video — 'How to avoid costly mistakes when buying a car in the UAE'","Vehicle walkaround Snap Cells — specific to each customer enquiry","30-second video tour per car — ideally filmed with a Sales Rep","Social proof and testimonial videos"].map((item,i)=>(
                <div key={i} style={{ display:"flex", gap:10, padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:T.purpleBg, color:T.purpleTx, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                  <div style={{ color:T.muted, lineHeight:1.55 }}>{item}</div>
                </div>
              ))}
            </div>)}
          </div>
        )}

        {activeTab==="kpis" && (
          <div>
            <SectionLabel style={{ marginTop:0 }}>Performance targets</SectionLabel>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:10, marginBottom:"1.5rem" }}>
              {[["⏱","Speed to lead","60 seconds","All inbound leads — no exceptions"],["📅","Lead → appointment","33% min","Responded leads → booked"],["🚪","Show rate","66% min","Booked appointments that attend"],["📹","Snap cells","50% min","Of responded customers"],["📞","Connected calls","40 / day","Min 1 minute each"],["⭐","AI call score","80% avg","CallGear — in & outbound"]].map(([ico,l,v,n])=>(
                <div key={l} style={{ background:T.surf, borderRadius:10, padding:"1rem", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{ico}</div>
                  <div style={{ fontSize:11, color:T.muted, marginBottom:4, fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:T.gold }}>{v}</div>
                  <div style={{ fontSize:11, color:T.faint, marginTop:3 }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="assessments" && (
          <div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1.25rem" }}>
              {Object.entries(activeQuizzes).map(([id,q])=>{
                const score=setterData?.quizScores?.[id];
                return (
                  <button key={id} className={`sub-tab ${activeQuiz===id?"active":""}`} onClick={()=>{ setActiveQuiz(id); setQuizAnswers(setterData?.quizAnswers||{}); }}>
                    {q.icon} {q.label}
                    {quizBlocked[id] && <span style={{ marginLeft:6, fontSize:10, color:T.redTx, fontWeight:800 }}>🔒</span>}
                  {!quizBlocked[id] && score!==undefined && <span style={{ marginLeft:6, fontSize:10, color:score>=90?T.greenTx:T.redTx, fontWeight:800 }}>({score}%)</span>}
                  </button>
                );
              })}
            </div>
            {(()=>{
              if (quizBlocked[activeQuiz]) return (
                <div style={{ background:T.redBg, border:`1px solid ${T.red}`, borderRadius:12, padding:"2rem", textAlign:"center", marginTop:"1rem" }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.redTx, marginBottom:8 }}>Assessment locked</div>
                  <div style={{ fontSize:13, color:T.muted, lineHeight:1.65 }}>You have used all 3 attempts for this assessment. Your manager must unlock it before you can retake. Please review the relevant SOP and training materials in the meantime.</div>
                </div>
              );
              const quiz=activeQuizzes[activeQuiz], savedScore=setterData?.quizScores?.[activeQuiz], total=quiz.questions.length;
              const answeredCount=quiz.questions.filter((_,i)=>quizAnswers[`${activeQuiz}-${i}`]!==undefined).length;
              const allDone=answeredCount===total;
              const liveScore=allDone?Math.round((quiz.questions.filter((_,i)=>quizAnswers[`${activeQuiz}-${i}`]?.correct).length/total)*100):null;
              const displayScore=savedScore??liveScore;
              return (
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:8 }}>
                    <div style={{ fontSize:13, color:T.muted }}>{quiz.label} — {total} questions based on your RMA Motors SOPs.</div>
                    {savedScore!==undefined && <span style={{ fontSize:12, fontWeight:700, color:savedScore>=90?T.greenTx:T.redTx }}>{savedScore>=90?"✓":"✗"} Best score: {savedScore}%</span>}
                  </div>
                  {quiz.questions.map((q,qi)=>{
                    const key=`${activeQuiz}-${qi}`, ans=quizAnswers[key];
                    return (
                      <div key={qi} style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"1rem 1.25rem", marginBottom:"0.75rem" }}>
                        <div style={{ fontSize:13, fontWeight:700, marginBottom:"0.85rem", lineHeight:1.55, color:T.text }}>{qi+1}. {q.q}</div>
                        {(()=>{
                          const order = getShuffled(activeQuiz, qi, q.opts);
                          return order.map((origIdx, displayIdx) => {
                            const opt = q.opts[origIdx];
                            let bg=T.surf, border=T.border, color=T.muted, fw=400;
                            if (ans!==undefined) {
                              if (ans.correct && origIdx===q.correct) { bg=T.greenBg; border=T.green; color=T.greenTx; fw=600; }
                              else if (!ans.correct && origIdx===ans.chosen) { bg=T.redBg; border=T.red; color=T.redTx; fw=600; }
                            }
                            return (
                              <div key={displayIdx} className={ans===undefined?"quiz-opt":""} onClick={()=>handleQuizAnswer(qi,origIdx)}
                                style={{ padding:"9px 14px", border:`1px solid ${border}`, borderRadius:8, marginBottom:6, cursor:ans?"default":"pointer", fontSize:13, lineHeight:1.5, background:bg, color, fontWeight:fw }}>
                                {opt}
                              </div>
                            );
                          });
                        })()}
                        {ans!==undefined && (
                          <div style={{ fontSize:12, padding:"9px 12px", borderRadius:8, marginTop:8, background:ans.correct?T.greenBg:T.redBg, border:`1px solid ${ans.correct?T.green:T.red}`, color:ans.correct?T.greenTx:T.redTx, lineHeight:1.55 }}>
                            {ans.correct ? <><strong>✓ Correct!</strong></> : <><strong>✗ Incorrect.</strong> {" "}{q.exp}</>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allDone&&displayScore!==null&&(
                    <div style={{ padding:"1.5rem", borderRadius:14, textAlign:"center", background:displayScore>=90?T.greenBg:quizBlocked[activeQuiz]?T.redBg:T.amberBg, border:`1px solid ${displayScore>=90?T.green:quizBlocked[activeQuiz]?T.red:T.amber}`, marginTop:10 }}>
                      <div style={{ fontSize:28, fontWeight:800, color:displayScore>=90?T.greenTx:quizBlocked[activeQuiz]?T.redTx:T.amberTx }}>{displayScore}%</div>
                      <div style={{ fontSize:13, color:displayScore>=90?T.greenTx:quizBlocked[activeQuiz]?T.redTx:T.amberTx }}>{quiz.questions.filter((_,i)=>quizAnswers[`${activeQuiz}-${i}`]?.correct).length}/{total} correct</div>
                      <div style={{ fontSize:12, color:T.muted, marginTop:6 }}>
                        {displayScore>=90 ? "✓ Passed — your score has been saved and is visible to your manager."
                        : quizBlocked[activeQuiz] ? "🔒 You have used all 3 attempts. This assessment is now locked. Your manager must unlock it before you can retake."
                        : `✗ Below 90% — review the relevant SOP and training materials and retake. Attempts remaining: ${3-(quizAttempts[activeQuiz]||0)}.`}
                      </div>
                    </div>
                  )}
                  {allDone && !quizBlocked[activeQuiz] && displayScore < 90 && <div style={{ marginTop:10 }}><Btn small primary onClick={()=>{ setQuizAnswers({}); setShuffledOpts({}); }}>Retake quiz</Btn></div>}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
