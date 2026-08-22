SermonCard.tsx



web application/stitch/projects/12083215338262457677/screens/436b80a09e8c4d35b389d926a46d6bb1

import React from 'react';



interface Sermon {

&#x20; id: string;

&#x20; title: string;

&#x20; series: string;

&#x20; preacher: string;

&#x20; date: string;

&#x20; tags: string\[];

&#x20; imageUrl: string;

&#x20; duration?: string;

}



const SermonCard: React.FC<{ sermon: Sermon }> = ({ sermon }) => {

&#x20; return (

&#x20;   <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/60 p-3 backdrop-blur-md transition-all duration-300 hover:bg-white/80 hover:shadow-xl active:scale-\[0.98]">

&#x20;     {/\* Artwork Container \*/}

&#x20;     <div className="relative aspect-video w-full overflow-hidden rounded-xl">

&#x20;       <img 

&#x20;         src={sermon.imageUrl} 

&#x20;         alt={sermon.title}

&#x20;         className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"

&#x20;       />

&#x20;       

&#x20;       {/\* Subtle Play Overlay \*/}

&#x20;       <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">

&#x20;         <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-\[oklch(0.45\_0.2\_260)] shadow-lg backdrop-blur-sm">

&#x20;           <span className="material-symbols-outlined text-3xl">play\_arrow</span>

&#x20;         </div>

&#x20;       </div>



&#x20;       {/\* Duration Badge \*/}

&#x20;       {sermon.duration \&\& (

&#x20;         <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-\[10px] font-medium text-white backdrop-blur-sm">

&#x20;           {sermon.duration}

&#x20;         </div>

&#x20;       )}

&#x20;     </div>



&#x20;     {/\* Content \*/}

&#x20;     <div className="mt-3 flex flex-col space-y-1">

&#x20;       <span className="text-\[10px] font-bold uppercase tracking-wider text-\[oklch(0.45\_0.2\_260)]/60">

&#x20;         {sermon.series}

&#x20;       </span>

&#x20;       <h3 className="line-clamp-1 text-base font-semibold text-\[oklch(0.2\_0.02\_260)]">

&#x20;         {sermon.title}

&#x20;       </h3>

&#x20;       <div className="flex items-center text-xs text-gray-500">

&#x20;         <span>{sermon.preacher}</span>

&#x20;         <span className="mx-1.5 h-1 w-1 rounded-full bg-gray-300" />

&#x20;         <span>{sermon.date}</span>

&#x20;       </div>



&#x20;       {/\* Tags \*/}

&#x20;       <div className="mt-2 flex flex-wrap gap-1.5">

&#x20;         {sermon.tags.slice(0, 2).map((tag) => (

&#x20;           <span 

&#x20;             key={tag} 

&#x20;             className="rounded-full bg-\[oklch(0.45\_0.2\_260)]/5 px-2 py-0.5 text-\[10px] font-medium text-\[oklch(0.45\_0.2\_260)]"

&#x20;           >

&#x20;             {tag}

&#x20;           </span>

&#x20;         ))}

&#x20;       </div>

&#x20;     </div>

&#x20;     

&#x20;     {/\* Options Menu \*/}

&#x20;     <button className="absolute right-2 top-\[calc(100%-40px)] p-2 text-gray-400 hover:text-gray-600">

&#x20;       <span className="material-symbols-outlined text-xl">more\_vert</span>

&#x20;     </button>

&#x20;   </div>

&#x20; );

};



export default SermonCard;



\---



FilterBar.tsx



web application/stitch/projects/12083215338262457677/screens/103658a41da74fdf9bcb197f6b746b80

import React from 'react';



const FilterBar: React.FC = () => {

&#x20; const filters = \['Preacher', 'Series', 'Date', 'Topics', 'Scripture'];



&#x20; return (

&#x20;   <div className="sticky top-0 z-40 w-full border-b border-white/80 bg-\[oklch(0.98\_0.01\_260)]/80 p-4 backdrop-blur-xl">

&#x20;     <div className="mx-auto flex max-w-screen-xl items-center gap-3">

&#x20;       {/\* Integrated Search Trigger \*/}

&#x20;       <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60 border border-white/80 text-\[oklch(0.45\_0.2\_260)] shadow-sm transition-transform active:scale-90">

&#x20;         <span className="material-symbols-outlined">search</span>

&#x20;       </button>



&#x20;       {/\* Horizontal Scrolling Filter Ribbon \*/}

&#x20;       <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto pb-0.5">

&#x20;         {filters.map((filter) => (

&#x20;           <button

&#x20;             key={filter}

&#x20;             className="flex items-center whitespace-nowrap rounded-full border border-white/80 bg-white/60 px-4 py-1.5 text-sm font-medium text-\[oklch(0.2\_0.02\_260)] shadow-sm transition-all hover:bg-white active:scale-95"

&#x20;           >

&#x20;             {filter}

&#x20;             <span className="material-symbols-outlined ml-1 text-sm opacity-50">expand\_more</span>

&#x20;           </button>

&#x20;         ))}

&#x20;       </div>

&#x20;     </div>

&#x20;   </div>

&#x20; );

};



export default FilterBar;



\---



page.tsx



web application/stitch/projects/12083215338262457677/screens/84b8848c0420439eb8fa74152abcad53

import React, { useState } from 'react';

import FilterBar from './FilterBar';

import SermonCard from './SermonCard';



// Mock data for sermons

const SERMONS = \[

&#x20; {

&#x20;   id: '1',

&#x20;   title: 'Silence \& Solitude',

&#x20;   series: 'The Kingdom Within',

&#x20;   preacher: 'Dr. Sarah Jenkins',

&#x20;   date: 'Oct 12, 2023',

&#x20;   tags: \['Contemplation', 'Peace'],

&#x20;   imageUrl: '{{DATA:IMAGE:IMAGE\_1}}', // Assuming image placeholders exist

&#x20;   duration: '45:20'

&#x20; },

&#x20; {

&#x20;   id: '2',

&#x20;   title: 'Blessed are the Meek',

&#x20;   series: 'Sermon on the Mount',

&#x20;   preacher: 'Rev. Thomas Cole',

&#x20;   date: 'Sep 28, 2023',

&#x20;   tags: \['Humility'],

&#x20;   imageUrl: '{{DATA:IMAGE:IMAGE\_2}}',

&#x20;   duration: '38:15'

&#x20; },

&#x20; {

&#x20;   id: '3',

&#x20;   title: 'Navigating Cultural Shifts',

&#x20;   series: 'Stand Alone',

&#x20;   preacher: 'Dr. David Chen',

&#x20;   date: 'Sep 14, 2023',

&#x20;   tags: \['Culture', 'Wisdom'],

&#x20;   imageUrl: '{{DATA:IMAGE:IMAGE\_3}}',

&#x20;   duration: '52:40'

&#x20; }

];



export default function Homepage() {

&#x20; const \[activeTab, setActiveTab] = useState<'browse' | 'ask'>('browse');



&#x20; return (

&#x20;   <div className="min-h-screen bg-\[oklch(0.98\_0.01\_260)] font-sans text-\[oklch(0.2\_0.02\_260)] selection:bg-\[oklch(0.45\_0.2\_260)]/10">

&#x20;     {/\* Header \& Hero Area \*/}

&#x20;     <header className="relative px-6 pt-8 pb-12">

&#x20;       <div className="mx-auto max-w-screen-xl">

&#x20;         <div className="flex items-center justify-between">

&#x20;           <h1 className="text-xl font-bold tracking-tight text-\[oklch(0.45\_0.2\_260)]">

&#x20;             Citizens Library

&#x20;           </h1>

&#x20;           <div className="h-10 w-10 rounded-full bg-white/80 border border-white/80 p-0.5 shadow-sm overflow-hidden">

&#x20;               <img src="/api/placeholder/40/40" alt="Profile" className="rounded-full object-cover" />

&#x20;           </div>

&#x20;         </div>



&#x20;         <div className="mt-12 flex flex-col items-center text-center">

&#x20;           <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">

&#x20;             Explore <br />

&#x20;             <span className="text-\[oklch(0.45\_0.2\_260)]">The Archive</span>

&#x20;           </h2>

&#x20;           

&#x20;           {/\* Immersive Segment Toggle \*/}

&#x20;           <div className="mt-8 flex rounded-full bg-white/40 p-1 backdrop-blur-md border border-white/80 shadow-inner">

&#x20;             <button

&#x20;               onClick={() => setActiveTab('browse')}

&#x20;               className={`rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 ${

&#x20;                 activeTab === 'browse' 

&#x20;                   ? 'bg-white text-\[oklch(0.45\_0.2\_260)] shadow-md' 

&#x20;                   : 'text-gray-500 hover:text-gray-700'

&#x20;               }`}

&#x20;             >

&#x20;               Browse Library

&#x20;             </button>

&#x20;             <button

&#x20;               onClick={() => setActiveTab('ask')}

&#x20;               className={`rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 ${

&#x20;                 activeTab === 'ask' 

&#x20;                   ? 'bg-white text-\[oklch(0.45\_0.2\_260)] shadow-md' 

&#x20;                   : 'text-gray-500 hover:text-gray-700'

&#x20;               }`}

&#x20;             >

&#x20;               Ask AI

&#x20;             </button>

&#x20;           </div>

&#x20;         </div>

&#x20;       </div>

&#x20;     </header>



&#x20;     {/\* Sticky Filter Bar \*/}

&#x20;     <FilterBar />



&#x20;     {/\* Main Content Grid \*/}

&#x20;     <main className="mx-auto max-w-screen-xl px-6 py-8 pb-32">

&#x20;       <div className="mb-6 flex items-center justify-between">

&#x20;         <h3 className="text-lg font-bold">Latest Sermons</h3>

&#x20;         <button className="text-xs font-semibold text-\[oklch(0.45\_0.2\_260)] hover:underline">

&#x20;           View All

&#x20;         </button>

&#x20;       </div>



&#x20;       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

&#x20;         {SERMONS.map((sermon) => (

&#x20;           <SermonCard key={sermon.id} sermon={sermon} />

&#x20;         ))}

&#x20;       </div>

&#x20;     </main>



&#x20;     {/\* Bottom Global Player Buffer \*/}

&#x20;     <div className="fixed bottom-0 left-0 h-24 w-full pointer-events-none bg-gradient-to-t from-\[oklch(0.98\_0.01\_260)] to-transparent" />

&#x20;   </div>

&#x20; );

}

