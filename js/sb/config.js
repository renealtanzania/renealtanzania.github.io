// Supabase Configuration
// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project settings

const SUPABASE_URL = 'https://efxqqqfcofoivsoktcbu.supabase.co'; // e.g., 'https://xxxxxxxxxxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmeHFxcWZjb2ZvaXZzb2t0Y2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTkwNzksImV4cCI6MjA4MTYzNTA3OX0.whjnEH5pPAjBfPJh1JwpEZivhtFtBMOqKldDsA9DC5M'; // Your anon/public key

// Initialize Supabase client with error checking
// Use window.supabaseClient to avoid redeclaration errors
window.supabaseClient = window.supabaseClient || null;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded. Please check your internet connection.');
        return null;
    }
    
    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.error('Please configure SUPABASE_URL in js/config.js');
        return null;
    }
    
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('Please configure SUPABASE_ANON_KEY in js/config.js');
        return null;
    }
    
    try {
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return null;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.supabaseClient = initSupabase();
    });
} else {
    window.supabaseClient = initSupabase();
}

// Pre-defined users from your JSON (for reference/initialization)
// These will be migrated to Supabase on first setup
const INITIAL_USERS = [
  {
    "name": "Rene Bierbaum",
    "email": "rene@gmail.com",
    "status": "Active",
    "password": "reneb works",
    "position": "founder",
    "role": "admin"
  },
  {
    "name": "David Nyangaka",
    "email": "david@gmail.com",
    "status": "Active",
    "password": "11223344",
    "position": "director",
    "role": "admin"
  },
  {
    "name": "Justin Msechu",
    "email": "justin@gmail.com",
    "status": "Active",
    "password": "11223344",
    "position": "technician",
    "role": "team-member"
  },
  {
    "name": "James Ngahemelwa",
    "email": "james@gmail.com",
    "status": "Active",
    "password": "11223344",
    "position": "technician",
    "role": "team-member"
  },
  {
    "name": "Erick M",
    "email": "erick@gmail.com",
    "status": "Active",
    "password": "00Reneal",
    "position": "web developer",
    "role": "super-admin"
  },
  {
    "name": "Juma Ramadhani",
    "email": "juma@gmail.com",
    "status": "Active",
    "password": "11223344",
    "position": "technician",
    "role": "team-member"
  },
  {
    "name": "Aboubakar Frenk",
    "email": "abou@gmail.com",
    "status": "Active",
    "password": "11223344",
    "position": "technician",
    "role": "team-member"
  },
  {
    "name": "Ashura Yusuph",
    "email": "ashura@gmail.com",
    "status": "Active",
    "password": "11223344",
    "position": "media",
    "role": "team-member"
  },
  {
    "name": "Janeth Mbaga",
    "email": "janeth@gmail.com",
    "status": "Active",
    "password": "11223344",
    "position": "technician",
    "role": "team-member"
  },
  {
    "name": "Daniel Nkoo",
    "email": "daniel@gmail.com",
    "status": "Active",
    "password": "11223344",
    "position": "technician",
    "role": "team-member"
  }
];